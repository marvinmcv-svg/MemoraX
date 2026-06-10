/**
 * Google OAuth token storage.
 * Wraps database operations for Google OAuth tokens.
 */

import { eq } from '@memorax/db';
import { schema, requireDb } from './db';

export interface StoreGoogleTokensInput {
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  classroomUserId?: string | null;
}

export interface GoogleTokens {
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  classroomUserId: string | null;
  updatedAt?: Date;
}

export async function storeGoogleTokens(input: StoreGoogleTokensInput): Promise<void> {
  const db = requireDb();

  // Upsert: insert or update
  await db
    .insert(schema.googleOAuthTokens)
    .values({
      userId: input.userId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiry: input.tokenExpiry,
      classroomUserId: input.classroomUserId ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.googleOAuthTokens.userId,
      set: {
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        tokenExpiry: input.tokenExpiry,
        classroomUserId: input.classroomUserId ?? null,
        updatedAt: new Date(),
      },
    });

  console.log(`[google-tokens] Stored tokens for user ${input.userId}`);
}

export async function getGoogleTokens(
  userId: string
): Promise<GoogleTokens | null> {
  const db = requireDb();

  const rows = await db
    .select()
    .from(schema.googleOAuthTokens)
    .where(eq(schema.googleOAuthTokens.userId, userId))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    userId: row.userId,
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    tokenExpiry: row.tokenExpiry,
    classroomUserId: row.classroomUserId ?? null,
  };
}

export async function updateGoogleAccessToken(
  userId: string,
  accessToken: string,
  tokenExpiry: Date
): Promise<void> {
  const db = requireDb();

  await db
    .update(schema.googleOAuthTokens)
    .set({
      accessToken,
      tokenExpiry,
      updatedAt: new Date(),
    })
    .where(eq(schema.googleOAuthTokens.userId, userId));
}

export async function deleteGoogleTokens(userId: string): Promise<void> {
  const db = requireDb();

  await db
    .delete(schema.googleOAuthTokens)
    .where(eq(schema.googleOAuthTokens.userId, userId));

  console.log(`[google-tokens] Deleted tokens for user ${userId}`);
}