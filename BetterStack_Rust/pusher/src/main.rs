use std::error::Error;
use std::time::Duration;

use redis_stream::{BulkXAdd, WebsiteAdd, connectRedis};
use store::Store;
use tokio::time::interval;

async fn run_once(store: &mut Store, redis: &mut redis_stream::Redis) -> Result<(), Box<dyn Error>> {
    let websites = store.get_websites()?;
    let websites: Vec<WebsiteAdd> = websites
        .into_iter()
        .map(|website| WebsiteAdd {
            url: website.url,
            id: website.id,
        })
        .collect();

    println!("Pushing {} websites to Redis stream...", websites.len());
    BulkXAdd(redis, &websites).await?;
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().ok();

    let mut store = Store::default()?;
    let mut redis = connectRedis().await?;
    let mut ticker = interval(Duration::from_secs(180));

    loop {
        ticker.tick().await;
        if let Err(error) = run_once(&mut store, &mut redis).await {
            eprintln!("Pusher failed: {error}");
        }
    }
}
