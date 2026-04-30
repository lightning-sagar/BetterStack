use poem::{
    Endpoint, Middleware, Request, Result,
    http::{Method, StatusCode},
    middleware::Tracing,
};
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
        // Allow CORS preflight through without auth.
        if req.method() == Method::OPTIONS {
            return self.inner.call(req).await;
        }

        let from_x_user_id = req
            .headers()
            .get("x-user-id")
            .and_then(|value| value.to_str().ok())
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToString::to_string);

        let from_authorization = req
            .headers()
            .get("authorization")
            .and_then(|value| value.to_str().ok())
            .and_then(|raw| {
                let mut parts = raw.split_whitespace();
                let scheme = parts.next()?;
                let token = parts.next()?;
                if scheme.eq_ignore_ascii_case("bearer") && !token.trim().is_empty() {
                    Some(token.trim().to_string())
                } else {
                    None
                }
            });

        let user_id = from_x_user_id
            .or(from_authorization)
            .ok_or_else(|| {
                poem::Error::from_string(
                    "Missing or invalid auth header. Provide x-user-id or Authorization: Bearer <user_id>",
                    StatusCode::UNAUTHORIZED,
                )
            })?;

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