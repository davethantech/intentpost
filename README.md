# IntentPost Intelligence

Production-oriented revenue orchestration foundation for IntentPost / Mailin.ai.

## What this build does

- Multi-tenant PostgreSQL data model with organization isolation
- CRM/signal ingestion through authenticated, idempotent webhooks
- Intent graph and explainable intent / physical-intervention scoring
- Structured AI decisioning: `SEND`, `WAIT`, `DIGITAL_ONLY`, `DO_NOTHING`
- Policy and suppression checks before physical outreach
- Durable PostgreSQL-backed job queue with `FOR UPDATE SKIP LOCKED`, retries and backoff
- Separate API and worker processes for horizontal scaling
- AI decision audit trail
- Fulfillment adapter architecture with mock-safe default
- QR attribution from physical touch to downstream engagement
- Rate limiting, secure JWT validation, security headers, CORS allow-listing and graceful shutdown
- Docker production stack with PostgreSQL, migrations, API and worker

## Production boundary

This repository is structured for production deployment, but a real customer launch still requires environment-specific operational work: real CRM/provider credentials, a production fulfillment provider contract, domain/TLS configuration, backups/restore testing, monitoring/alerting, load testing and security review. Live physical fulfillment is deliberately disabled by default.

## Run with Docker

1. Copy `.env.example` to `.env`.
2. Replace every `GENERATE_*` / `CHANGE_ME` value with real secrets.
3. Set `CORS_ORIGINS` and `APP_BASE_URL` to the production application URL.
4. Keep `FULFILLMENT_PROVIDER=mock` and `ENABLE_LIVE_FULFILLMENT=false` until the provider is configured and tested.
5. Start the stack:

```bash
docker compose up -d --build
```

6. Verify:

```bash
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:3000/api/ready
```

## Direct Node deployment

Requires Node 22+ and PostgreSQL 16+.

```bash
npm install
cp .env.example .env
npm run migrate
npm start
```

Run the worker separately:

```bash
npm run worker
```

## Architecture

`Internet -> HTTPS reverse proxy -> API -> PostgreSQL`

`                         -> durable jobs -> Worker -> AI / CRM / fulfillment`

Multiple API and worker instances can run against the same PostgreSQL database. Job claiming is transactionally serialized so two workers do not process the same queued job simultaneously.

## OpenAI

The default model is `gpt-5.6-luna`, selected for cost-sensitive/high-volume workloads. Change it with `OPENAI_MODEL` when a different supported model is appropriate.

## Safety defaults

- No in-process database fallback
- No in-process job execution
- No live fulfillment by default
- No default production JWT secret
- Webhooks require HMAC verification
- Webhook events are idempotent
- API requests are rate limited
- Organization IDs are enforced on database queries
