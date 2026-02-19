use poem::{ Route, Server, get, handler, listener::TcpListener, post, web::{Json}};

use crate::{req_input::{CreateWebsiteInput, GetWebsiteInput, SignInInput, SignUpInput}, req_output::{CreateWebsiteOutput, SignInOutput, SignUpOutput}};
use store::store::Store;
pub mod req_input;
pub mod req_output;

#[handler]
async fn get_website()-> String {
    format!("Hello World!")
}

#[handler]
async fn sign_in(data: Json<SignInInput>) -> Json<SignInOutput> {
    let mut s:Store = Store::default().unwrap();
    let res = s.sign_in(data.username.clone(), data.password.clone(), data.email.clone()).unwrap();
    Json(SignInOutput {
        message: format!("Sign in successful: {}", res),
        success: true,
    })
}

#[handler]
async fn signup(data: Json<SignUpInput>) -> Json<SignUpOutput> {
    let mut s:Store = Store::default().unwrap();
    let res = s.sign_up(data.username.clone(), data.password.clone(), data.email.clone()).unwrap();
    Json(SignUpOutput {
        message: format!("Sign up successful: {}", res),
        success: true,
    })
}

#[handler]
async fn get_websites(data: Json<GetWebsiteInput>) -> String {
    let mut s:Store = Store::default().unwrap();
    let websites = s.get_website(data.user_id.clone()).unwrap();
    format!("Websites: {:?}", websites)
}


#[handler]
async fn handler_create_website(data: Json<CreateWebsiteInput>) -> Json<CreateWebsiteOutput> {
    let CreateWebsiteInput { url, user_id } = data.0;
    let mut s:Store = Store::default().unwrap();
    
    let website = s.create_website(url.clone(), user_id).unwrap();
    let res = CreateWebsiteOutput {
        message: format!("Website created with URL: {}", url),
        website_id: website.id,
    };
    Json(res)
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    dotenvy::dotenv().ok();
    let app = Route::new()
        .at("/", get(get_website))
        .at("/signup", post(signup))
        .at("/signin", post(sign_in))
        .at("/website", post(handler_create_website))
        .at("/websites", get(get_websites));
    Server::new(TcpListener::bind("0.0.0.0:3001"))
        .run(app)
        .await
}