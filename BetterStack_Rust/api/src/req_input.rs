use serde::{ Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct CreateWebsiteInput {
    pub url: String,
}

#[derive(Deserialize, Serialize)]
pub struct SignInInput {
    pub username: String,
    pub password: String,
    pub email: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct SignUpInput {
    pub username: String,
    pub password: String,
    pub email: String,
}
