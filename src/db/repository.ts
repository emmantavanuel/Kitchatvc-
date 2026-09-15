import { db } from './index.ts';
import { appState, users, departments, courses, classrooms, units, courseGroups, timetableEntries } from './schema.ts';
import { eq } from 'drizzle-orm';

/**
 * Robust, sanitized query layer for Cloud SQL PostgreSQL
 */

export async function getSqlAppState(): Promise<any | null> {
  try {
    const records = await db.select().from(appState).where(eq(appState.key, 'college_state'));
    if (records.length > 0 && records[0].payload) {
      try {
        return JSON.parse(records[0].payload);
      } catch (e) {
        console.error('Failed to parse SQL app_state payload JSON:', e);
      }
    }
    return null;
  } catch (error) {
    console.error('Database query failed in getSqlAppState:', error);
    return null;
  }
}

export async function saveSqlAppState(statePayload: any): Promise<boolean> {
  try {
    const payloadStr = JSON.stringify(statePayload);

    // Upsert into app_state
    await db
      .insert(appState)
      .values({
        key: 'college_state',
        payload: payloadStr,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appState.key,
        set: {
          payload: payloadStr,
          updatedAt: new Date(),
        },
      });

    // Also sync relational tables asynchronously if provided
    if (Array.isArray(statePayload.users) && statePayload.users.length > 0) {
      syncUsersToSql(statePayload.users).catch(err => console.warn('[SQL Sync] Users note:', err?.message));
    }
    if (Array.isArray(statePayload.departments) && statePayload.departments.length > 0) {
      syncDepartmentsToSql(statePayload.departments).catch(err => console.warn('[SQL Sync] Departments note:', err?.message));
    }
    if (Array.isArray(statePayload.timetableEntries) && statePayload.timetableEntries.length > 0) {
      syncTimetableToSql(statePayload.timetableEntries).catch(err => console.warn('[SQL Sync] Timetable note:', err?.message));
    }

    return true;
  } catch (error) {
    console.error('Database save failed in saveSqlAppState:', error);
    return false;
  }
}

async function syncUsersToSql(userList: any[]) {
  for (const u of userList) {
    if (!u.id) continue;
    try {
      await db
        .insert(users)
        .values({
          userId: u.id,
          username: u.username || u.id,
          name: u.name || 'User',
          role: u.role || 'trainer',
          department: u.department || null,
          phone: u.phone || null,
          email: u.email || null,
          nationalId: u.nationalId || null,
          pfNumber: u.pfNumber || null,
          password: u.password || null,
          isActive: u.isActive !== false,
          isDefault: !!u.isDefault,
          isDemo: !!u.isDemo,
        })
        .onConflictDoUpdate({
          target: users.userId,
          set: {
            username: u.username || u.id,
            name: u.name || 'User',
            role: u.role || 'trainer',
            department: u.department || null,
            phone: u.phone || null,
            email: u.email || null,
            nationalId: u.nationalId || null,
            pfNumber: u.pfNumber || null,
            password: u.password || null,
            isActive: u.isActive !== false,
            isDefault: !!u.isDefault,
            isDemo: !!u.isDemo,
          },
        });
    } catch (e) {
      // Individual upsert logging
    }
  }
}

async function syncDepartmentsToSql(deptList: any[]) {
  for (const d of deptList) {
    if (!d.id) continue;
    try {
      await db
        .insert(departments)
        .values({
          id: d.id,
          name: d.name || 'Department',
          code: d.code || d.id,
        })
        .onConflictDoUpdate({
          target: departments.id,
          set: {
            name: d.name || 'Department',
            code: d.code || d.id,
          },
        });
    } catch (e) {}
  }
}

async function syncTimetableToSql(entryList: any[]) {
  for (const e of entryList) {
    if (!e.id) continue;
    try {
      await db
        .insert(timetableEntries)
        .values({
          id: e.id,
          day: e.day || '',
          timeSlot: e.timeSlot || '',
          courseGroupId: e.courseGroupId || '',
          unitId: e.unitId || '',
          trainerId: e.trainerId || '',
          classroomId: e.classroomId || '',
          departmentId: e.departmentId || '',
          week: e.week || 1,
          status: e.status || 'active',
        })
        .onConflictDoUpdate({
          target: timetableEntries.id,
          set: {
            day: e.day || '',
            timeSlot: e.timeSlot || '',
            courseGroupId: e.courseGroupId || '',
            unitId: e.unitId || '',
            trainerId: e.trainerId || '',
            classroomId: e.classroomId || '',
            departmentId: e.departmentId || '',
            week: e.week || 1,
            status: e.status || 'active',
          },
        });
    } catch (e) {}
  }
}
