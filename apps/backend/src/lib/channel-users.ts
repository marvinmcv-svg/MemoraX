import { eq, and } from '@memorax/db';
import { schema, requireDb } from '../lib/db';
import { v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export function channelUserIdToUuid(channel: string, channelUserId: string): string {
  return uuidv5(`${channel}:${channelUserId}`, UUID_NAMESPACE);
}

export async function getOrCreateChannelUser(
  channel: string,
  channelUserId: string
): Promise<string> {
  const db = requireDb();
  const userId = channelUserIdToUuid(channel, channelUserId);

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (existing.length > 0) {
    return userId;
  }

  await db.insert(schema.users).values({
    id: userId,
    clerkId: `channel-${channel}:${channelUserId}`,
    email: `channel-${channel}-${channelUserId}@memorax.local`,
    name: `Channel ${channel} user`,
    timezone: 'UTC',
    plan: 'free',
  }).onConflictDoNothing();

  return userId;
}
