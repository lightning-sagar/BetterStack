use serde::{ Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct CreateWebsiteOutput {
    pub message: String,
    pub website_id: String,
}
#[derive(Serialize, Deserialize)]
pub struct SignInOutput {
    pub message: String,
    pub success: bool,
}
#[derive(Serialize, Deserialize)]
pub struct SignUpOutput {
    pub message: String,
    pub success: bool,
}