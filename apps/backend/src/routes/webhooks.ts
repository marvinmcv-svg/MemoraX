import { Router, Request, Response } from 'express';

const webhookRoutes: Router = Router();

// ---------------------------------------------------------------------------
// Stripe webhook
// ---------------------------------------------------------------------------
webhookRoutes.post('/stripe', async (req: Request, res: Response) => {
  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret) {
    console.warn('[stripe] STRIPE_WEBHOOK_SECRET not configured — skipping signature verification');
  }

  let event: StripeEvent;

  // Verify signature when configured
  if (stripeSecret) {
    const sig = req.headers['stripe-signature'] as string;
    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    try {
      event = verifyStripeSignature(req.body as Buffer, sig, stripeSecret);
    } catch (err) {
      console.error('[stripe] Signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } else {
    event = req.body as StripeEvent;
  }

  try {
    await handleStripeEvent(event);
    return res.json({ received: true });
  } catch (err) {
    console.error('[stripe] Event handling error:', err);
    return res.status(500).json({ error: 'Webhook handler error' });
  }
});

// ---------------------------------------------------------------------------
// Stripe types (minimal)
// ---------------------------------------------------------------------------
interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// Stripe signature verification (HMAC-SHA256, no stripe SDK needed)
// ---------------------------------------------------------------------------
function verifyStripeSignature(payload: Buffer, sigHeader: string, secret: string): StripeEvent {
  const parts = sigHeader.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const signature = parts['v1'];

  if (!timestamp || !signature) {
    throw new Error('Invalid stripe-signature header format');
  }

  // Tolerance: 5 minutes
  const timeDiff = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (timeDiff > 300) {
    throw new Error('Stripe webhook timestamp too old');
  }

  const signedPayload = `${timestamp}.${payload.toString('utf8')}`;
  const crypto = require('crypto') as typeof import('crypto');
  const expectedSig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  if (expectedSig !== signature) {
    throw new Error('Stripe signature mismatch');
  }

  return JSON.parse(payload.toString('utf8')) as StripeEvent;
}

// ---------------------------------------------------------------------------
// Plan limits (in-memory; replace with DB in production)
// ---------------------------------------------------------------------------
const userPlans = new Map<string, { plan: string; memoriesThisMonth: number; renewsAt: Date }>();

function getPlan(customerId: string): string {
  return userPlans.get(customerId)?.plan ?? 'free';
}

function upgradePlan(customerId: string, plan: string, renewsAt: Date): void {
  const existing = userPlans.get(customerId);
  userPlans.set(customerId, {
    plan,
    memoriesThisMonth: existing?.memoriesThisMonth ?? 0,
    renewsAt,
  });
  console.log(`[stripe] User ${customerId} upgraded to ${plan}, renews ${renewsAt.toISOString()}`);
}

function cancelPlan(customerId: string): void {
  const existing = userPlans.get(customerId);
  if (existing) {
    userPlans.set(customerId, { ...existing, plan: 'free' });
  }
  console.log(`[stripe] User ${customerId} downgraded to free`);
}

// ---------------------------------------------------------------------------
// Stripe event handlers
// ---------------------------------------------------------------------------
const PLAN_NAMES: Record<string, string> = {
  price_pro_monthly: 'pro',
  price_pro_yearly: 'pro',
  price_team_monthly: 'team',
  price_team_yearly: 'team',
};

async function handleStripeEvent(event: StripeEvent): Promise<void> {
  const obj = event.data.object as Record<string, unknown>;

  switch (event.type) {
    case 'checkout.session.completed': {
      const customerId = obj.customer as string;
      const subscriptionId = obj.subscription as string;
      console.log(`[stripe] Checkout completed: customer=${customerId} subscription=${subscriptionId}`);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const customerId = obj.customer as string;
      const status = obj.status as string;
      const items = (obj.items as { data: Array<{ price: { id: string } }> })?.data ?? [];
      const priceId = items[0]?.price?.id ?? '';
      const planName = PLAN_NAMES[priceId] ?? 'pro';
      const renewsAt = new Date(((obj.current_period_end as number) ?? 0) * 1000);

      if (['active', 'trialing'].includes(status)) {
        upgradePlan(customerId, planName, renewsAt);
      } else if (['canceled', 'unpaid', 'past_due'].includes(status)) {
        cancelPlan(customerId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const customerId = obj.customer as string;
      cancelPlan(customerId);
      break;
    }

    case 'invoice.payment_failed': {
      const customerId = obj.customer as string;
      console.warn(`[stripe] Payment failed for customer ${customerId}`);
      break;
    }

    default:
      console.log(`[stripe] Unhandled event type: ${event.type}`);
  }
}

// Export plan lookup for middleware use
export { getPlan, userPlans };
export { webhookRoutes };
