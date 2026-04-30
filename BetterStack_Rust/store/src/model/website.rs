use chrono::NaiveDateTime;
use diesel::{
    ExpressionMethods, QueryableByName, RunQueryDsl, Selectable, SelectableHelper,
    OptionalExtension,
    prelude::{Insertable, Queryable},
    query_dsl::methods::{FilterDsl, SelectDsl},
    sql_query,
    sql_types::{BigInt, Integer, Nullable, Text, Timestamp},
};
use std::collections::HashMap;
use uuid::Uuid;
use crate::{store::Store};
// diffeernce bw queryable and selectable is that queryable is used to map the result of a query to a struct, while selectable is used to define a struct that can be used in a select statement.
#[derive(Queryable, Selectable, Insertable, Debug)]
#[diesel(table_name = crate::schema::Website)]
#[diesel(check_for_backend(diesel::pg::Pg))]

pub struct Website{
    pub id: String,
    pub url: String,
    pub created_at: chrono::NaiveDateTime,
    pub user_id: String,
}

#[derive(Clone, Debug, QueryableByName)]
pub struct WebsiteTickWithRegion {
    #[diesel(sql_type = Text)]
    pub id: String,
    #[diesel(sql_type = Integer)]
    pub response_time_ms: i32,
    #[diesel(sql_type = Text)]
    pub status_code: String,
    #[diesel(sql_type = Timestamp)]
    pub time_checked: NaiveDateTime,
    #[diesel(sql_type = Text)]
    pub region_id: String,
    #[diesel(sql_type = Text)]
    pub website_id: String,
    #[diesel(sql_type = Nullable<Text>)]
    pub region_name: Option<String>,
}

#[derive(Clone, Debug, QueryableByName)]
pub struct IncidentRaw {
    #[diesel(sql_type = Text)]
    pub id: String,
    #[diesel(sql_type = Text)]
    pub website_id: String,
    #[diesel(sql_type = Nullable<Text>)]
    pub website_url: Option<String>,
    #[diesel(sql_type = Text)]
    pub status: String,
    #[diesel(sql_type = Integer)]
    pub response_time_ms: i32,
    #[diesel(sql_type = Nullable<Text>)]
    pub region_name: Option<String>,
    #[diesel(sql_type = Timestamp)]
    pub time_checked: NaiveDateTime,
}

#[derive(Clone, Debug)]
pub struct DownWebsiteSummary {
    pub website_id: String,
    pub website_url: String,
    pub down_count: i32,
    pub latest_down_at: NaiveDateTime,
    pub regions: Vec<String>,
}

impl Store {
    
    pub fn create_website(&mut self, url:String, user_id:String)->Result<Website, diesel::result::Error>{
        let id = Uuid::new_v4();
        if url == "".to_string() || user_id == "".to_string(){
            return Err(diesel::result::Error::NotFound);
        }
            
        let is_user_exist = crate::schema::User::table
            .filter(crate::schema::User::id.eq(&user_id))
            .select(crate::schema::User::id)
            .first::<String>(&mut self.conn)
            .is_ok();
        if !is_user_exist {
            return Err(diesel::result::Error::NotFound);
        }
        let website = Website {
            id: id.to_string(),
            url: url.clone(),
            created_at: chrono::Utc::now().naive_utc(),
            user_id: user_id, 
        };
        let res: Website = diesel::insert_into(crate::schema::Website::table)
            .values(&website)
            .returning(Website::as_returning())// using as_returning to return the inserted website thanks to the selectable trait
            .get_result(&mut self.conn)?;
        Ok(res)
    }

    pub fn get_website(&mut self, user_id:String)->Result<Vec<Website>, diesel::result::Error>{
        if user_id == "".to_string(){
            return Err(diesel::result::Error::NotFound);
        }

        let websites: Vec<Website> = crate::schema::Website::table
            .filter(crate::schema::Website::user_id.eq(user_id))
            .select(Website::as_select())
            .load::<Website>(&mut self.conn)?;

        Ok(websites)
    }

