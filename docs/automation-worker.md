# Automation Worker Runbook

This project includes an internal automation worker endpoint:

- `POST /api/internal/automations/run`

It evaluates active automations and sends queued outbound messages with idempotent event keys.

## Required Environment Variables

- `AUTOMATION_WORKER_SECRET`: shared secret for worker invocation auth

## Request Authentication

Send the secret in the `x-automation-secret` header.

## Local Invocation Example

```bash
curl -X POST http://localhost:3000/api/internal/automations/run \
  -H "x-automation-secret: $AUTOMATION_WORKER_SECRET"
```

## Production Scheduling

Trigger the endpoint from your scheduler (for example: Vercel Cron, GitHub Actions, or an external cron service) at a fixed interval.

Recommended start point:

- every 15 minutes

If reminder/follow-up automation timing needs tighter precision, reduce the schedule interval.
