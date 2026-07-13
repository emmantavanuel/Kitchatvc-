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
        conflicts.push({
          type: 'class_double_booking',
          severity: 'error',
          message: `Students of ${courseA?.code || 'Course'} (${entryA.semesterName}) are scheduled for two classes simultaneously on ${entryA.day} Slot ${entryA.slotId}: ${unitA.code} and ${unitB?.code || 'Another'}.`,
          affectedEntries: [entryA.id, entryB.id],
          details: {
            day: entryA.day,
            slotId: entryA.slotId,
            courseName: courseA?.name
          }
        });
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

    // Keep track of day/slot assigned to THIS unit in THIS pass so we don't assign it twice on the same day if possible
    const assignedDaysForThisUnit = new Set<DayOfWeek>();

    for (let slotIdx = 0; slotIdx < slotsNeeded; slotIdx++) {
      let bestCombination: {
        day: DayOfWeek;
        slotId: number;
        classroom: Classroom;
        score: number;
      } | null = null;

      // Evaluate all 20 possible slots & all classrooms
      for (const day of days) {
        // Prefer spreading classes of the same unit on different days
        const dayPenalty = assignedDaysForThisUnit.has(day) ? -20 : 0;

        for (const slotId of slotIds) {
          // Check trainer preference for this day/slot
          const pref = state.preferences.find(
            p => p.trainerId === trainerId && p.day === day && p.slotId === slotId
          );

          let slotBaseScore = 100; // Base score
          if (pref) {
            if (pref.type === 'unavailable') {
              slotBaseScore -= 200; // Heavy penalty for unavail
            } else if (pref.type === 'preferred') {
              slotBaseScore += 30; // Bonus for preferred
            }
          }

          // Check global constraints among already committed external entries AND current pass entries
          const allCurrentEntries = [...externalEntries, ...generatedEntries];

          // Trainer double booking constraint
          const trainerConflict = allCurrentEntries.some(
            e => e.trainerId === trainerId && e.day === day && e.slotId === slotId
          );
          if (trainerConflict) {
            slotBaseScore -= 300; 
          }

          // Course/Class group double booking constraint (e.g. Dict Year 1 scheduled for another unit)
          const classConflict = allCurrentEntries.some(
            e => e.courseId === unit.courseId && e.semesterName === semesterName && e.day === day && e.slotId === slotId
          );
          if (classConflict) {
            slotBaseScore -= 500; // Dealbreaker
          }

          // Find suitable and available classrooms
          for (const room of state.classrooms) {
            let roomScore = 0;
            
            // Check classroom suitability
            if (isRoomSuitableForUnit(room, unit)) {
              roomScore += 20;
            } else {
              roomScore -= 10; // Penalize, but don't reject outright if we are desperate
            }

            // Classroom double booking check
            const roomConflict = allCurrentEntries.some(
              e => e.classroomId === room.id && e.day === day && e.slotId === slotId
            );
            if (roomConflict) {
              roomScore -= 500; // Classroom occupied
            }

            const totalScore = slotBaseScore + roomScore + dayPenalty;

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
        assignedDaysForThisUnit.add(bestCombination.day);
        
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
