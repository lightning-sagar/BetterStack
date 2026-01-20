use serde::{ Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct CreateWebsiteOutput {
    pub message: String,
    pub website_id: String,
}