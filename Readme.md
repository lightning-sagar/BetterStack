# BetterStack: Resilient Website Monitoring System

## Introduction

BetterStack is a resilient website monitoring system built to track service availability, measure response times, store health-check results, and surface incidents through a modern dashboard. The project is organized as a multi-part system with:

- a Rust backend workspace for high-performance service components
- a TurboRepo-based frontend and JavaScript service layer for dashboard, API, queue producers, and workers
- PostgreSQL for persistent monitoring data
- Redis Streams for decoupled job delivery between producers and workers

The system continuously checks whether registered websites are up or down, records each result as a tick, and presents the data through a frontend dashboard for users and operators.

## Motivation

In June 2022, a major Cloudflare outage affected thousands of websites and services globally. A key lesson from such incidents is simple: if the monitoring platform depends on the same failing infrastructure, both the service and the monitoring system may go down together. In that situation:

- No alerts
- No notifications
- No visibility

This project is motivated by the need to build a monitoring platform that remains useful during service disruption. Instead of relying on a single tightly coupled component, BetterStack uses a queue-based architecture with dedicated workers, persistent storage, and independent health checks to improve resilience and observability.

## Problem Statement

Modern applications rely on cloud platforms, APIs, databases, and distributed infrastructure. When one service fails:

- businesses lose revenue
- users lose trust
- engineers respond late without timely signals

Many teams depend on third-party monitoring platforms, but those systems can also fail or become unreachable. BetterStack addresses this by designing a monitoring workflow that is always collecting availability data, pushing checks asynchronously, and storing results for later alerting, analysis, and incident visibility.

## Objectives

- Monitor websites and service endpoints 24/7
- Detect downtime and latency degradation quickly
- Store health-check history for analysis
- Support worker-based distributed monitoring
- Separate data production from processing using Redis Streams
- Provide a frontend dashboard for website, status, and incident visibility
- Reduce single points of failure in the monitoring pipeline

## System Overview

BetterStack currently contains two major implementation areas:

### 1. Rust Backend Workspace

Located in `BetterStack_Rust/`, this workspace contains Rust services focused on performance, persistence, and worker processing.

- `api`: HTTP API built with Poem
- `store`: shared database layer using Diesel and PostgreSQL
- `worker`: background monitor that consumes Redis Stream jobs, sends HTTP requests, and stores ticks
- `redis`: shared Redis Stream helpers
- `pusher`: queue-oriented service scaffold for dispatching work

### 2. TurboRepo Frontend and JS Services

Located in `BetterStack_turbo/`, this monorepo contains the dashboard frontend and TypeScript/Bun service layer.

- `apps/my-app`: Next.js frontend dashboard
- `apps/api`: Express API for auth, websites, alerts, and status endpoints
- `apps/pusher`: producer that pushes website jobs into Redis Streams
- `apps/worker`: worker that consumes jobs and stores ticks
- `packages/store`: shared Prisma client and schema
- `packages/redis-stream`: Redis utility package
- `packages/ui`: reusable UI components

## Backend Architecture

### Rust Backend

The Rust implementation is designed around performance and reliability.

- `Poem` is used for HTTP server and routing in the Rust API.
- `Tokio` powers asynchronous execution and worker concurrency.
- `Diesel` handles PostgreSQL ORM and schema management.
- `Reqwest` is used by workers to perform endpoint checks.
- `Redis Streams` decouple website scheduling from processing.

Current Rust flow:

1. A website is registered through the API.
2. Website data is stored in PostgreSQL.
3. Jobs are placed into Redis Streams.
4. Rust workers consume pending jobs.
5. Each worker sends an HTTP request to the target endpoint.
6. The worker records response time and status (`Up`, `Down`, or `Unknown`) in the database.

### TurboRepo Frontend and Service Layer

The Turbo repo provides the dashboard and a JavaScript runtime implementation of the platform.

- `Next.js` is used for the user-facing frontend.
- `React` powers the dashboard UI.
- `Tailwind CSS` styles the frontend.
- `Express` exposes backend HTTP APIs for auth and website management.
- `Bun` is used to run the API, pusher, and worker services.
- `Prisma` provides a shared database client for PostgreSQL.
- `Zustand` is used for frontend state management.

Current frontend/service capabilities include:

- landing page
- sign-in flow
- dashboard view
- website detail view
- incidents page
- settings page
- authenticated website CRUD operations
- status and tick history retrieval

## Data Flow

The monitoring pipeline can be summarized as:

1. User registers a website from the frontend dashboard.
2. API stores the website and ownership metadata.
3. Pusher reads websites and adds monitoring jobs to Redis Streams.
4. Workers consume queued jobs.
5. Workers hit the endpoint and calculate response time.
6. Workers store tick data in PostgreSQL.
7. Dashboard fetches website and tick history for visualization.
 


## Literature Review

Reliable monitoring systems are a core part of distributed systems engineering. Prior work and industry guidance consistently show that monitoring must be real-time, alert-driven, and resilient to infrastructure-level failures.

