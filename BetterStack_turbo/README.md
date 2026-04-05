# BetterStack Turbo

This repository contains the BetterStack monitoring stack:

- `apps/my-app`: Next.js frontend
- `apps/api`: Express API
- `apps/pusher`: Redis stream producer
- `apps/worker`: background worker that reads from Redis and writes ticks to the database
- `packages/store`: shared Prisma client and schema
- `packages/redis-stream`: Redis stream helpers

## Prerequisites

- Node.js 18 or newer
- npm 11 or newer
- Bun for the `api`, `pusher`, `worker`, and `test` packages
- A configured database and Redis instance

## Install

From the repository root:

```sh
npm install
```

### Prisma Setup (From Repository Root)

If you changed the Prisma schema or need to regenerate the client:

```sh
npm run -w packages/store prisma:generate
```

Or alternatively:

```sh
cd packages/store && npm run prisma:generate
```

If you are pointing at an existing database, you may also need:

```sh
npm run -w packages/store prisma:pull
npm run -w packages/store prisma:generate
```

To deploy migrations to the database:

```sh
npm run -w packages/store prisma:deploy
npm run -w packages/store prisma:generate
```

**Important:** Always run Prisma commands from the repository root, not from a subdirectory.

## Run The Apps

Open a separate terminal for each long-running process.

### Frontend

```sh
npm run dev --workspace=my-app
```

The frontend runs on the default Next.js port, usually `http://localhost:3000`.

### API

```sh
npm run dev --workspace=api
```

This starts the Express server through Bun. The API listens on `PORT` if set, otherwise it defaults to `5000`.

### Pusher

```sh
cd apps/pusher
bun index.ts
```

This process pushes website records into the Redis stream on an interval.

### Worker

```sh
cd apps/worker
bun index.ts
```

The worker reads from the Redis stream and persists website ticks. It expects `REGION_ID` and `WORKER_ID` to be set if you want values other than the defaults.

## Running With Docker

### PostgreSQL (Prisma Database)

Run PostgreSQL in Docker:

```sh
docker run \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=betterstack \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Set the database URL in your `.env` file:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/betterstack
```

Then run the Prisma migrations from the repository root:

```sh
npm run -w packages/store prisma:deploy
npm run -w packages/store prisma:generate
```

Or:

```sh
cd packages/store && npm run prisma:deploy && npm run prisma:generate
```

To stop and remove the container:

```sh
docker stop postgres && docker rm postgres
```

### Redis

Run Redis in Docker:

```sh
docker run \
  --name redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

Set the Redis URL in your `.env` file (if needed by your redis-stream package):

```
REDIS_URL=redis://localhost:6379
```

To stop and remove the container:

```sh
docker stop redis && docker rm redis
```

### Docker Compose (Combined Setup)

Alternatively, create a `docker-compose.yml` file in the repository root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: betterstack
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Then start both services:

```sh
docker compose up -d
```

Stop all services:

```sh
docker compose down
```

## Notes

- `npm run dev` at the repository root only runs workspaces that expose a `dev` script.
- The `pusher` and `worker` packages are started manually because they do not currently define workspace scripts.
- Make sure the API, Redis, and database are available before starting the worker.
- When using Docker, ensure the `DATABASE_URL` and `REDIS_URL` environment variables in your `.env` file point to the Docker containers.
