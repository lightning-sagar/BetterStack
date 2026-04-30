use std::sync::{Arc, Mutex};

use poem::{
    handler,
    web::{Data, Json, Path, Query},
};

use crate::{
    middleware::AuthUser,
    req_input::{CreateWebsiteInput, SearchWebsitesQuery},
    req_output::{
        CreateWebsiteOutput, DeleteWebsiteOutput, GetWebsiteOutput, GetWebsitesOutput, RegionOutput,
        WebsiteDetailOutput, WebsiteStatusOutput, WebsiteTickOutput, WebsiteTicksOutput,
    },
};
use store::store::Store;

fn map_website(website: store::model::website::Website) -> GetWebsiteOutput {
    GetWebsiteOutput {
        id: website.id,
        url: website.url,
        created_at: website.created_at.to_string(),
        user_id: website.user_id,
    }
}

fn map_tick(tick: store::model::website::WebsiteTickWithRegion) -> WebsiteTickOutput {
    WebsiteTickOutput {
        id: tick.id,
        response_time_ms: tick.response_time_ms,
        status_code: tick.status_code,
        time_checked: tick.time_checked.to_string(),
        region_id: tick.region_id,
        website_id: tick.website_id,
        region: tick.region_name.map(|name| RegionOutput {
            id: String::new(),
            name,
        }),
    }
}

#[handler]
pub async fn get_websites(auth_user: Data<&AuthUser>, s: Data<&Arc<Mutex<Store>>>) -> Json<GetWebsitesOutput> {
    let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    match locked_store.get_website(auth_user.user_id.clone()) {
        Ok(websites) => Json(GetWebsitesOutput {
            websites: websites.into_iter().map(map_website).collect(),
            message: "Websites fetched successfully".to_string(),
        }),
        Err(err) => Json(GetWebsitesOutput {
            websites: Vec::new(),
            message: format!("Failed to fetch websites: {}", err),
        }),
    }
}

#[handler]
pub async fn search_websites(
    auth_user: Data<&AuthUser>,
    query: Query<SearchWebsitesQuery>,
    s: Data<&Arc<Mutex<Store>>>,
) -> Json<GetWebsitesOutput> {
    let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    let q = query.0.q.unwrap_or_default();
    match locked_store.search_websites(auth_user.user_id.clone(), q) {
        Ok(websites) => Json(GetWebsitesOutput {
            websites: websites.into_iter().map(map_website).collect(),
            message: "Websites searched successfully".to_string(),
        }),
        Err(err) => Json(GetWebsitesOutput {
            websites: Vec::new(),
            message: format!("Failed to search websites: {}", err),
        }),
    }
}

#[handler]
pub async fn get_website_detail(
    auth_user: Data<&AuthUser>,
    Path(website_id): Path<String>,
    s: Data<&Arc<Mutex<Store>>>,
) -> Json<WebsiteDetailOutput> {
    let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());

    match locked_store.get_website_by_id(auth_user.user_id.clone(), website_id.clone()) {
        Ok(Some(website)) => {
            let ticks = locked_store
                .get_website_ticks(auth_user.user_id.clone(), website_id, 90)
                .unwrap_or_default();

            Json(WebsiteDetailOutput {
                website: map_website(website),
                ticks: ticks.into_iter().map(map_tick).collect(),
            })
        }
        _ => Json(WebsiteDetailOutput {
            website: GetWebsiteOutput {
                id: String::new(),
                url: String::new(),
                created_at: String::new(),
                user_id: String::new(),
            },
            ticks: Vec::new(),
        }),
    }
}

#[handler]
pub async fn delete_website(
    auth_user: Data<&AuthUser>,
    Path(website_id): Path<String>,
    s: Data<&Arc<Mutex<Store>>>,
) -> Json<DeleteWebsiteOutput> {
    let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());

    match locked_store.delete_website(auth_user.user_id.clone(), website_id.clone()) {
        Ok(true) => Json(DeleteWebsiteOutput {
            message: "Website deleted".to_string(),
            website_id,
        }),
        Ok(false) => Json(DeleteWebsiteOutput {
            message: "Website not found".to_string(),
            website_id: String::new(),
        }),
        Err(err) => Json(DeleteWebsiteOutput {
            message: format!("Failed to delete website: {}", err),
            website_id: String::new(),
        }),
    }
}

#[handler]
pub async fn get_website_ticks(
    auth_user: Data<&AuthUser>,
    Path(website_id): Path<String>,
    s: Data<&Arc<Mutex<Store>>>,
) -> Json<WebsiteTicksOutput> {
    let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());

    match locked_store.get_website_ticks(auth_user.user_id.clone(), website_id.clone(), 24) {
        Ok(ticks) => Json(WebsiteTicksOutput {
            website_id,
            ticks: ticks.into_iter().map(map_tick).collect(),
        }),
        Err(_) => Json(WebsiteTicksOutput {
            website_id: String::new(),
            ticks: Vec::new(),
        }),
    }
}

#[handler]
pub async fn get_website_status(
    auth_user: Data<&AuthUser>,
    Path(website_id): Path<String>,
    s: Data<&Arc<Mutex<Store>>>,
) -> Json<WebsiteStatusOutput> {
    let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());

    match locked_store.get_latest_status(auth_user.user_id.clone(), website_id) {
        Ok(status) => Json(WebsiteStatusOutput { status }),
        Err(_) => Json(WebsiteStatusOutput {
            status: "Unknown".to_string(),
        }),
    }
}

#[handler]
pub async fn create_website(
    data: Json<CreateWebsiteInput>,
    auth_user: Data<&AuthUser>,
    s: Data<&Arc<Mutex<Store>>>,
) -> Json<CreateWebsiteOutput> {
    let CreateWebsiteInput { url } = data.0;
    let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());

    match locked_store.create_website(url.clone(), auth_user.user_id.clone()) {
        Ok(website) => Json(CreateWebsiteOutput {
            message: format!("Website created with URL: {}", url),
            website_id: website.id,
            url: website.url,
        }),
        Err(err) => Json(CreateWebsiteOutput {
            message: format!("Failed to create website: {}", err),
            website_id: String::new(),
            url: String::new(),
        }),
    }
}
