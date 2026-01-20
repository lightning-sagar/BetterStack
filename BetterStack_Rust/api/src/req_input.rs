use serde::{ Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct CreateWebsiteInput {
    pub url: String,
}
