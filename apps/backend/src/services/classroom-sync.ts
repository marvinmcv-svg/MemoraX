/**
 * Google Classroom sync service.
 * Fetches courses and assignments from Google Classroom and syncs to MemoraX homework.
 */

import { googleClassroomApi, refreshAccessToken, needsRefresh, calculateExpiry } from './google-oauth';
import { homeworkStore } from '../lib/store';
import type { HomeworkStatus, HomeworkSource, HomeworkPriority } from '@memorax/shared';

const GOOGLE_CLASSROOM_API = 'https://classroom.googleapis.com/v1';

export interface GoogleCourse {
  id: string;
  name: string;
  description?: string;
  section?: string;
  room?: string;
  ownerId: string;
  creationTime: string;
  updateTime: string;
}

export interface GoogleCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes: number;
  };
  workType: 'ASSIGNMENT' | 'SHORT_ANSWER_QUESTION' | 'MULTIPLE_CHOICE_QUESTION' | 'ESSEY';
  state: 'CREATED' | 'PUBLISHED' | 'DELETED';
  createdTime: string;
  updateTime: string;
  maxPoints?: number;
}

export interface ClassroomSyncResult {
  coursesImported: number;
  assignmentsCreated: number;
  assignmentsUpdated: number;
  errors: string[];
}

/**
 * Sync all courses and assignments from Google Classroom for a user.
 */
export async function syncClassroomForUser(
  userId: string,
  accessToken: string,
  refreshToken: string,
  currentExpiry: Date
): Promise<ClassroomSyncResult> {
  // Check if token needs refresh
  let token = accessToken;
  if (needsRefresh(currentExpiry)) {
    console.log('[classroom-sync] Refreshing access token...');
    const refreshed = await refreshAccessToken(refreshToken);
    token = refreshed.access_token;
    // Note: caller should update the stored token
  }

  const result: ClassroomSyncResult = {
    coursesImported: 0,
    assignmentsCreated: 0,
    assignmentsUpdated: 0,
    errors: [],
  };

  try {
    // Fetch all courses
    const coursesResponse = await googleClassroomApi<{ courses: GoogleCourse[] }>(
      token,
      'courses?pageSize=100'
    );

    const courses = coursesResponse.courses || [];
    result.coursesImported = courses.length;

    console.log(`[classroom-sync] Found ${courses.length} courses for user ${userId}`);

    // Process each course
    for (const course of courses) {
      try {
        const assignmentsResult = await syncCourseAssignments(
          userId,
          token,
          course,
          result
        );
        result.assignmentsCreated += assignmentsResult.created;
        result.assignmentsUpdated += assignmentsResult.updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Course ${course.id} (${course.name}): ${msg}`);
        console.error(`[classroom-sync] Error syncing course ${course.id}:`, err);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Failed to fetch courses: ${msg}`);
    console.error('[classroom-sync] Failed to fetch courses:', err);
  }

  return result;
}

/**
 * Sync assignments for a single course.
 */
async function syncCourseAssignments(
  userId: string,
  accessToken: string,
  course: GoogleCourse,
  result: ClassroomSyncResult
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  try {
    const courseworkResponse = await googleClassroomApi<{ courseWork: GoogleCourseWork[] }>(
      accessToken,
      `courses/${course.id}/courseWork?pageSize=100`
    );

    const assignments = courseworkResponse.courseWork || [];

    for (const assignment of assignments) {
      // Skip draft/deleted assignments
      if (assignment.state === 'DELETED' || assignment.state === 'CREATED') {
        continue;
      }

      // Parse due date
      let dueAt: Date | null = null;
      if (assignment.dueDate) {
        try {
          const { year, month, day } = assignment.dueDate;
          let hours = 23;
          let minutes = 59;
          if (assignment.dueTime) {
            hours = assignment.dueTime.hours;
            minutes = assignment.dueTime.minutes;
          }
          dueAt = new Date(year, month - 1, day, hours, minutes);
        } catch {
          dueAt = null;
        }
      }

      // Determine status
      let status: HomeworkStatus = 'pending';
      if (assignment.state === 'PUBLISHED') {
        if (dueAt && dueAt < new Date()) {
          status = 'overdue';
        }
      }

      // Check if assignment already exists in MemoraX
      const existingHomework = await findHomeworkByClassroomId(
        userId,
        course.id,
        assignment.id
      );

      const homeworkData = {
        userId,
        title: assignment.title,
        description: assignment.description || null,
        subject: course.name,
        dueAt,
        status,
        priority: 'medium' as HomeworkPriority,
        source: 'classroom' as HomeworkSource,
        courseId: course.id,
        classroomAssignmentId: assignment.id,
        metadata: {
          courseName: course.name,
          workType: assignment.workType,
          maxPoints: assignment.maxPoints,
          state: assignment.state,
          syncedFrom: 'google_classroom',
        },
      };

      if (existingHomework) {
        // Update existing homework (only if something changed)
        const hasChanged =
          existingHomework.title !== assignment.title ||
          existingHomework.description !== (assignment.description || null) ||
          existingHomework.status !== status;

        if (hasChanged) {
          await homeworkStore.update(existingHomework.id, userId, {
            title: assignment.title,
            description: assignment.description || null,
            status,
            metadata: homeworkData.metadata,
          });
          updated++;
        }
      } else {
        // Create new homework
        await homeworkStore.create(homeworkData);
        created++;
      }
    }
  } catch (err) {
    console.error(`[classroom-sync] Error fetching assignments for course ${course.id}:`, err);
    throw err;
  }

  return { created, updated };
}

/**
 * Find existing homework entry by Google Classroom course + assignment ID.
 */
async function findHomeworkByClassroomId(
  userId: string,
  courseId: string,
  assignmentId: string
): Promise<{ id: string; title: string; description: string | null; status: HomeworkStatus } | undefined> {
  const allHomework = await homeworkStore.findByUser(userId);
  return allHomework.find(
    h => h.courseId === courseId && h.classroomAssignmentId === assignmentId
  ) as { id: string; title: string; description: string | null; status: HomeworkStatus } | undefined;
}

/**
 * Get the list of courses a user has in Google Classroom.
 */
export async function getClassroomCourses(accessToken: string): Promise<GoogleCourse[]> {
  const response = await googleClassroomApi<{ courses: GoogleCourse[] }>(
    accessToken,
    'courses?pageSize=100'
  );
  return response.courses || [];
}

/**
 * Get assignments for a specific course.
 */
export async function getCourseAssignments(
  accessToken: string,
  courseId: string
): Promise<GoogleCourseWork[]> {
  const response = await googleClassroomApi<{ courseWork: GoogleCourseWork[] }>(
    accessToken,
    `courses/${courseId}/courseWork?pageSize=100`
  );
  return response.courseWork || [];
}