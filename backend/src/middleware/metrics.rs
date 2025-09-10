use axum::{
    http::{Request, Response},
    middleware::Next,
};
use std::time::Instant;
use tower::{Layer, Service};
use tracing::info;

#[derive(Clone)]
pub struct MetricsLayer;

impl MetricsLayer {
    pub fn new() -> Self {
        Self
    }
}

impl<S> Layer<S> for MetricsLayer {
    type Service = MetricsMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        MetricsMiddleware { inner }
    }
}

#[derive(Clone)]
pub struct MetricsMiddleware<S> {
    inner: S,
}

impl<S, ReqBody, ResBody> Service<Request<ReqBody>> for MetricsMiddleware<S>
where
    S: Service<Request<ReqBody>, Response = Response<ResBody>>,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = S::Future;

    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request<ReqBody>) -> Self::Future {
        let start = Instant::now();
        let method = req.method().clone();
        let path = req.uri().path().to_string();

        let future = self.inner.call(req);

        // Note: This is a simplified metrics implementation
        // In production, use proper metrics libraries like metrics-rs
        tokio::spawn(async move {
            let duration = start.elapsed();
            info!(
                "Request {} {} completed in {}ms",
                method,
                path,
                duration.as_millis()
            );
        });

        future
    }
}