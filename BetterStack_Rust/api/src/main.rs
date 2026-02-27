use std::sync::{Arc, Mutex};

use poem::{EndpointExt, Server, listener::TcpListener};
use store::store::Store;
pub mod middleware;
pub mod req_input;
pub mod req_output;
pub mod route;


#[tokio::main(flavor = "multi_thread", worker_threads = 4)]
async fn main() -> Result<(), std::io::Error> {
    dotenvy::dotenv().ok();
    let s = Arc::new(Mutex::new(Store::default().unwrap()));
    let app = route::routes().data(s).with(middleware::tracing());
    Server::new(TcpListener::bind("0.0.0.0:3001"))
        .run(app)
        .await
}