use poem::{EndpointExt, Route, get, handler, post};

pub mod user;
pub mod website;

#[handler]
async fn home() -> String {
	"Hello World!".to_string()
}

pub fn routes() -> Route {
	Route::new()
		.at("/", get(home))
		.at("/signup", post(user::signup))
		.at("/signin", post(user::sign_in))
		.at("/website", post(website::create_website).with(crate::middleware::auth()))
		.at("/websites", get(website::get_websites).with(crate::middleware::auth()))
}
 