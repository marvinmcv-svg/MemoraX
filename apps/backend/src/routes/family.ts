import { Router, Request, Response } from 'express';
import { eq, and } from '@memorax/db';
import { schema, requireDb } from '../lib/db';
import { v4 as uuid } from 'uuid';
import { randomBytes } from 'crypto';
import { homeworkRepository } from '../repositories/homework';

const familyRoutes: Router = Router();

/**
 * Generate a family link code.
 * Parent calls this to get a code they share with their child.
 */
familyRoutes.post('/generate-code', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const db = requireDb();

    // Check if user already has an active link
    const existing = await db
      .select()
      .from(schema.familyGroups)
      .where(and(
        eq(schema.familyGroups.parentId, userId),
        eq(schema.familyGroups.status, 'active')
      ))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'You already have an active family link. Unlink first to generate a new code.',
        existingLink: { childId: existing[0].childId }
      });
    }

    // Generate 8-character alphanumeric code
    const code = randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete any existing pending links for this parent
    await db.delete(schema.familyGroups).where(and(
      eq(schema.familyGroups.parentId, userId),
      eq(schema.familyGroups.status, 'pending')
    ));

    const [link] = await db.insert(schema.familyGroups).values({
      id: uuid(),
      parentId: userId,
      childId: uuid(), // placeholder until accepted
      linkCode: code,
      codeExpiresAt: expiresAt,
      status: 'pending',
    }).returning();

    return res.status(201).json({
      linkCode: code,
      expiresAt: expiresAt.toISOString(),
      instructions: 'Share this code with your child. They can accept it via WhatsApp or their dashboard.'
    });
  } catch (error) {
    console.error('Error generating family link code:', error);
    return res.status(500).json({ error: 'Failed to generate link code' });
  }
});

/**
 * Accept a family link code.
 * Child calls this with the code from their parent.
 */
familyRoutes.post('/accept-code', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Link code is required' });
    }

    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.length !== 8) {
      return res.status(400).json({ error: 'Invalid code format. Expected 8 characters.' });
    }

    const db = requireDb();

    // Find the pending link with this code
    const links = await db
      .select()
      .from(schema.familyGroups)
      .where(and(
        eq(schema.familyGroups.linkCode, normalizedCode),
        eq(schema.familyGroups.status, 'pending')
      ))
      .limit(1);

    if (links.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired link code. Ask your parent for a new one.' });
    }

    const link = links[0];

    // Check expiry
    if (link.codeExpiresAt && new Date(link.codeExpiresAt) < new Date()) {
      return res.status(410).json({ error: 'This link code has expired. Ask your parent to generate a new one.' });
    }

    // Check if already linked to another parent
    const existingChildLink = await db
      .select()
      .from(schema.familyGroups)
      .where(and(
        eq(schema.familyGroups.childId, userId),
        eq(schema.familyGroups.status, 'active')
      ))
      .limit(1);

    if (existingChildLink.length > 0) {
      return res.status(409).json({
        error: 'You are already linked to a parent. Unlink first to accept a new code.',
        existingParentId: existingChildLink[0].parentId
      });
    }

    // Activate the link
    const [updated] = await db
      .update(schema.familyGroups)
      .set({
        childId: userId,
        status: 'active',
        linkCode: null, // Clear code after use
        codeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.familyGroups.id, link.id))
      .returning();

    // Get parent info
    const parentRows = await db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, link.parentId))
      .limit(1);

    return res.status(200).json({
      success: true,
      link: {
        id: updated.id,
        parentId: updated.parentId,
        parentName: parentRows[0]?.name ?? 'Parent',
        parentEmail: parentRows[0]?.email ?? null,
        status: updated.status,
        createdAt: updated.createdAt,
      }
    });
  } catch (error) {
    console.error('Error accepting family link code:', error);
    return res.status(500).json({ error: 'Failed to accept link code' });
  }
});

/**
 * Get family link status for the current user.
 * Returns link details whether user is parent or child.
 */
