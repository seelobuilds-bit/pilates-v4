# Launch Checklist

Date: 2026-02-11  
Project: Pilates v4

## 1) Environment & Secrets

- [ ] `DATABASE_URL` points to production database
- [ ] `NEXTAUTH_URL` matches production domain
- [ ] `NEXTAUTH_SECRET` is set
- [ ] `JWT_SECRET` is set
- [ ] `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are set
- [ ] `STRIPE_WEBHOOK_SECRET` is set
- [ ] `RESEND_API_KEY` and `RESEND_WEBHOOK_SECRET` are set
- [ ] `AUTOMATION_WORKER_SECRET` is set

## 2) Pre-Deploy Verification

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` has no errors
- [ ] `pnpm test:integration` passes
- [ ] `pnpm build` passes in deployment environment

## 3) Stripe & Webhooks

- [ ] Stripe webhook endpoint configured: `/api/webhooks/stripe`
- [ ] Events enabled:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `account.updated`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Webhook signing secret matches `STRIPE_WEBHOOK_SECRET`

## 4) Automation Worker

- [ ] Scheduler invokes `POST /api/internal/automations/run`
- [ ] Scheduler sends `x-automation-secret` header
- [ ] Runbook verified: `docs/automation-worker.md`

## 5) Product Smoke (Production)

- [ ] Landing page loads
- [ ] Login and registration flows work
- [ ] Studio owner dashboard loads
- [ ] Teacher dashboard loads
- [ ] Booking frontend loads for an active studio subdomain
- [ ] Booking payment intent + confirm-payment flow works
- [ ] Subscription purchase + cancel + renew flows work
- [ ] Refund flow works and audit fields update
- [ ] Store add-to-cart + checkout flow works

## 6) Post-Deploy Monitoring

- [ ] Monitor app logs for 24h (500s, webhook failures, automation failures)
- [ ] Verify outbound email deliverability
- [ ] Verify outbound SMS delivery success
- [ ] Verify Stripe webhook event processing counts
