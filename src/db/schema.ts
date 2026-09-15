import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. App State table - durable storage for college state snapshots
export const appState = pgTable('app_state', {
  key: text('key').primaryKey(),
  payload: text('payload').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Users table - trainers, HODs, admins, coordinators
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  username: text('username').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  department: text('department'),
  phone: text('phone'),
  email: text('email'),
  nationalId: text('national_id'),
  pfNumber: text('pf_number'),
  password: text('password'),
  isActive: boolean('is_active').default(true).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  isDemo: boolean('is_demo').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Departments table
export const departments = pgTable('departments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Courses table
export const courses = pgTable('courses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  departmentId: text('department_id').notNull(),
  code: text('code'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Classrooms table
export const classrooms = pgTable('classrooms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  capacity: integer('capacity').default(30).notNull(),
  type: text('type'),
  building: text('building'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Units table
export const units = pgTable('units', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  departmentId: text('department_id').notNull(),
  weeklyHours: integer('weekly_hours').default(3).notNull(),
  term: integer('term').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Course Groups table
export const courseGroups = pgTable('course_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  courseId: text('course_id').notNull(),
  year: integer('year').default(1).notNull(),
  term: integer('term').default(1).notNull(),
  studentCount: integer('student_count').default(30).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Timetable entries table
export const timetableEntries = pgTable('timetable_entries', {
  id: text('id').primaryKey(),
  day: text('day').notNull(),
  timeSlot: text('time_slot').notNull(),
  courseGroupId: text('course_group_id').notNull(),
  unitId: text('unit_id').notNull(),
  trainerId: text('trainer_id').notNull(),
  classroomId: text('classroom_id').notNull(),
  departmentId: text('department_id').notNull(),
  week: integer('week').default(1).notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
