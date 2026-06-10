/**
 * Google OAuth 2.0 service for Google Classroom integration.
 * Handles token exchange, refresh, and storage.
 */

const GOOGLE_OAUTH_URL = 'https://oauth2.googleapis.com';
const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.readonly',
  'https://www.googleapis.com/auth/classroom.profile.readonly',
].join(' ');

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/v1/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth not configured: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Build the Google OAuth authorization URL.
 */
export function getAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getOAuthConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();

  const response = await fetch(`${GOOGLE_OAUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[google-oauth] Token exchange failed:', error);
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

/**
 * Refresh an access token using a refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getOAuthConfig();

  const response = await fetch(`${GOOGLE_OAUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[google-oauth] Token refresh failed:', error);
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

/**
 * Get user info from Google API.
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.status}`);
  }

  return response.json() as Promise<GoogleUserInfo>;
}

/**
 * Make an authenticated request to the Google Classroom API.
 */
export async function googleClassroomApi<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `https://classroom.googleapis.com/v1/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[classroom-api] API request failed:', response.status, error);
    throw new Error(`Google Classroom API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Calculate token expiry date from expires_in seconds.
 */
export function calculateExpiry(expiresInSeconds: number): Date {
  return new Date(Date.now() + expiresInSeconds * 1000);
}

/**
 * Check if a token needs refresh (less than 5 minutes remaining).
 */
export function needsRefresh(tokenExpiry: Date): boolean {
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() > tokenExpiry.getTime() - fiveMinutes;
}