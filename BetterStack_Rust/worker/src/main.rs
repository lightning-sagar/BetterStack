use std::error::Error;

use chrono::Utc;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl, sql_query, sql_types::{Integer, Text, Timestamp}};
use redis_stream::{BulkXAck, XReadGroup};
use reqwest::Client;
use store::{Store, schema::Region};
use tokio::time::{timeout, Duration};
use uuid::Uuid;

async fn resolve_region_id(store: &mut Store, region_input: &str) -> Result<String, diesel::result::Error> {
    if let Ok(region_id) = Region::table
        .filter(Region::id.eq(region_input))
        .select(Region::id)
        .first::<String>(&mut store.conn)
    {
        return Ok(region_id);
    }

    if let Ok(region_id) = Region::table
        .filter(Region::name.eq(region_input))
        .select(Region::id)
        .first::<String>(&mut store.conn)
    {
        return Ok(region_id);
    }

    let region_id = Uuid::new_v4().to_string();
    diesel::insert_into(Region::table)
        .values((Region::id.eq(&region_id), Region::name.eq(region_input)))
        .execute(&mut store.conn)?;

    println!("Created missing region '{}' with id {}", region_input, region_id);
    Ok(region_id)
}

fn persist_website_tick(
    store: &mut Store,
    website_id: &str,
    region_id: &str,
    response_time_ms: i32,
    status_code: &str,
) -> Result<usize, diesel::result::Error> {
    let tick_id = Uuid::new_v4().to_string();
    let checked_at = Utc::now().naive_utc();

    sql_query(
        r#"
        INSERT INTO "WebsiteTick" (id, response_time_ms, status_code, time_checked, region_id, website_id)
        VALUES ($1, $2, CAST($3 AS "StatusCode"), $4, $5, $6)
        "#,
    )
    .bind::<Text, _>(tick_id)
    .bind::<Integer, _>(response_time_ms)
    .bind::<Text, _>(status_code)
    .bind::<Timestamp, _>(checked_at)
    .bind::<Text, _>(region_id)
    .bind::<Text, _>(website_id)
    .execute(&mut store.conn)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().ok();

    let region_input = std::env::var("REGION_ID")
        .or_else(|_| std::env::var("REGION_NAME"))
        .unwrap_or_else(|_| "india".to_string());
    let worker_id = std::env::var("WORKER_ID").unwrap_or_else(|_| "1".to_string());
    let consumer_group = std::env::var("CONSUMER_GROUP").unwrap_or_else(|_| "worker-group".to_string());

    let http_client = Client::new();
    let mut store = Store::default()?;
    let region_id = resolve_region_id(&mut store, &region_input).await?;
    let mut redis = redis_stream::connectRedis().await?;

    loop {
        let res = XReadGroup(&mut redis, &worker_id, &consumer_group).await?;
        println!("XReadGroup Result: {:?}", res);

        if res.is_empty() {
            println!("No messages to process");
            continue;
        }

        let mut ack_ids = Vec::new();

        for item in res {
            let url = item.message.url;
            let website_id = item.message.id;
            println!("Processing item with URL: {} and ID: {}", url, website_id);
            let start_time = std::time::Instant::now();

            let status_code = match timeout(Duration::from_secs(30), http_client.get(format!("https://{url}")).send()).await {
                Ok(Ok(response)) if response.status().is_success() => "Up",
                Ok(Ok(_)) => "Down",
                Ok(Err(_)) | Err(_) => "Down",
            };

            let response_time_ms = start_time.elapsed().as_millis() as i32;

            match persist_website_tick(
                &mut store,
                &website_id,
                &region_id,
                response_time_ms,
                status_code,
            ) {
                Ok(_) => {
                    println!("Persisted tick for URL: {} and ID: {}", url, website_id);
                    ack_ids.push(item.id);
                }
                Err(db_err) => {
                    eprintln!("Failed to persist tick for URL: {} and ID: {}: {}", url, website_id, db_err);
                }
            }

            println!("Finished processing item with URL: {} and ID: {}", url, website_id);
        }

        println!("Processed {} items, acknowledging {}.", ack_ids.len(), ack_ids.len());
        BulkXAck(&mut redis, &consumer_group, &ack_ids).await?;
    }
}