familyRoutes.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const db = requireDb();

    // Check if user is a parent
    const parentLinks = await db
      .select({
        id: schema.familyGroups.id,
        parentId: schema.familyGroups.parentId,
        childId: schema.familyGroups.childId,
        status: schema.familyGroups.status,
        createdAt: schema.familyGroups.createdAt,
      })
      .from(schema.familyGroups)
      .where(and(
        eq(schema.familyGroups.parentId, userId),
        eq(schema.familyGroups.status, 'active')
      ))
      .limit(1);

    // Check if user is a child
    const childLinks = await db
      .select({
        id: schema.familyGroups.id,
        parentId: schema.familyGroups.parentId,
        childId: schema.familyGroups.childId,
        status: schema.familyGroups.status,
        createdAt: schema.familyGroups.createdAt,
      })
      .from(schema.familyGroups)
      .where(and(
        eq(schema.familyGroups.childId, userId),
        eq(schema.familyGroups.status, 'active')
      ))
      .limit(1);

    if (parentLinks.length > 0) {
      // Get child info
      const childRows = await db
        .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.id, parentLinks[0].childId))
        .limit(1);

      return res.json({
        role: 'parent',
        link: {
          id: parentLinks[0].id,
          childId: parentLinks[0].childId,
          childName: childRows[0]?.name ?? 'Child',
          childEmail: childRows[0]?.email ?? null,
          status: parentLinks[0].status,
          linkedAt: parentLinks[0].createdAt,
        }
      });
    }

    if (childLinks.length > 0) {
      // Get parent info
      const parentRows = await db
        .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.id, childLinks[0].parentId))
        .limit(1);

      return res.json({
        role: 'child',
        link: {
          id: childLinks[0].id,
          parentId: childLinks[0].parentId,
          parentName: parentRows[0]?.name ?? 'Parent',
          parentEmail: parentRows[0]?.email ?? null,
          status: childLinks[0].status,
          linkedAt: childLinks[0].createdAt,
        }
      });
    }

    return res.json({ role: null, link: null });
  } catch (error) {
    console.error('Error getting family link status:', error);
    return res.status(500).json({ error: 'Failed to get link status' });
  }
});

/**
 * Unlink family connection.
 * Either parent or child can call this.
 */
familyRoutes.delete('/unlink', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const db = requireDb();

    // Find any active link where user is parent or child
    const links = await db
      .select()
      .from(schema.familyGroups)
      .where(
        and(
          eq(schema.familyGroups.status, 'active'),
          eq(schema.familyGroups.parentId, userId)
        )
      )
      .limit(1);

    const childLinks = await db
      .select()
      .from(schema.familyGroups)
      .where(
        and(
          eq(schema.familyGroups.status, 'active'),
          eq(schema.familyGroups.childId, userId)
        )
      )
      .limit(1);

    const linkToRemove = links.length > 0 ? links[0] : childLinks.length > 0 ? childLinks[0] : null;

    if (!linkToRemove) {
      return res.status(404).json({ error: 'No active family link found' });
    }

    await db
      .update(schema.familyGroups)
      .set({
        status: 'unlinked',
        updatedAt: new Date(),
      })
      .where(eq(schema.familyGroups.id, linkToRemove.id));

    return res.json({ success: true, message: 'Family link removed' });
  } catch (error) {
    console.error('Error unlinking family:', error);
    return res.status(500).json({ error: 'Failed to unlink' });
  }
});

/**
 * Get child's homework (for parents).
 * Only accessible if current user is the parent in an active link.
 */
familyRoutes.get('/child-homework', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const db = requireDb();

    // Find active link where user is parent
    const links = await db
      .select({ childId: schema.familyGroups.childId })
      .from(schema.familyGroups)
      .where(and(
        eq(schema.familyGroups.parentId, userId),
        eq(schema.familyGroups.status, 'active')
      ))
      .limit(1);

    if (links.length === 0) {
      return res.status(403).json({ error: 'You are not a parent in any active family link' });
    }

    const childId = links[0].childId;

    // Get child's homework
    const homework = await homeworkRepository.findByUser(childId);

    // Get child info
    const childRows = await db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, childId))
      .limit(1);

    return res.json({
      child: {
        id: childId,
        name: childRows[0]?.name ?? 'Child',
        email: childRows[0]?.email ?? null,
      },
      homework,
      total: homework.length,
    });
  } catch (error) {
    console.error('Error getting child homework:', error);
    return res.status(500).json({ error: 'Failed to get child homework' });
  }
});

/**
 * Get pending family link codes for a parent.
 * Returns any pending (unused) codes.
 */
familyRoutes.get('/pending-codes', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const db = requireDb();

    const pendingLinks = await db
      .select({
        id: schema.familyGroups.id,
        linkCode: schema.familyGroups.linkCode,
        codeExpiresAt: schema.familyGroups.codeExpiresAt,
        status: schema.familyGroups.status,
      })
      .from(schema.familyGroups)
      .where(and(
        eq(schema.familyGroups.parentId, userId),
        eq(schema.familyGroups.status, 'pending')
      ));

    return res.json({ codes: pendingLinks });
  } catch (error) {
    console.error('Error getting pending codes:', error);
    return res.status(500).json({ error: 'Failed to get pending codes' });
  }
});

export { familyRoutes };