    pub fn search_websites(&mut self, user_id: String, query: String) -> Result<Vec<Website>, diesel::result::Error> {
        if user_id.is_empty() {
            return Err(diesel::result::Error::NotFound);
        }

        let q = query.trim().to_string();
        if q.is_empty() {
            return self.get_website(user_id);
        }

        #[derive(QueryableByName)]
        struct WebsiteRow {
            #[diesel(sql_type = Text)]
            id: String,
            #[diesel(sql_type = Text)]
            url: String,
            #[diesel(sql_type = Timestamp)]
            created_at: NaiveDateTime,
            #[diesel(sql_type = Text)]
            user_id: String,
        }

        let pattern = format!("%{}%", q);
        let rows = sql_query(
            r#"
            SELECT id, url, created_at, user_id
            FROM "Website"
            WHERE user_id = $1 AND url ILIKE $2
            ORDER BY created_at DESC
            "#,
        )
        .bind::<Text, _>(user_id)
        .bind::<Text, _>(pattern)
        .load::<WebsiteRow>(&mut self.conn)?;

        let websites = rows
            .into_iter()
            .map(|row| Website {
                id: row.id,
                url: row.url,
                created_at: row.created_at,
                user_id: row.user_id,
            })
            .collect();

        Ok(websites)
    }

    pub fn get_website_by_id(
        &mut self,
        user_id: String,
        website_id: String,
    ) -> Result<Option<Website>, diesel::result::Error> {
        if user_id.is_empty() || website_id.is_empty() {
            return Ok(None);
        }

        let website = crate::schema::Website::table
            .filter(crate::schema::Website::id.eq(website_id))
            .filter(crate::schema::Website::user_id.eq(user_id))
            .select(Website::as_select())
            .first::<Website>(&mut self.conn)
            .optional()?;

        Ok(website)
    }

    pub fn delete_website(
        &mut self,
        user_id: String,
        website_id: String,
    ) -> Result<bool, diesel::result::Error> {
        let website = self.get_website_by_id(user_id, website_id.clone())?;
        if website.is_none() {
            return Ok(false);
        }

        sql_query("DELETE FROM \"WebsiteTick\" WHERE website_id = $1")
            .bind::<Text, _>(website_id.clone())
            .execute(&mut self.conn)?;

        let deleted = diesel::delete(crate::schema::Website::table.filter(crate::schema::Website::id.eq(website_id)))
            .execute(&mut self.conn)?;

        Ok(deleted > 0)
    }

    pub fn get_website_ticks(
        &mut self,
        user_id: String,
        website_id: String,
        limit: i64,
    ) -> Result<Vec<WebsiteTickWithRegion>, diesel::result::Error> {
        if self.get_website_by_id(user_id, website_id.clone())?.is_none() {
            return Err(diesel::result::Error::NotFound);
        }

        let ticks = sql_query(
            r#"
            SELECT
                wt.id,
                wt.response_time_ms,
                wt.status_code::text AS status_code,
                wt.time_checked,
                wt.region_id,
                wt.website_id,
                r.name AS region_name
            FROM "WebsiteTick" wt
            LEFT JOIN "Region" r ON r.id = wt.region_id
            WHERE wt.website_id = $1
            ORDER BY wt.time_checked DESC
            LIMIT $2
            "#,
        )
        .bind::<Text, _>(website_id)
        .bind::<BigInt, _>(limit)
        .load::<WebsiteTickWithRegion>(&mut self.conn)?;

        Ok(ticks)
    }

    pub fn get_latest_status(
        &mut self,
        user_id: String,
        website_id: String,
    ) -> Result<String, diesel::result::Error> {
        if self.get_website_by_id(user_id, website_id.clone())?.is_none() {
            return Err(diesel::result::Error::NotFound);
        }
        
        #[derive(QueryableByName)]
        struct StatusRow {
            #[diesel(sql_type = Text)]
            status_code: String,
        }

        let latest = sql_query(
            r#"
            SELECT wt.status_code::text AS status_code
            FROM "WebsiteTick" wt
            WHERE wt.website_id = $1
            ORDER BY wt.time_checked DESC
            LIMIT 1
            "#,
        )
        .bind::<Text, _>(website_id)
        .load::<StatusRow>(&mut self.conn)?;

        Ok(latest.first().map(|row| row.status_code.clone()).unwrap_or_else(|| "Unknown".to_string()))
    }

