# Local Setup Steps

## 1. Configure Environment

Create the required `.env` files for the services you want to run. At minimum, the backend services need:

```sh
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

The frontend uses:

```sh
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Use `http://localhost:3001` instead if the frontend should call the Rust API.

## 2. Run Rust Services

From the Rust workspace:

```sh
cd BetterStack_Rust
cargo run -p api
cargo run -p pusher
REGION_NAME=ohio WORKER_ID=ohio-1 cargo run -p worker
```

Use different `REGION_NAME` and `WORKER_ID` values when running multiple workers.

## 3. Run TurboRepo Frontend

From the TurboRepo workspace:

```sh
cd BetterStack_turbo
npm install
npm run dev --workspace=my-app
```

The frontend usually runs at `http://localhost:3000`.

## 4. Optional TurboRepo Services

The TurboRepo also contains TypeScript service implementations:

```sh
npm run dev --workspace=api
cd apps/pusher && bun index.ts
cd apps/worker && bun index.ts
```

## Deployment Status

Only the monitoring workers are deployed on Render free instances. The active worker regions are Ohio, Virginia, Singapore, and Frankfurt.

The frontend and HTTP APIs are not publicly deployed at this stage.
