# BetterStack Rust Workspace

This workspace contains the Rust backend implementation for BetterStack.

- `api`: Poem HTTP API, listening on `0.0.0.0:3001`
- `store`: Diesel/PostgreSQL database layer and migrations
- `redis`: Redis Streams helper crate
- `pusher`: reads websites from PostgreSQL and pushes monitor jobs to Redis Streams
- `worker`: consumes Redis Stream jobs, checks websites, and stores ticks

## Environment

Create a `.env` file with the required service configuration:

```sh
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

Workers also support region-specific identity:

```sh
REGION_NAME=ohio
WORKER_ID=ohio-1
```

## Local Development

Run each long-running service in a separate terminal:

```sh
cd BetterStack_Rust
cargo run -p api
cargo run -p pusher
REGION_NAME=ohio WORKER_ID=ohio-1 cargo run -p worker
```

The worker can also use `REGION_ID` instead of `REGION_NAME`. If the region does not already exist in the database, the worker creates it.

## Deployment Status

Only the worker services are currently deployed on Render free instances. The active worker regions are Ohio, Virginia, Singapore, and Frankfurt.

The Rust API is not publicly deployed at this stage. It is intended to run locally for development unless a separate deployment is configured.
