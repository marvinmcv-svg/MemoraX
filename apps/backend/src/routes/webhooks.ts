import { Router, Request, Response, Router as ExpressRouter } from 'express';

const webhookRoutes: Router = Router();

webhookRoutes.post('/stripe', async (req: Request, res: Response) => {
  try {
    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: 'Webhook error' });
  }
});

export { webhookRoutes };
