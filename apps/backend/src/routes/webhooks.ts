import { Router, Request, Response } from 'express';
import Stripe from 'stripe';

const webhookRoutes: Router = Router();

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2024-06-20' as any });
}

/**
 * Stripe webhook handler.
 *
 * Relies on the upstream `express.json({ verify: ... })` hook (configured
 * in src/index.ts) having stashed the raw request body in `req.rawBody`.
 * We MUST verify the signature before trusting the event, otherwise this
 * endpoint is an open relay that lets anyone fake Stripe events.
 *
 * Returns 503 if Stripe is not configured, 400 on missing/invalid
 * signature, 200 on verified events.
 */
webhookRoutes.post('/stripe', async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripe = getStripeClient();
    if (!webhookSecret || !stripe) {
      res.status(503).json({ error: 'Stripe not configured' });
      return;
    }

    const sigHeader = req.headers['stripe-signature'];
    if (typeof sigHeader !== 'string' || sigHeader.length === 0) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody || rawBody.length === 0) {
      res.status(400).json({ error: 'Empty request body' });
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sigHeader, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signature verification failed';
      res.status(400).json({ error: `Webhook signature verification failed: ${message}` });
      return;
    }

    console.log(`[stripe-webhook] verified event type=${event.type} id=${event.id}`);
    res.status(200).json({ received: true, type: event.type, id: event.id });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook handler error' });
  }
});

export { webhookRoutes };
