import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  getGoogleUserInfo,
  calculateExpiry,
} from '../services/google-oauth';

const googleAuthRoutes: Router = Router();

/**
 * Initiate Google OAuth flow.
 * GET /api/v1/auth/google
 *
 * Redirects user to Google's consent screen.
 * After approval, Google redirects to /api/v1/auth/google/callback
 */
googleAuthRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({ error: 'Google OAuth not configured' });
    }

    // Generate state parameter (includes user ID to validate callback)
    const state = Buffer.from(
      JSON.stringify({ userId, nonce: uuid() })
    ).toString('base64url');

    const authUrl = getAuthorizationUrl(state);
    console.log(`[google-auth] Redirecting user ${userId} to Google OAuth`);

    return res.redirect(authUrl);
  } catch (error) {
    console.error('[google-auth] Error initiating OAuth:', error);
    return res.status(500).json({ error: 'Failed to initiate Google OAuth' });
  }
});

/**
 * Google OAuth callback.
 * GET /api/v1/auth/google/callback
 *
 * Handles the redirect from Google with authorization code.
 */
googleAuthRoutes.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  // Handle user cancellation or error
  if (error) {
    console.warn(`[google-auth] OAuth error: ${error}`);
    // Redirect to settings page with error
    return res.redirect(
      `${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/dashboard/settings?google_error=${encodeURIComponent(error as string)}`
    );
  }

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state parameter' });
  }

  try {
    // Validate state parameter
    let stateData: { userId: string; nonce: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    const { userId } = stateData;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    console.log(
      `[google-auth] OAuth success for user ${userId}, Google user: ${googleUser.email}`
    );

    // Store tokens in database
    const { storeGoogleTokens } = await import('../lib/google-tokens');
    await storeGoogleTokens({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      tokenExpiry: calculateExpiry(tokens.expires_in),
      classroomUserId: googleUser.id,
    });

    // Redirect to settings page with success
    return res.redirect(
      `${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/dashboard/settings?google_connected=true`
    );
  } catch (err) {
    console.error('[google-auth] OAuth callback error:', err);
    return res.redirect(
      `${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/dashboard/settings?google_error=token_exchange_failed`
    );
  }
});

/**
 * Disconnect Google Classroom.
 * DELETE /api/v1/auth/google
 *
 * Removes Google OAuth tokens for the authenticated user.
 */
googleAuthRoutes.delete('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { deleteGoogleTokens } = await import('../lib/google-tokens');
    await deleteGoogleTokens(userId);

    console.log(`[google-auth] Disconnected Google account for user ${userId}`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[google-auth] Error disconnecting Google:', err);
    return res.status(500).json({ error: 'Failed to disconnect Google account' });
  }
});

/**
 * Get connection status.
 * GET /api/v1/auth/google/status
 *
 * Returns whether the user has connected their Google account.
 */
googleAuthRoutes.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { getGoogleTokens } = await import('../lib/google-tokens');
    const tokens = await getGoogleTokens(userId);

    return res.json({
      connected: !!tokens,
      expiresAt: tokens?.tokenExpiry?.toISOString() || null,
    });
  } catch (err) {
    console.error('[google-auth] Error getting status:', err);
    return res.status(500).json({ error: 'Failed to get Google connection status' });
  }
});

export { googleAuthRoutes };