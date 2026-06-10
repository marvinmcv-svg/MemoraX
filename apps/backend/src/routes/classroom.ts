import { Router, Request, Response } from 'express';
import {
  syncClassroomForUser,
  getClassroomCourses,
  getCourseAssignments,
  type ClassroomSyncResult,
} from '../services/classroom-sync';
import { getGoogleTokens, updateGoogleAccessToken } from '../lib/google-tokens';
import { refreshAccessToken, needsRefresh } from '../services/google-oauth';

const classroomRoutes: Router = Router();

/**
 * Get user's Google Classroom courses.
 * GET /api/v1/classroom/courses
 */
classroomRoutes.get('/courses', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tokens = await getGoogleTokens(userId);
    if (!tokens) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    let accessToken = tokens.accessToken;
    if (needsRefresh(tokens.tokenExpiry)) {
      const refreshed = await refreshAccessToken(tokens.refreshToken);
      accessToken = refreshed.access_token;
      await updateGoogleAccessToken(userId, refreshed.access_token, new Date(Date.now() + refreshed.expires_in * 1000));
    }

    const courses = await getClassroomCourses(accessToken);

    return res.json({
      data: courses.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        section: c.section,
        room: c.room,
      })),
      total: courses.length,
    });
  } catch (err) {
    console.error('[classroom] Error fetching courses:', err);
    return res.status(500).json({ error: 'Failed to fetch Google Classroom courses' });
  }
});

/**
 * Get assignments for a specific course.
 * GET /api/v1/classroom/courses/:courseId/assignments
 */
classroomRoutes.get('/courses/:courseId/assignments', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { courseId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tokens = await getGoogleTokens(userId);
    if (!tokens) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    let accessToken = tokens.accessToken;
    if (needsRefresh(tokens.tokenExpiry)) {
      const refreshed = await refreshAccessToken(tokens.refreshToken);
      accessToken = refreshed.access_token;
      await updateGoogleAccessToken(userId, refreshed.access_token, new Date(Date.now() + refreshed.expires_in * 1000));
    }

    const assignments = await getCourseAssignments(accessToken, courseId);

    return res.json({
      data: assignments.map(a => ({
        id: a.id,
        courseId: a.courseId,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        dueTime: a.dueTime,
        state: a.state,
        workType: a.workType,
        maxPoints: a.maxPoints,
      })),
      total: assignments.length,
    });
  } catch (err) {
    console.error('[classroom] Error fetching assignments:', err);
    return res.status(500).json({ error: 'Failed to fetch course assignments' });
  }
});

/**
 * Trigger a manual sync of all Google Classroom data.
 * POST /api/v1/classroom/sync
 */
classroomRoutes.post('/sync', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tokens = await getGoogleTokens(userId);
    if (!tokens) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    const result: ClassroomSyncResult = {
      coursesImported: 0,
      assignmentsCreated: 0,
      assignmentsUpdated: 0,
      errors: [],
    };

    // Perform sync
    const syncResult = await syncClassroomForUser(
      userId,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.tokenExpiry
    );

    // Update token if it was refreshed during sync
    const updatedTokens = await getGoogleTokens(userId);
    if (updatedTokens && updatedTokens.accessToken !== tokens.accessToken) {
      console.log('[classroom] Access token was refreshed during sync, updated in DB');
    }

    return res.json({
      success: true,
      sync: syncResult,
    });
  } catch (err) {
    console.error('[classroom] Sync error:', err);
    return res.status(500).json({ error: 'Failed to sync Google Classroom data' });
  }
});

/**
 * Get sync status (last sync info).
 * GET /api/v1/classroom/sync/status
 *
 * Returns metadata about the most recently synced assignments.
 */
classroomRoutes.get('/sync/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tokens = await getGoogleTokens(userId);
    if (!tokens) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    // Get count of classroom-sourced homework
    const { homeworkStore } = await import('../lib/store');
    const allHomework = await homeworkStore.findByUser(userId);
    const classroomHomework = allHomework.filter(h => h.source === 'classroom');

    return res.json({
      connected: true,
      lastUpdated: tokens.updatedAt?.toISOString() || null,
      tokenExpiry: tokens.tokenExpiry?.toISOString() || null,
      homeworkCount: classroomHomework.length,
      needsRefresh: needsRefresh(tokens.tokenExpiry),
    });
  } catch (err) {
    console.error('[classroom] Error getting sync status:', err);
    return res.status(500).json({ error: 'Failed to get sync status' });
  }
});

export { classroomRoutes };