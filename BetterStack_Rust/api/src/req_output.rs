use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
}

#[derive(Serialize, Deserialize)]
pub struct SignInOutput {
    pub message: String,
    pub success: bool,
    pub token: String,
    pub user: User,
}

#[derive(Serialize, Deserialize)]
pub struct SignUpOutput {
    pub message: String,
    pub success: bool,
    pub token: String,
    pub user: User,
}

#[derive(Serialize, Deserialize)]
pub struct MeOutput {
    pub success: bool,
    pub user: User,
}

#[derive(Serialize, Deserialize)]
pub struct LogoutOutput {
    pub message: String,
    pub success: bool,
}

#[derive(Serialize, Deserialize)]
pub struct UpdateUserOutput {
    pub message: String,
    pub success: bool,
    pub token: String,
    pub user: User,
}

#[derive(Serialize, Deserialize)]
pub struct CreateWebsiteOutput {
    pub message: String,
    pub website_id: String,
    pub url: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct GetWebsiteOutput {
    pub id: String,
    pub url: String,
    pub created_at: String,
    pub user_id: String,
}

#[derive(Serialize, Deserialize)]
pub struct GetWebsitesOutput {
    pub websites: Vec<GetWebsiteOutput>,
    pub message: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct RegionOutput {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct WebsiteTickOutput {
    pub id: String,
    pub response_time_ms: i32,
    pub status_code: String,
    pub time_checked: String,
    pub region_id: String,
    pub website_id: String,
    pub region: Option<RegionOutput>,
}

#[derive(Serialize, Deserialize)]
pub struct WebsiteDetailOutput {
    pub website: GetWebsiteOutput,
    pub ticks: Vec<WebsiteTickOutput>,
}

#[derive(Serialize, Deserialize)]
pub struct DeleteWebsiteOutput {
    pub message: String,
    pub website_id: String,
}

#[derive(Serialize, Deserialize)]
pub struct WebsiteTicksOutput {
    #[serde(rename = "websiteId")]
    pub website_id: String,
    pub ticks: Vec<WebsiteTickOutput>,
}

#[derive(Serialize, Deserialize)]
pub struct WebsiteStatusOutput {
    pub status: String,
}

#[derive(Serialize, Deserialize)]
pub struct IncidentOutput {
    pub id: String,
    pub website_id: String,
    pub website_url: String,
    pub status: String,
    pub response_time_ms: i32,
    pub region: String,
    pub time_checked: String,
    pub title: String,
}

#[derive(Serialize, Deserialize)]
pub struct IncidentsOutput {
    pub incidents: Vec<IncidentOutput>,
}

#[derive(Serialize, Deserialize)]
pub struct DownWebsiteOutput {
    pub website_id: String,
    pub website_url: String,
    pub down_count: i32,
    pub latest_down_at: String,
    pub regions: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct DownWebsitesOutput {
    pub websites: Vec<DownWebsiteOutput>,
}

#[derive(Serialize, Deserialize)]
pub struct AlertOutput {
    pub id: String,
    pub website_id: String,
    pub website_url: String,
    pub status: String,
    pub response_time_ms: i32,
    pub region: String,
    pub time_checked: String,
    pub title: String,
    pub message: String,
}

#[derive(Serialize, Deserialize)]
pub struct AlertsOutput {
    pub alerts: Vec<AlertOutput>,
}

#[derive(Serialize, Deserialize)]
pub struct AlertsSummaryOutput {
    pub active_alerts: i64,
    pub status: String,
}
