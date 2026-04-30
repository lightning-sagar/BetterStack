use poem::{
    EndpointExt,
    Server,
    http::Method,
    listener::TcpListener,
    middleware::Cors,
};
use std::sync::{Arc, Mutex};
use store::store::Store;

pub mod middleware;
pub mod req_input;
pub mod req_output;
pub mod route;

#[tokio::main(flavor = "multi_thread", worker_threads = 4)]
async fn main() -> Result<(), std::io::Error> {
    dotenvy::dotenv_override().ok();

    let store = Store::default().map_err(|error| {
        std::io::Error::other(format!(
            "Failed to connect to PostgreSQL. Check that Postgres is running and DATABASE_URL is correct. Details: {error}"
        ))
    })?;

    let shared_store = Arc::new(Mutex::new(store));
    let cors = Cors::new()
        .allow_origins([
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ])
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS]);

    let app = route::routes()
        .data(shared_store)
        .with(middleware::tracing())
        .with(cors);

    Server::new(TcpListener::bind("0.0.0.0:3001"))
        .run(app)
        .await
}
