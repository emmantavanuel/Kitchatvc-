import { TimetableEntry, TrainerSlotPreference, User, Classroom, Course, Unit, SchedulingConflict, DayOfWeek } from '../types';

/**
 * Global Conflict Detection System
 * Checks for:
 * 1. Trainer Double Booking: Trainer assigned to 2 classes at the same time (even in different departments).
 * 2. Classroom Double Booking: Classroom assigned to 2 classes at the same time.
 * 3. Class/Group Double Booking: A course section (e.g. Diploma in ICT Year 1) has 2 classes scheduled at the same time.
 * 4. Trainer Unavailability: Trainer assigned to a slot they marked as unavailable.
 */
export function detectConflicts(
  entries: TimetableEntry[],
  preferences: TrainerSlotPreference[],
  users: User[],
  classrooms: Classroom[],
  courses: Course[],
  units: Unit[]
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = [];

  // Index maps for easy lookups
  const userMap = new Map(users.map(u => [u.id, u]));
  const classroomMap = new Map(classrooms.map(c => [c.id, c]));
  const courseMap = new Map(courses.map(c => [c.id, c]));
  const unitMap = new Map(units.map(u => [u.id, u]));
  const deptMap = new Map(users.filter(u => u.role === 'hod').map(u => [u.departmentId, u.name]));

  // Let's iterate through all entries to check for overlaps
  for (let i = 0; i < entries.length; i++) {
    const entryA = entries[i];
    const unitA = unitMap.get(entryA.unitId);
    const trainerA = userMap.get(entryA.trainerId);
    const roomA = classroomMap.get(entryA.classroomId);
    const courseA = courseMap.get(entryA.courseId);

    if (!unitA) continue;

    // 1. Check Trainer Unavailability
    const isUnavailable = preferences.some(
      p => p.trainerId === entryA.trainerId &&
           p.day === entryA.day &&
           p.slotId === entryA.slotId &&
           p.type === 'unavailable'
    );
    if (isUnavailable) {
      conflicts.push({
        id: `unavail-${entryA.id}`,
        type: 'trainer_unavailable',
        severity: 'error',
        message: `Trainer ${trainerA?.name || 'Unknown'} is scheduled on ${entryA.day} Slot ${entryA.slotId} but marked it as Unavailable.`,
        affectedEntries: [entryA.id],
        details: {
          day: entryA.day,
          slotId: entryA.slotId,
          trainerName: trainerA?.name,
          classroomName: roomA?.name,
          courseName: courseA?.name
        }
      } as any);
    }

      // Compare with all other entries
      for (let j = i + 1; j < entries.length; j++) {
        const entryB = entries[j];
        if (entryA.id === entryB.id) continue;

        // Only check if scheduled at the exact same day & slot
        if (entryA.day !== entryB.day || entryA.slotId !== entryB.slotId) continue;

        const unitB = unitMap.get(entryB.unitId);
        const roomB = classroomMap.get(entryB.classroomId);
        const courseB = courseMap.get(entryB.courseId);

        // Classroom Double Booking
        if (entryA.classroomId === entryB.classroomId) {
        conflicts.push({
          type: 'classroom_double_booking',
          severity: 'error',
          message: `Classroom "${roomA?.name || 'Unknown'}" is double-booked on ${entryA.day} Slot ${entryA.slotId} between ${courseA?.code || 'Course A'} and ${courseB?.code || 'Course B'}.`,
          affectedEntries: [entryA.id, entryB.id],
          details: {
            day: entryA.day,
            slotId: entryA.slotId,
            classroomName: roomA?.name,
            courseName: courseA?.name
          }
        });
      }

      // Course + Semester (Class section) Double Booking
      if (entryA.courseId === entryB.courseId && entryA.semesterName === entryB.semesterName) {
        // If both entries have distinct, non-empty groups, they are different student groups and can be scheduled concurrently
        const isDistinctGroups = (entryA.groupId && entryB.groupId && entryA.groupId !== entryB.groupId) ||
                                 (entryA.groupName && entryB.groupName && entryA.groupName !== entryB.groupName);
        
        if (!isDistinctGroups) {
          const groupSuffix = (entryA.groupName && entryB.groupName && entryA.groupName === entryB.groupName)
            ? ` - ${entryA.groupName}`
            : (entryA.groupName ? ` - ${entryA.groupName}` : (entryB.groupName ? ` - ${entryB.groupName}` : ''));
          
          conflicts.push({
            type: 'class_double_booking',
            severity: 'error',
            message: `Students of ${courseA?.code || 'Course'} (${entryA.semesterName}${groupSuffix}) are scheduled for two classes simultaneously on ${entryA.day} Slot ${entryA.slotId}: ${unitA.code} and ${unitB?.code || 'Another'}.`,
            affectedEntries: [entryA.id, entryB.id],
            details: {
              day: entryA.day,
              slotId: entryA.slotId,
              courseName: courseA?.name
            }
          });
        }
      }

      // Trainer Double Booking
      if (entryA.trainerId === entryB.trainerId && entryA.trainerId) {
        const trainerName = userMap.get(entryA.trainerId)?.name || 'Unknown Trainer';
        const courseAName = courseA?.code || 'Course A';
        const courseBName = courseB?.code || 'Course B';
        conflicts.push({
          type: 'trainer_double_booking',
          severity: 'error',
          message: `Trainer "${trainerName}" is scheduled concurrently on ${entryA.day} Slot ${entryA.slotId} for both ${courseAName} (${entryA.semesterName}) and ${courseBName} (${entryB.semesterName}).`,
          affectedEntries: [entryA.id, entryB.id],
          details: {
            day: entryA.day,
            slotId: entryA.slotId,
            trainerName,
            classroomName: roomA?.name,
            courseName: courseAName,
          }
        });
      }
    }
  }

  return conflicts;
}

