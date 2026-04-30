use serde::{ Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct CreateWebsiteInput {
    pub url: String,
}

#[derive(Deserialize, Serialize)]
pub struct SignInInput {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize, Serialize)]
pub struct SignUpInput {
    #[serde(rename = "firstName")]
    pub first_name: String,
    #[serde(rename = "lastName")]
    pub last_name: String,
    pub email: String,
    pub password: String,
}

#[derive(Deserialize, Serialize)]
pub struct UpdateUsernameInput {
    pub username: String,
}

#[derive(Deserialize, Serialize)]
pub struct UpdateProfileInput {
    pub username: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct SearchWebsitesQuery {
    pub q: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct IncidentsQuery {
    pub from: Option<String>,
    pub to: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Deserialize, Serialize)]
pub struct DateRangeQuery {
    pub from: Option<String>,
    pub to: Option<String>,
}
