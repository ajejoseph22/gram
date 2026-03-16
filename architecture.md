# Architecture

## Table of Contents

- [System Overview](#system-overview)
- [Key Architectural Decisions](#key-architectural-decisions)
- [Next Steps for Production](#next-steps-for-production)

---

## System Overview

Gram is a three-tier anonymous image-sharing app. A React SPA calls an Express API over REST and WebSockets, backed by a PostgreSQL database. All services are containerized and orchestrated with Docker Compose.

---

## Key Architectural Decisions

### 1. Cursor-based pagination over offset-based pagination for the feed endpoint

The feed uses keyset pagination on a compound `(created_at DESC, id DESC)` index. The cursor is a `base64url(timestamp + "_" + uuid)` token that the client passes back opaquely.

**Why it matters:** Offset pagination breaks under concurrent writes — inserting a post shifts every subsequent page by one, causing duplicates or missed items. Cursor pagination is immune to this because the cursor anchors to a specific row, not a position. The compound key guarantees stable ordering even when posts share the same timestamp.

### Magic-byte file validation over extension checks

Uploaded files are validated by reading their binary signature with the `file-type` library, not by trusting the file extension or the `Content-Type` header.

**Why it matters:** Extensions and headers are user-controlled and trivially spoofed. A `.jpg` extension on a PHP script would pass extension-based validation. Magic-byte inspection reads the first bytes of the actual file data, making it significantly harder to smuggle malicious content through the upload pipeline.

### Image normalization at ingest

Every upload passes through [Sharp](https://www.npmjs.com/package/sharp) before storage: EXIF auto-rotation, resize to a 2048px ceiling, and format-preserving output.

**Why it matters:** Mobile cameras embed orientation in EXIF metadata rather than rotating pixels, so without auto-rotation, images display sideways in browsers that ignore EXIF. The 2048px cap prevents a 20MP phone photo from becoming a 15MB payload on every feed scroll. Doing this once at ingest time means the stored file is always display-ready (no runtime processing cost on reads).

### Pending-posts buffer for live updates

WebSocket events don't inject directly into the feed. They accumulate in a `pendingPosts` buffer, and a floating "N new posts" button lets the user flush them in.

**Why it matters:** Directly prepending posts causes layout shifts — images push content down mid-scroll, which is bad UX. The buffer pattern (also used by Twitter/X) preserves the scroll position while still signaling freshness. On socket reconnect, the first page is refetched to catch any events missed during disconnection.

### Zod as the single schema language

Zod schemas drive request validation, OpenAPI spec generation (via `zod-to-openapi`), environment config parsing, and frontend form validation. One schema definition produces runtime checks, type inference, and API documentation.

**Why it matters:** Schema duplication is a common source of drift (the OpenAPI doc says one thing, the validator enforces another, and the TypeScript types assume yet another). A single source of truth eliminates that entire class of bugs. Adding a field to a Zod schema automatically updates the validation, the types, and the Swagger docs.

### Feature-first module structure

Code is organized by domain (`modules/post/`, `modules/health-check/`) rather than by technical layer (`controllers/`, `services/`, `routes/`). Each module owns its router, controller, service, validators, and utilities.

**Why it matters:** Everything related to a particular feature lives in one folder. Adding, changing, or removing a feature means touching one directory instead of jumping across many.

### Multi-stage Docker builds with slim Node runners

The API Dockerfile uses a straightforward multi-stage flow: `base`, `deps`, `build`, `prod-deps`, `migrate`, and `runner`. The API runtime stays on `node:22-slim`, the migrate target reuses the full dependency install so the Prisma CLI is available there, and the final API image copies only the built `dist/` output plus pruned production dependencies. The web Dockerfile produces a static Vite build served by `nginx:alpine`.

**Why it matters:** This keeps the images lean and the Docker setup, easy to debug and reason about.

---

## Next Steps for Production

### Image upload queuing

**The problem:** [Sharp](https://www.npmjs.com/package/sharp) processing blocks the request thread. Under concurrent uploads, the event loop saturates and response times spike.

**The approach:** The API would accept the upload, return `202 Accepted` with a job ID, and push image processing into a BullMQ worker backed by Redis. The worker processes images off the main event loop and emits `post.created` via Socket.IO when done. Workers scale independently of the API (we can run 5 workers behind one API instance during traffic spikes).

### Object storage with presigned uploads

**The problem:** Local filesystem storage doesn't survive stateless container deployments and creates a single-server bottleneck.

**The approach:** Replace the local storage adapter with S3 or other bucket storage. Use presigned URLs so clients upload images directly to the bucket. Add a CDN (CloudFront / Cloudflare) to serve images from edge locations. Normalization and validation will still happen (async) in the worker, but the processed image is uploaded to the bucket instead of saved locally.

### Query caching

**The problem:** The feed query hits PostgreSQL on every request which can be expensive at scale.

**The approach:** Cache the first page of each tag combination in Redis with a short TTL (~30s). On `post.created` events, invalidate matching cache keys.

### Horizontal Scaling (API & WebSockets)

**The problem:** Currently, Socket.IO broadcasts only work within a single instance. This is fine for development and small deployments, but in a production environment with multiple API instances behind a load balancer, WebSocket events won't propagate across instances i.e a client connected to instance A won't receive events emitted by instance B.

**The approach:** Add `@socket.io/redis-adapter` so WebSocket events propagate across multiple API instances via Redis pub/sub — required for horizontal scaling.

### Integration and E2E testing

**The problem:** The current test suite covers unit-level logic but doesn't verify the full request lifecycle or integration-level flows.

**The approach:** Add API integration tests using Supertest against a real PostgreSQL instance via Testcontainers. Add Playwright E2E tests for the critical paths: upload, feed scroll, tag filtering, and live WebSocket updates.

### Observability stack

**The problem:** Structured logging (currently implemented) isn't enough to diagnose production issues across distributed services.

**The approach:** Add metrics (request latency, error rates, queue depth, active WebSocket connections etc.) and distributed tracing across API and worker processes, and error capture with source maps for both frontend & backend.
