# IntentPost Intelligence

Enterprise revenue orchestration foundation: intent graph, AI decision engine, policy/suppression, async jobs, fulfillment adapters, attribution, and dashboard.

> This repository contains the enterprise foundation build. Live fulfillment remains disabled by default (`FULFILLMENT_PROVIDER=mock`).

## Run

```bash
npm install
cp .env.example .env
npm run migrate
npm run seed
npm start
```

Health: `GET /api/health`

## Production notes

Configure PostgreSQL, JWT secrets, OpenAI credentials, webhook HMAC secret, and a real fulfillment provider before production use. The included job queue and adapters are foundations and should be hardened/replaced with durable infrastructure for high-scale production.