    pub fn get_incidents(
        &mut self,
        user_id: String,
        from: Option<NaiveDateTime>,
        to: Option<NaiveDateTime>,
        limit: i64,
    ) -> Result<Vec<IncidentRaw>, diesel::result::Error> {
        let rows = sql_query(
            r#"
            SELECT
                wt.id,
                wt.website_id,
                w.url AS website_url,
                wt.status_code::text AS status,
                wt.response_time_ms,
                r.name AS region_name,
                wt.time_checked
            FROM "WebsiteTick" wt
            INNER JOIN "Website" w ON w.id = wt.website_id
            LEFT JOIN "Region" r ON r.id = wt.region_id
            WHERE w.user_id = $1
              AND ($2::timestamp IS NULL OR wt.time_checked >= $2)
              AND ($3::timestamp IS NULL OR wt.time_checked <= $3)
            ORDER BY wt.time_checked DESC
            LIMIT $4
            "#,
        )
        .bind::<Text, _>(user_id)
        .bind::<Nullable<Timestamp>, _>(from)
        .bind::<Nullable<Timestamp>, _>(to)
        .bind::<BigInt, _>(limit)
        .load::<IncidentRaw>(&mut self.conn)?;

        Ok(rows)
    }

    pub fn get_down_websites(
        &mut self,
        user_id: String,
        from: Option<NaiveDateTime>,
        to: Option<NaiveDateTime>,
    ) -> Result<Vec<DownWebsiteSummary>, diesel::result::Error> {
        let rows = sql_query(
            r#"
            SELECT
                wt.id,
                wt.website_id,
                w.url AS website_url,
                wt.status_code::text AS status,
                wt.response_time_ms,
                r.name AS region_name,
                wt.time_checked
            FROM "WebsiteTick" wt
            INNER JOIN "Website" w ON w.id = wt.website_id
            LEFT JOIN "Region" r ON r.id = wt.region_id
            WHERE w.user_id = $1
              AND wt.status_code::text = 'Down'
              AND ($2::timestamp IS NULL OR wt.time_checked >= $2)
              AND ($3::timestamp IS NULL OR wt.time_checked <= $3)
            ORDER BY wt.time_checked DESC
            LIMIT 300
            "#,
        )
        .bind::<Text, _>(user_id)
        .bind::<Nullable<Timestamp>, _>(from)
        .bind::<Nullable<Timestamp>, _>(to)
        .load::<IncidentRaw>(&mut self.conn)?;

        let mut grouped: HashMap<String, DownWebsiteSummary> = HashMap::new();
        for row in rows {
            let entry = grouped.entry(row.website_id.clone()).or_insert_with(|| DownWebsiteSummary {
                website_id: row.website_id.clone(),
                website_url: row.website_url.clone().unwrap_or_else(|| "Unknown".to_string()),
                down_count: 0,
                latest_down_at: row.time_checked,
                regions: Vec::new(),
            });

            entry.down_count += 1;
            if row.time_checked > entry.latest_down_at {
                entry.latest_down_at = row.time_checked;
            }

            let region = row.region_name.unwrap_or_else(|| "Unknown".to_string());
            if !entry.regions.iter().any(|existing| existing == &region) {
                entry.regions.push(region);
            }
        }

        let mut websites: Vec<DownWebsiteSummary> = grouped.into_values().collect();
        websites.sort_by(|a, b| b.down_count.cmp(&a.down_count));
        websites.truncate(12);
        Ok(websites)
    }

    pub fn get_alerts(&mut self, user_id: String) -> Result<Vec<IncidentRaw>, diesel::result::Error> {
        let rows = sql_query(
            r#"
            SELECT
                wt.id,
                wt.website_id,
                w.url AS website_url,
                wt.status_code::text AS status,
                wt.response_time_ms,
                r.name AS region_name,
                wt.time_checked
            FROM "WebsiteTick" wt
            INNER JOIN "Website" w ON w.id = wt.website_id
            LEFT JOIN "Region" r ON r.id = wt.region_id
            WHERE w.user_id = $1
              AND wt.status_code::text = 'Down'
            ORDER BY wt.time_checked DESC
            LIMIT 50
            "#,
        )
        .bind::<Text, _>(user_id)
        .load::<IncidentRaw>(&mut self.conn)?;

        Ok(rows)
    }

    pub fn count_active_alerts_last_24h(&mut self, user_id: String) -> Result<i64, diesel::result::Error> {
        #[derive(QueryableByName)]
        struct CountRow {
            #[diesel(sql_type = BigInt)]
            count: i64,
        }

        let rows = sql_query(
            r#"
            SELECT COUNT(*)::bigint AS count
            FROM "WebsiteTick" wt
            INNER JOIN "Website" w ON w.id = wt.website_id
            WHERE w.user_id = $1
              AND wt.status_code::text = 'Down'
              AND wt.time_checked >= NOW() - INTERVAL '24 hours'
            "#,
        )
        .bind::<Text, _>(user_id)
        .load::<CountRow>(&mut self.conn)?;

        Ok(rows.first().map(|row| row.count).unwrap_or(0))
    }
}