Google's SRE guidance distinguishes between white-box monitoring and black-box monitoring, emphasizing that black-box checks are essential because they validate user-visible system behavior rather than only internal metrics. This directly aligns with BetterStack's model of hitting endpoints and measuring actual service responsiveness.

Research and operational reports also show that failures are not always complete shutdowns. Many production systems experience fail-slow behavior, partial outages, or degraded responsiveness before full failure. For this reason, monitoring systems should capture both availability and latency, not just binary up/down state.

The 2022 Cloudflare outage further illustrates why independent observability matters. If organizations rely on a tightly coupled monitoring setup, major infrastructure incidents can remove the very visibility needed to detect and respond to failures. BetterStack is motivated by this gap and adopts a decoupled producer-worker-storage architecture to improve resilience.

## Tools and Technologies

### Backend (Rust)

| Tool / Technology | Purpose |
| --- | --- |
| Rust | Systems programming language for backend services |
| Poem | HTTP server and routing |
| Tokio | Async runtime |
| Diesel | ORM for PostgreSQL |
| PostgreSQL | Persistent data store |
| Redis Streams | Queue-based job delivery |
| Reqwest | Endpoint health checks |
| Dotenvy | Environment variable loading |
| UUID / Chrono | ID generation and timestamps |

### Frontend and Service Layer (TurboRepo)

| Tool / Technology | Purpose |
| --- | --- |
| TurboRepo | Monorepo orchestration |
| Next.js | Frontend framework |
| React | UI library |
| Tailwind CSS | Styling |
| TypeScript | Type-safe application code |
| Bun | Runtime for API, worker, and pusher |
| Express | REST API layer |
| Prisma | Database client and schema management |
| PostgreSQL | Shared relational database |
| Redis | Message stream transport |
| Zustand | Client-side state management |
| Radix UI / Lucide React | UI primitives and icons |

## Database Model

The shared schema in the Turbo repo and the Rust store layer both reflect the core monitoring entities:

- `User`: stores authentication and ownership data
- `Website`: stores monitored URLs
- `Region`: identifies the location or worker region
- `WebsiteTick`: stores response time, status code, and check timestamp

This structure supports historical monitoring, per-site analysis, and multi-region extension in future versions.

## Key Features

- user registration and authentication
- website registration and ownership mapping
- periodic website health checks
- queue-based processing using Redis Streams
- latency and status storage in PostgreSQL
- incident and dashboard-oriented frontend
- modular backend structure in both Rust and TurboRepo implementations

## Why This Design Matters

This architecture improves resilience in several ways:

- Producers and workers are decoupled, so checks can continue even if one service is restarted.
- Results are persisted, so historical visibility is preserved.
- Workers can scale horizontally for larger monitoring workloads.
- The frontend remains separated from the check execution pipeline.
- The design supports future extensions such as alerting, retries, region-based checks, and status-page generation.

## Suggested Future Improvements

- email, SMS, or webhook alerting
- multi-region worker deployment
- SLO/SLA reporting
- incident timeline generation
- retry logic and failure classification
- charts for uptime percentage and response-time trends
- role-based access control
- Docker Compose or Kubernetes deployment manifests

## Repo Structure

```text
BetterStack/
|-- Readme.md
|-- BetterStack_Rust/
|   |-- api/
|   |-- worker/
|   |-- store/
|   |-- redis/
|   `-- pusher/
|-- BetterStack_turbo/
|   |-- apps/
|   |   |-- my-app/
|   |   |-- api/
|   |   |-- pusher/
|   |   `-- worker/
|   `-- packages/
|       |-- store/
|       |-- redis-stream/
|       `-- ui/
`-- redis_stream_ex/
```

## Conclusion

BetterStack is a practical distributed monitoring platform that combines a Rust backend implementation with a TurboRepo-based frontend and service ecosystem. It addresses a real-world reliability problem: monitoring must remain trustworthy even when parts of the infrastructure are under stress. By combining persistent storage, asynchronous workers, Redis Streams, and a dashboard interface, the project creates a strong foundation for resilient service monitoring.

## References (IEEE Format)

[1] T. Strickx and J. Hartman, "Cloudflare outage on June 21, 2022," Cloudflare Blog, Jun. 21, 2022. [Online]. Available: https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/

[2] R. Ewaschuk, "Monitoring Distributed Systems," in *Site Reliability Engineering*, Google SRE. [Online]. Available: https://sre.google/sre-book/monitoring-distributed-systems/

[3] R. Lu et al., "Perseus: A Fail-Slow Detection Framework for Cloud Storage Systems," in *21st USENIX Conference on File and Storage Technologies (FAST '23)*, 2023. [Online]. Available: https://www.usenix.org/conference/fast23/presentation/lu

[4] M. P. Kasick, J. Tan, R. Gandhi, and P. Narasimhan, "Black-Box Problem Diagnosis in Parallel File Systems," in *8th USENIX Conference on File and Storage Technologies (FAST '10)*, 2010. [Online]. Available: https://www.usenix.org/conference/fast-10/black-box-problem-diagnosis-parallel-file-systems