/**
 * Smart Timetable Auto-Generation Algorithm
 * Tries to allocate units for a specific department and semester, satisfying all constraints.
 * It uses a heuristic constraint solver:
 * - Scans all units needing slots
 * - Evaluates every possible (Day, Slot, Classroom) combination
 * - Assigns a score (penalizes unavailable slots, rewards preferred slots)
 * - Assigns the best available combination without hard conflicts
 * - If no conflict-free slot exists, schedules anyway in the least conflicting slot and raises conflict.
 */
export function autoGenerateDepartmentTimetable(
  departmentId: string,
  semesterName: string,
  state: {
    entries: TimetableEntry[];
    preferences: TrainerSlotPreference[];
    users: User[];
    classrooms: Classroom[];
    courses: Course[];
    units: Unit[];
  }
): TimetableEntry[] {
  // 1. Keep entries of OTHER departments or OTHER semesters
  const externalEntries = state.entries.filter(
    e => !(e.departmentId === departmentId && e.semesterName === semesterName)
  );

  // 2. Identify units to schedule in this department & semester
  const deptCourses = state.courses.filter(c => c.departmentId === departmentId);
  const deptCourseIds = new Set(deptCourses.map(c => c.id));
  const unitsToSchedule = state.units.filter(u => {
    if (!deptCourseIds.has(u.courseId)) return false;
    if (u.module) {
      return u.module.toLowerCase().trim() === semesterName.toLowerCase().trim();
    }
    return true;
  });

  const generatedEntries: TimetableEntry[] = [];
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slotIds = [1, 2, 3, 4];

  // Helper to check if a classroom matches the unit type (Lab units need lab rooms)
  function isRoomSuitableForUnit(room: Classroom, unit: Unit): boolean {
    const isLabUnit = unit.name.toLowerCase().includes('programming') || 
                      unit.name.toLowerCase().includes('lab') || 
                      unit.name.toLowerCase().includes('web') || 
                      unit.name.toLowerCase().includes('wiring');
    
    if (isLabUnit) {
      return room.type === 'laboratory' || room.type === 'workshop';
    }
    return room.type === 'classroom';
  }

  // 3. For each unit, we must schedule its required number of slots
  for (const unit of unitsToSchedule) {
    const course = deptCourses.find(c => c.id === unit.courseId);
    if (!course) continue;

    // Determine candidate trainer
    // Check if there is a pre-assigned active trainer for this unit
    let trainerId = '';
    if (unit.trainerId) {
      const assignedTrainer = state.users.find(u => u.id === unit.trainerId && u.isActive);
      if (assignedTrainer) {
        trainerId = assignedTrainer.id;
      }
    }

    if (!trainerId) {
      // Look for active trainers in this department, or assign a default primary trainer
      const deptTrainers = state.users.filter(u => (u.role === 'trainer' || u.role === 'hod') && u.isActive);
      let selectedTrainer = deptTrainers.find(t => t.departmentId === departmentId);
      if (!selectedTrainer && deptTrainers.length > 0) {
        selectedTrainer = deptTrainers[0];
      }
      
      // Fallback: any active trainer
      if (!selectedTrainer) {
        selectedTrainer = state.users.find(u => (u.role === 'trainer' || u.role === 'hod') && u.isActive);
      }

      if (selectedTrainer) {
        trainerId = selectedTrainer.id;
      }
    }

    if (!trainerId) continue; // No trainer available in the system!
    const slotsNeeded = unit.slotsRequired;

    // Track assigned slots and slots per day for THIS unit in THIS pass so same unit is scheduled on the same day up to day's max hours (4 slots/8 hours)
    const slotsAssignedByDay = new Map<DayOfWeek, number>();
    const assignedSlotsForThisUnit: { day: DayOfWeek; slotId: number }[] = [];

    for (let slotIdx = 0; slotIdx < slotsNeeded; slotIdx++) {
      let bestCombination: {
        day: DayOfWeek;
        slotId: number;
        classroom: Classroom;
        score: number;
      } | null = null;

      // Determine if there is any active day for this unit that is not full (< 4 slots)
      const activeUnfilledDayExists = Array.from(slotsAssignedByDay.entries()).some(
        ([_, count]) => count > 0 && count < 4
      );

      // Evaluate all 20 possible slots (days x slotIds) & all classrooms
      for (const day of days) {
        const currentDayCount = slotsAssignedByDay.get(day) || 0;

        // Rule: Max 4 slots (8 hours) per day for a single unit.
        // If a day already has 4 slots for this unit, it is full and must spill over to the next day.
        let dayGroupingScore = 0;
        if (currentDayCount >= 4) {
          // Exceeded a day's hours (4 slots = 8 hours) -> must spill to next day
          dayGroupingScore -= 10000;
        } else if (currentDayCount > 0) {
          // Strong preference to schedule the same unit on the SAME DAY
          dayGroupingScore += 1000;
        } else if (activeUnfilledDayExists) {
          // If another day already has slots for this unit and is not full, penalize opening a new day
          dayGroupingScore -= 800;
        }

        for (const slotId of slotIds) {
          // Check if this exact (day, slotId) was already assigned to this unit in this generation pass
          const alreadyAssignedThisSlot = assignedSlotsForThisUnit.some(
            s => s.day === day && s.slotId === slotId
          );
          if (alreadyAssignedThisSlot) continue;

          // Bonus for consecutive/adjacent slots on the same day (e.g. slot 1 then slot 2)
          let consecutiveBonus = 0;
          if (currentDayCount > 0) {
            const hasAdjacent = assignedSlotsForThisUnit.some(
              s => s.day === day && Math.abs(s.slotId - slotId) === 1
            );
            if (hasAdjacent) {
              consecutiveBonus += 500;
            }
          }

          // Check trainer preference for this day/slot
          const pref = state.preferences.find(
            p => p.trainerId === trainerId && p.day === day && p.slotId === slotId
          );

          let slotBaseScore = 100; // Base score for available time slots
          if (pref) {
            if (pref.type === 'unavailable') {
              slotBaseScore -= 10000; // Hard constraint: strictly avoid slots marked unavailable in matrix
            } else if (pref.type === 'preferred') {
              slotBaseScore += 50; // Reward slots marked preferred in matrix
            }
          }

          // Check global constraints among already committed external entries AND current pass entries
          const allCurrentEntries = [...externalEntries, ...generatedEntries];

          // Trainer double booking constraint (trainer cannot teach 2 classes at the same time)
          const trainerConflict = allCurrentEntries.some(
            e => e.trainerId === trainerId && e.day === day && e.slotId === slotId
          );
          if (trainerConflict) {
            slotBaseScore -= 10000; // Hard constraint: avoid trainer double booking
          }

          // Course/Class group double booking constraint (cohort cannot be in 2 classes at the same time)
          const classConflict = allCurrentEntries.some(
            e => e.courseId === unit.courseId && e.semesterName === semesterName && e.day === day && e.slotId === slotId
          );
          if (classConflict) {
            slotBaseScore -= 10000; // Hard constraint: avoid cohort double booking
          }

          // Find suitable and available classrooms
          for (const room of state.classrooms) {
            let roomScore = 0;
            
            // Check classroom suitability
            if (isRoomSuitableForUnit(room, unit)) {
              roomScore += 20;
            } else {
              roomScore -= 10; // Penalize non-lab for lab unit, but allow as last resort
            }

            // Classroom double booking check
            const roomConflict = allCurrentEntries.some(
              e => e.classroomId === room.id && e.day === day && e.slotId === slotId
            );
            if (roomConflict) {
              roomScore -= 10000; // Hard constraint: classroom occupied
            }

            // Add a tiny random jitter to break deterministic pattern ties and create an organic, varied, and professional schedule layout
            const jitter = Math.random() * 2.0;
            const totalScore = slotBaseScore + roomScore + dayGroupingScore + consecutiveBonus + jitter;

            if (bestCombination === null || totalScore > bestCombination.score) {
              bestCombination = {
                day,
                slotId,
                classroom: room,
                score: totalScore
              };
            }
          }
        }
      }

      // Commit the best combination found
      if (bestCombination) {
        slotsAssignedByDay.set(
          bestCombination.day,
          (slotsAssignedByDay.get(bestCombination.day) || 0) + 1
        );
        assignedSlotsForThisUnit.push({
          day: bestCombination.day,
          slotId: bestCombination.slotId
        });
        
        // Let's create a unique ID
        const newEntry: TimetableEntry = {
          id: `entry_auto_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          departmentId,
          courseId: unit.courseId,
          semesterName,
          unitId: unit.id,
          trainerId,
          classroomId: bestCombination.classroom.id,
          day: bestCombination.day,
          slotId: bestCombination.slotId,
          isPublished: false // HOD must publish manually
        };
        
        generatedEntries.push(newEntry);
      }
    }
  }

  // Return the merged list: original external entries + freshly generated department entries
  return [...externalEntries, ...generatedEntries];
}

export interface CombinedCohort {
  key: string;
  courseIds: string[];
  courses: Course[];
  courseCode: string; // e.g. "BT L5/L6" or "PLM L3/L4/L5/L6"
  courseName: string;
  semesterName: string; // e.g. "Module 1"
  departmentId: string;
  groupId?: string;
  groupName?: string;
}

/**
 * Formats a list of courses into a clean, compact code combining levels when appropriate.
 * Example: ['BT-L5', 'BT-L6'] -> "BT L5/L6"
 * Example: ['PLM-L3', 'PLM-L4', 'PLM-L5', 'PLM-L6'] -> "PLM L3/L4/L5/L6"
 * Example: ['DICT', 'DCS'] -> "DICT / DCS"
 */
export function formatCombinedCourseCode(courses: Course[]): string {
  if (!courses || courses.length === 0) return '?';
  if (courses.length === 1) return courses[0].code;

  const parsed = courses.map(c => {
    const code = c.code.trim();
    const codeMatch = code.match(/^([A-Za-z]+)[-_\s]*(?:Level\s*|LV\s*|L)?(\d+|[A-Za-z]+)$/i);
    if (codeMatch) {
      const base = codeMatch[1].toUpperCase();
      let level = codeMatch[2].toUpperCase();
      if (!level.startsWith('L') && /^\d+$/.test(level)) {
        level = `L${level}`;
      }
      return { base, level, original: code };
    }

    const nameMatch = (c.name || '').match(/Level\s*(\d+)/i);
    if (nameMatch) {
      const base = code.replace(/[-_\s]*L\d+.*$/i, '').trim().toUpperCase();
      return { base, level: `L${nameMatch[1]}`, original: code };
    }

    return { base: code.toUpperCase(), level: '', original: code };
  });

  const firstBase = parsed[0].base;
  const allSameBase = parsed.every(p => p.base === firstBase && p.level !== '');

  if (allSameBase) {
    const sortedLevels = parsed
      .map(p => p.level)
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });
    const uniqueLevels = Array.from(new Set(sortedLevels));
    return `${firstBase} ${uniqueLevels.join('/')}`;
  }

  const uniqueCodes = Array.from(new Set(courses.map(c => c.code)));
  return uniqueCodes.join(' / ');
}

/**
 * Helper to format semester/year string to Module string globally
 */
export function formatSemesterToModule(sem: string): string {
  if (!sem) return '';
  const s = sem.toLowerCase().trim();
  if (s === 'year 1 semester 1' || s === 'year 1 sem 1' || s === 'y1s1') return 'Module 1';
  if (s === 'year 1 semester 2' || s === 'year 1 sem 2' || s === 'y1s2') return 'Module 2';
  if (s === 'year 2 semester 1' || s === 'year 2 sem 1' || s === 'y2s1') return 'Module 2';
  if (s === 'year 2 semester 2' || s === 'year 2 sem 2' || s === 'y2s2') return 'Module 3';
  if (s === 'year 3 semester 1' || s === 'year 3 sem 1' || s === 'y3s1') return 'Module 3';
  if (s === 'year 3 semester 2' || s === 'year 3 sem 2' || s === 'y3s2') return 'Module 3';
  if (s.includes('module 1') || s === 'm1') return 'Module 1';
  if (s.includes('module 2') || s === 'm2') return 'Module 2';
  if (s.includes('module 3') || s === 'm3') return 'Module 3';
  return sem;
}

/**
 * Formats badge strings like ["BT-L5 (M1)", "BT-L6 (M1)"] into "BT L5/L6 (M1)"
 */
export function formatCombinedBadges(badges: string[]): string {
  if (!badges || badges.length === 0) return '';
  if (badges.length === 1) return badges[0];

  const items = badges.map(b => {
    const m = b.match(/^(.*?)\s*\((.*?)\)$/);
    if (m) {
      return { code: m[1].trim(), sem: m[2].trim() };
    }
    return { code: b.trim(), sem: '' };
  });

  const firstSem = items[0].sem;
  const allSameSem = items.every(it => it.sem === firstSem);

  const parsed = items.map(it => {
    const code = it.code;
    const m = code.match(/^([A-Za-z]+)[-_\s]*(?:Level\s*|LV\s*|L)?(\d+|[A-Za-z]+)$/i);
    if (m) {
      const base = m[1].toUpperCase();
      let level = m[2].toUpperCase();
      if (!level.startsWith('L') && /^\d+$/.test(level)) {
        level = `L${level}`;
      }
      return { base, level, original: code };
    }
    return { base: code.toUpperCase(), level: '', original: code };
  });

  const firstBase = parsed[0].base;
  const allSameBase = parsed.every(p => p.base === firstBase && p.level !== '');

  if (allSameBase) {
    const sortedLevels = parsed
      .map(p => p.level)
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });
    const uniqueLevels = Array.from(new Set(sortedLevels));
    const combinedCode = `${firstBase} ${uniqueLevels.join('/')}`;
    if (allSameSem && firstSem) {
      return `${combinedCode} (${firstSem})`;
    }
    return combinedCode;
  }

  return badges.join(' / ');
}

/**
 * Builds combined cohorts grouping levels in a module when the unit and trainer are the same.
 * Guaranteed to capture 100% of all scheduled timetable entries.
 */
export function buildCombinedCohorts(
  entries: TimetableEntry[],
  allCourses: Course[],
  allUnits: Unit[],
  days: DayOfWeek[],
  slots: { id: number; label: string }[],
  departmentFilter?: string
): CombinedCohort[] {
  const singleCohortsMap = new Map<string, {
    courseId: string;
    semesterName: string;
    course: Course;
    departmentId: string;
    groupId?: string;
    groupName?: string;
  }>();

  entries.forEach(e => {
    let course = allCourses.find(c => c.id === e.courseId || c.code.toLowerCase() === (e.courseId || '').toLowerCase());
    const entryDept = e.departmentId || course?.departmentId || '';
    if (departmentFilter && departmentFilter !== 'all' && entryDept && entryDept !== departmentFilter) return;

    if (!course) {
      course = {
        id: e.courseId || 'unknown_course',
        code: e.courseId || 'UNKNOWN',
        name: e.courseId || 'Unknown Course',
        departmentId: entryDept
      };
    }

    const grpKey = e.groupId || e.groupName || '';
    const normSem = formatSemesterToModule(e.semesterName || 'Module 1');
    const key = `${course.id}___${normSem}___${grpKey}`;
    if (!singleCohortsMap.has(key)) {
      singleCohortsMap.set(key, {
        courseId: course.id,
        semesterName: e.semesterName || 'Module 1',
        course,
        departmentId: entryDept,
        groupId: e.groupId,
        groupName: e.groupName
      });
    }
  });

  const singleCohorts = Array.from(singleCohortsMap.values());

  const deptSemGroups = new Map<string, typeof singleCohorts>();
  singleCohorts.forEach(sc => {
    const grpKey = sc.groupName || sc.groupId || '';
    const normSem = formatSemesterToModule(sc.semesterName);
    const groupKey = `${sc.departmentId}___${normSem}___${grpKey}`;
    if (!deptSemGroups.has(groupKey)) {
      deptSemGroups.set(groupKey, []);
    }
    deptSemGroups.get(groupKey)!.push(sc);
  });

  const result: CombinedCohort[] = [];

  deptSemGroups.forEach(cohortList => {
    const cohortSignatures = cohortList.map(sc => {
      const normScSem = formatSemesterToModule(sc.semesterName).toLowerCase();
      const cohortEntries = entries.filter(
        e => (e.courseId === sc.courseId || (sc.course?.code && (e.courseId || '').toLowerCase() === sc.course.code.toLowerCase())) && 
             formatSemesterToModule(e.semesterName || '').toLowerCase() === normScSem &&
             (sc.groupId ? (e.groupId === sc.groupId || e.groupName === sc.groupName) : (!e.groupId && !e.groupName))
      );
      const slotMap = new Map<string, { unitCode: string; trainerId: string; roomId: string; rawEntry: TimetableEntry }>();

      cohortEntries.forEach(e => {
        const u = allUnits.find(unit => unit.id === e.unitId);
        const unitCode = u ? u.code.trim().toUpperCase() : '?';
        slotMap.set(`${(e.day || '').toLowerCase()}_${e.slotId}`, {
          unitCode,
          trainerId: e.trainerId,
          roomId: e.classroomId,
          rawEntry: e
        });
      });

      return {
        ...sc,
        slotMap,
        entryCount: cohortEntries.length
      };
    });

    const usedIndices = new Set<number>();

    for (let i = 0; i < cohortSignatures.length; i++) {
      if (usedIndices.has(i)) continue;
      usedIndices.add(i);

      const cluster = [cohortSignatures[i]];
      const clusterCourses = [cohortSignatures[i].course];

      for (let j = i + 1; j < cohortSignatures.length; j++) {
        if (usedIndices.has(j)) continue;

        const cA = cohortSignatures[i];
        const cB = cohortSignatures[j];

        const codeA = cA.course.code.toUpperCase();
        const codeB = cB.course.code.toUpperCase();
        const baseA = codeA.replace(/[-_\s]*(?:LEVEL|LV|L)?\d+.*$/i, '').trim();
        const baseB = codeB.replace(/[-_\s]*(?:LEVEL|LV|L)?\d+.*$/i, '').trim();

        let isCompatible = true;
        let sharedCount = 0;
        let conflictCount = 0;

        days.forEach(d => {
          const dKey = d.toLowerCase();
          slots.forEach(s => {
            const pos = `${dKey}_${s.id}`;
            const entryA = cA.slotMap.get(pos);
            const entryB = cB.slotMap.get(pos);

            if (entryA && entryB) {
              if (entryA.unitCode === entryB.unitCode && entryA.trainerId === entryB.trainerId) {
                sharedCount++;
              } else {
                conflictCount++;
                isCompatible = false;
              }
            }
          });
        });

        const sameBase = Boolean(baseA && baseB && baseA === baseB);
        if (isCompatible && conflictCount === 0 && (sameBase || sharedCount > 0)) {
          usedIndices.add(j);
          cluster.push(cB);
          clusterCourses.push(cB.course);
        }
      }

      const combinedCode = formatCombinedCourseCode(clusterCourses);
      const primary = cluster[0];
      const grpSuffix = primary.groupName || primary.groupId ? `_${primary.groupName || primary.groupId}` : '';

      result.push({
        key: cluster.map(c => c.courseId).sort().join('_') + `_${primary.semesterName}${grpSuffix}`,
        courseIds: cluster.map(c => c.courseId),
        courses: clusterCourses,
        courseCode: combinedCode,
        courseName: clusterCourses.map(c => c.name).join(' / '),
        semesterName: primary.semesterName,
        departmentId: primary.departmentId,
        groupId: primary.groupId,
        groupName: primary.groupName
      });
    }
  });

  // Safeguard: Ensure EVERY single scheduled entry within the department filter is represented
  entries.forEach(e => {
    const entryDept = e.departmentId || allCourses.find(c => c.id === e.courseId)?.departmentId || '';
    if (departmentFilter && departmentFilter !== 'all' && entryDept && entryDept !== departmentFilter) {
      return;
    }

    const normSem = formatSemesterToModule(e.semesterName || '').toLowerCase();
    const isCaptured = result.some(cohort => {
      const courseMatch = cohort.courseIds.includes(e.courseId) || 
        cohort.courses.some(c => c.code.toLowerCase() === (e.courseId || '').toLowerCase() || c.id === e.courseId);
      const semMatch = formatSemesterToModule(cohort.semesterName).toLowerCase() === normSem;
      const grpMatch = !cohort.groupId && !cohort.groupName
        ? true
        : (!e.groupId && !e.groupName) || cohort.groupId === e.groupId || cohort.groupName === e.groupName;
      return courseMatch && semMatch && grpMatch;
    });

    if (!isCaptured) {
      const course = allCourses.find(c => c.id === e.courseId || c.code.toLowerCase() === (e.courseId || '').toLowerCase()) || {
        id: e.courseId || 'unknown_course',
        code: e.courseId || 'UNKNOWN',
        name: e.courseId || 'Course',
        departmentId: entryDept
      };

      result.push({
        key: `fallback_${e.courseId}_${e.semesterName}_${e.groupId || e.groupName || ''}_${e.id}`,
        courseIds: [e.courseId],
        courses: [course],
        courseCode: course.code,
        courseName: course.name,
        semesterName: e.semesterName || 'Module 1',
        departmentId: entryDept,
        groupId: e.groupId,
        groupName: e.groupName
      });
    }
  });

  result.sort((a, b) => {
    if (a.courseCode !== b.courseCode) {
      return a.courseCode.localeCompare(b.courseCode);
    }
    if (a.semesterName !== b.semesterName) {
      return a.semesterName.localeCompare(b.semesterName);
    }
    return (a.groupName || '').localeCompare(b.groupName || '');
  });

  return result;
}

/**
 * Accurately finds all matching scheduled timetable entries for a specific cohort cell.
 * Handles course IDs, course codes, semester/module normalization, group streams, and multi-unit slots.
 * Automatically deduplicates matching entries when the same unit is taught across combined levels
 * so the unit only displays once in the slot.
 */
export function getMatchingEntriesForCohortCell(
  timetableEntries: TimetableEntry[],
  cohort: CombinedCohort,
  day: string,
  slotId: number,
  allUnits?: Unit[]
): TimetableEntry[] {
  const normDay = (day || '').trim().toLowerCase();
  const normSlot = Number(slotId);
  const normCohortSem = formatSemesterToModule(cohort.semesterName || '').trim().toLowerCase();

  const matching = timetableEntries.filter(e => {
    // 1. Day match (case-insensitive)
    if ((e.day || '').trim().toLowerCase() !== normDay) return false;

    // 2. Slot ID match (numeric / string loose equality)
    if (Number(e.slotId) !== normSlot) return false;

    // 3. Course match (check courseIds or course code)
    const matchesCourse = 
      cohort.courseIds.includes(e.courseId) ||
      cohort.courses.some(c => 
        c.id === e.courseId || 
        c.code.toLowerCase() === (e.courseId || '').toLowerCase()
      );
    if (!matchesCourse) return false;

    // 4. Semester / Module match (normalized e.g. Year 1 Semester 1 === Module 1)
    const normEntrySem = formatSemesterToModule(e.semesterName || '').trim().toLowerCase();
    const semMatches = 
      !cohort.semesterName ||
      !e.semesterName ||
      normEntrySem === normCohortSem ||
      (e.semesterName || '').trim().toLowerCase() === (cohort.semesterName || '').trim().toLowerCase();
    if (!semMatches) return false;

    // 5. Group match
    if (cohort.groupId || cohort.groupName) {
      // Cohort row is for a specific group:
      // Show entries scheduled for this group, OR common entries scheduled for the cohort without specific group
      if (!e.groupId && !e.groupName) return true;
      const matchesId = cohort.groupId && e.groupId && cohort.groupId === e.groupId;
      const matchesName = cohort.groupName && e.groupName && cohort.groupName.trim().toLowerCase() === e.groupName.trim().toLowerCase();
      return Boolean(matchesId || matchesName);
    } else {
      // Cohort has no specific group breakdown: include all entries for this course/semester
      return true;
    }
  });

  // Deduplicate entries when the same unit is taught across combined levels
  // (e.g. L4/L5/L6 sharing the same unit, trainer, room, and group)
  const uniqueEntries: TimetableEntry[] = [];
  const seenKeys = new Set<string>();

  for (const entry of matching) {
    let unitKey = (entry.unitId || '').trim().toLowerCase();
    if (allUnits && allUnits.length > 0) {
      const u = allUnits.find(unit => unit.id === entry.unitId);
      if (u) {
        // Use code and name for robust deduplication across different level unit records
        unitKey = `${(u.code || '').trim().toLowerCase()}___${(u.name || '').trim().toLowerCase()}`;
      }
    }

    const trainerKey = (entry.trainerId || '').trim().toLowerCase();
    const roomKey = (entry.classroomId || '').trim().toLowerCase();
    const grpKey = (entry.groupName || entry.groupId || '').trim().toLowerCase();
    
    // Composite key for exact session identity
    const dedupeKey = `${unitKey}___${trainerKey}___${roomKey}___${grpKey}`;

    if (!seenKeys.has(dedupeKey)) {
      seenKeys.add(dedupeKey);
      uniqueEntries.push(entry);
    }
  }

  return uniqueEntries;
}

