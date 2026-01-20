use poem::{ Route, Server, get, handler, listener::TcpListener, post, web::{Json}};

use crate::{req_input::CreateWebsiteInput, req_output::CreateWebsiteOutput};
use store::Store;
pub mod req_input;
pub mod req_output;

#[handler]
async fn get_website()-> String {
    format!("Hello World!")
}
#[handler]
async fn handler_create_website(data: Json<CreateWebsiteInput>) -> Json<CreateWebsiteOutput> {
    let url:String = data.0.url;
    let s = Store{};
    
    let website_id = s.create_website().to_string();
    let res = CreateWebsiteOutput {
        message: format!("Website created with URL: {}", url),
        website_id 
    };
    Json(res)
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let app = Route::new()
        .at("/", get(get_website))
        .at("/website", post(handler_create_website));
    Server::new(TcpListener::bind("0.0.0.0:3001"))
        .run(app)
        .await
}