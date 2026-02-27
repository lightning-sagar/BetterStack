use std::sync::{Arc, Mutex};

use poem::{handler, web::{Data, Json}};

use crate::{
	middleware::AuthUser,
	req_input::CreateWebsiteInput,
	req_output::CreateWebsiteOutput,
};
use store::store::Store;

#[handler]
pub async fn get_websites(auth_user: Data<&AuthUser>, s: Data<&Arc<Mutex<Store>>>) -> String {
	let mut locked_store = s.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
	match locked_store.get_website(auth_user.user_id.clone()) {
		Ok(websites) => format!("Websites: {:?}", websites),
		Err(err) => format!("Failed to fetch websites: {}", err),
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
		}),
		Err(err) => Json(CreateWebsiteOutput {
			message: format!("Failed to create website: {}", err),
			website_id: String::new(),
		}),
	}
}
