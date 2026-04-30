use std::sync::{Arc, Mutex};

use chrono::NaiveDateTime;
use poem::{
    handler,
    web::{Data, Json, Query},
};

use crate::{
    middleware::AuthUser,
    req_input::{DateRangeQuery, IncidentsQuery},
    req_output::{
        AlertOutput, AlertsOutput, AlertsSummaryOutput, DownWebsiteOutput, DownWebsitesOutput,
        IncidentOutput, IncidentsOutput,
    },
};
use store::store::Store;

fn parse_datetime(input: Option<String>) -> Option<NaiveDateTime> {
    input
        .and_then(|value| chrono::DateTime::parse_from_rfc3339(&value).ok())
        .map(|dt| dt.naive_utc())
}

#[handler]
pub async fn get_incidents(
    auth_user: Data<&AuthUser>,
    query: Query<IncidentsQuery>,
    s: Data<&Arc<Mutex<Store>>>,
) -> Json<IncidentsOutput> {
    let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    let from = parse_datetime(query.0.from);
    let to = parse_datetime(query.0.to);
    let limit = query.0.limit.unwrap_or(8).clamp(1, 100);

    match locked_store.get_incidents(auth_user.user_id.clone(), from, to, limit) {
        Ok(rows) => Json(IncidentsOutput {
            incidents: rows
                .into_iter()
                .map(|row| IncidentOutput {
                    id: row.id,
                    website_id: row.website_id,
                    website_url: row.website_url.unwrap_or_else(|| "Unknown".to_string()),
                    status: row.status.clone(),
                    response_time_ms: row.response_time_ms,
                    region: row.region_name.unwrap_or_else(|| "Unknown".to_string()),
                    time_checked: row.time_checked.to_string(),
                    title: if row.status == "Down" {
                        "Availability alert".to_string()
                    } else {
                        "Routine health check".to_string()
                    },
                })
                .collect(),
        }),
        Err(_) => Json(IncidentsOutput {
            incidents: Vec::new(),
        }),
    }
}

#[handler]
pub async fn get_down_websites(
    auth_user: Data<&AuthUser>,
    query: Query<DateRangeQuery>,
    s: Data<&Arc<Mutex<Store>>>,
) -> Json<DownWebsitesOutput> {
    let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    let from = parse_datetime(query.0.from);
    let to = parse_datetime(query.0.to);

    match locked_store.get_down_websites(auth_user.user_id.clone(), from, to) {
        Ok(rows) => Json(DownWebsitesOutput {
            websites: rows
                .into_iter()
                .map(|row| DownWebsiteOutput {
                    website_id: row.website_id,
                    website_url: row.website_url,
                    down_count: row.down_count,
                    latest_down_at: row.latest_down_at.to_string(),
                    regions: row.regions,
                })
                .collect(),
        }),
        Err(_) => Json(DownWebsitesOutput {
            websites: Vec::new(),
        }),
    }
}

#[handler]
pub async fn get_alerts(auth_user: Data<&AuthUser>, s: Data<&Arc<Mutex<Store>>>) -> Json<AlertsOutput> {
    let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());

    match locked_store.get_alerts(auth_user.user_id.clone()) {
        Ok(rows) => Json(AlertsOutput {
            alerts: rows
                .into_iter()
                .map(|row| {
                    let website_url = row.website_url.unwrap_or_else(|| "Unknown".to_string());
                    let region_name = row.region_name.unwrap_or_else(|| "Unknown".to_string());
                    AlertOutput {
                        id: row.id,
                        website_id: row.website_id,
                        website_url: website_url.clone(),
                        status: row.status,
                        response_time_ms: row.response_time_ms,
                        region: region_name.clone(),
                        time_checked: row.time_checked.to_string(),
                        title: "Availability alert".to_string(),
                        message: format!(
                            "{} latency/availability issue in {}",
                            website_url, region_name
                        ),
                    }
                })
                .collect(),
        }),
        Err(_) => Json(AlertsOutput { alerts: Vec::new() }),
    }
}

#[handler]
pub async fn get_alerts_summary(
    auth_user: Data<&AuthUser>,
    s: Data<&Arc<Mutex<Store>>>,
) -> Json<AlertsSummaryOutput> {
    let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());

    match locked_store.count_active_alerts_last_24h(auth_user.user_id.clone()) {
        Ok(active_alerts) => Json(AlertsSummaryOutput {
            active_alerts,
            status: "coming_soon".to_string(),
        }),
        Err(_) => Json(AlertsSummaryOutput {
            active_alerts: 0,
            status: "coming_soon".to_string(),
        }),
    }
}
