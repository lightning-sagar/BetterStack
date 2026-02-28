use poem::{Endpoint, Middleware, Request, Result, http::StatusCode, middleware::Tracing};
#[derive(Clone, Debug)]
pub struct AuthUser {
    pub user_id: String,
}

pub struct AuthMiddleware;

pub struct AuthEndpoint<E> {
    inner: E,
}

impl<E: Endpoint> Middleware<E> for AuthMiddleware {
    type Output = AuthEndpoint<E>;

    fn transform(&self, ep: E) -> Self::Output {
        AuthEndpoint { inner: ep }
    }
}

impl<E: Endpoint> Endpoint for AuthEndpoint<E> {
    type Output = E::Output;

    async fn call(&self, mut req: Request) -> Result<Self::Output> {
        let user_id = req
            .headers()
            .get("x-user-id")
            .and_then(|value| value.to_str().ok())
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| {
                poem::Error::from_string(
                    "Missing or invalid x-user-id header",
                    StatusCode::UNAUTHORIZED,
                )
            })?
            .to_string();

        req.extensions_mut().insert(AuthUser { user_id });
        self.inner.call(req).await
    }
}

pub fn tracing() -> Tracing {
    Tracing
}

pub fn auth() -> AuthMiddleware {
    AuthMiddleware
}