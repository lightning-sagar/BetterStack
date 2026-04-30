use poem::{EndpointExt, Route, get, handler, post};

pub mod alerts;
pub mod user;
pub mod website;

#[handler]
async fn home() -> String {
	"Hello World!".to_string()
}

pub fn routes() -> Route {
	Route::new()
		.at("/", get(home))
		.at("/me", get(user::me).with(crate::middleware::auth()))
		.at("/signup", post(user::signup))
		.at("/signin", post(user::sign_in))
		.at("/logout", post(user::logout).with(crate::middleware::auth()))
		.at("/user/username", poem::patch(user::update_username).with(crate::middleware::auth()))
		.at("/user/profile", poem::patch(user::update_profile).with(crate::middleware::auth()))
		.at("/website", post(website::create_website).with(crate::middleware::auth()))
		.at("/websites", get(website::get_websites).with(crate::middleware::auth()))
		.at("/websites/search", get(website::search_websites).with(crate::middleware::auth()))
		.at("/website/:websiteId", get(website::get_website_detail).with(crate::middleware::auth()))
		.at("/website/:websiteId/delete", poem::delete(website::delete_website).with(crate::middleware::auth()))
		.at("/websites/:websiteId/ticks", get(website::get_website_ticks).with(crate::middleware::auth()))
		.at("/status/:websiteId", get(website::get_website_status).with(crate::middleware::auth()))
		.at("/incidents", get(alerts::get_incidents).with(crate::middleware::auth()))
		.at("/incidents/down-websites", get(alerts::get_down_websites).with(crate::middleware::auth()))
		.at("/alerts", get(alerts::get_alerts).with(crate::middleware::auth()))
		.at("/alerts/summary", get(alerts::get_alerts_summary).with(crate::middleware::auth()))
}
 