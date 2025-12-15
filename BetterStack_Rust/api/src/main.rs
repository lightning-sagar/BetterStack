use poem::{ Route, Server, get, handler, listener::TcpListener, web::Path};

#[handler]
async fn index()-> String {
    format!("Hello World!")
}
#[handler]
async fn hello(Path(name): Path<String>) -> String {
    format!("hello: {}", name)
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let app = Route::new()
        .at("/", get(index))
        .at("/hello/:name", get(hello));
    Server::new(TcpListener::bind("0.0.0.0:3001"))
        .run(app)
        .await
}