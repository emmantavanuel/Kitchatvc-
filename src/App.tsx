import React, { useState, useEffect } from 'react';
import { User, Department, Course, Classroom, Unit, TimetableEntry, AcademicSetting, TrainerSlotPreference } from './types';
import { 
  INITIAL_USERS, INITIAL_DEPARTMENTS, INITIAL_COURSES, INITIAL_CLASSROOMS, 
  INITIAL_UNITS, INITIAL_TIMETABLE_ENTRIES, INITIAL_TRAINER_PREFERENCES, DEFAULT_ACADEMIC_SETTING 
} from './data/seedData';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import HodDashboard from './components/HodDashboard';
import TrainerDashboard from './components/TrainerDashboard';

// LocalStorage Cache Keys
const STORAGE_PREFIX = 'kitcha_timetable_';
const KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
  DEPARTMENTS: `${STORAGE_PREFIX}departments`,
  COURSES: `${STORAGE_PREFIX}courses`,
  CLASSROOMS: `${STORAGE_PREFIX}classrooms`,
  UNITS: `${STORAGE_PREFIX}units`,
  TIMETABLE: `${STORAGE_PREFIX}entries`,
  PREFERENCES: `${STORAGE_PREFIX}preferences`,
  ACADEMIC: `${STORAGE_PREFIX}academic_setting`,
  CURRENT_USER: `${STORAGE_PREFIX}current_user`
};

export default function App() {
  // Core database states
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassroom] = useState<Classroom[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [trainerPreferences, setTrainerPreferences] = useState<TrainerSlotPreference[]>([]);
  const [academicSetting, setAcademicSetting] = useState<AcademicSetting>(DEFAULT_ACADEMIC_SETTING);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // SYNCHRONIZED WRITING TO BACKEND
  const syncStateToServer = async (customState?: any) => {
    try {
      const stateToSave = {
        users: customState?.users || users,
        departments: customState?.departments || departments,
        courses: customState?.courses || courses,
        classrooms: customState?.classrooms || classrooms,
        units: customState?.units || units,
        timetableEntries: customState?.timetableEntries || timetableEntries,
        trainerPreferences: customState?.trainerPreferences || trainerPreferences,
        academicSetting: customState?.academicSetting || academicSetting,
      };
      await fetch('/api/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stateToSave),
      });
    } catch (e) {
      console.error('Failed to sync state to server:', e);
    }
  };

  // Initialize and load state from Server or Fallback LocalStorage on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const response = await fetch('/api/state');
        const result = await response.json();

        if (result && result.success && result.state) {
          // Loaded successfully from server!
          const { 
            users: sUsers, 
            departments: sDepts, 
            courses: sCourses, 
            classrooms: sClassrooms, 
            units: sUnits, 
            timetableEntries: sEntries, 
            trainerPreferences: sPrefs, 
            academicSetting: sAcademic 
          } = result.state;
          
          if (sUsers) {
            setUsers(sUsers);
            localStorage.setItem(KEYS.USERS, JSON.stringify(sUsers));
          }
          if (sDepts) {
            setDepartments(sDepts);
            localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(sDepts));
          }
          if (sCourses) {
            setCourses(sCourses);
            localStorage.setItem(KEYS.COURSES, JSON.stringify(sCourses));
          }
          if (sClassrooms) {
            setClassroom(sClassrooms);
            localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify(sClassrooms));
          }
          if (sUnits) {
            setUnits(sUnits);
            localStorage.setItem(KEYS.UNITS, JSON.stringify(sUnits));
          }
          if (sEntries) {
            setTimetableEntries(sEntries);
            localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(sEntries));
          }
          if (sPrefs) {
            setTrainerPreferences(sPrefs);
            localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(sPrefs));
          }
          if (sAcademic) {
            setAcademicSetting(sAcademic);
            localStorage.setItem(KEYS.ACADEMIC, JSON.stringify(sAcademic));
          }
        } else {
          // No state on server yet! Load local storage fallback or initial seed data, and save to server.
          const storedUsers = localStorage.getItem(KEYS.USERS);
          const storedDepts = localStorage.getItem(KEYS.DEPARTMENTS);
          const storedCourses = localStorage.getItem(KEYS.COURSES);
          const storedRooms = localStorage.getItem(KEYS.CLASSROOMS);
          const storedUnits = localStorage.getItem(KEYS.UNITS);
          const storedEntries = localStorage.getItem(KEYS.TIMETABLE);
          const storedPrefs = localStorage.getItem(KEYS.PREFERENCES);
          const storedAcademic = localStorage.getItem(KEYS.ACADEMIC);

          const loadedUsers = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
          const loadedDepts = storedDepts ? JSON.parse(storedDepts) : INITIAL_DEPARTMENTS;
          const loadedCourses = storedCourses ? JSON.parse(storedCourses) : INITIAL_COURSES;
          const loadedRooms = storedRooms ? JSON.parse(storedRooms) : INITIAL_CLASSROOMS;
          const loadedUnits = storedUnits ? JSON.parse(storedUnits) : INITIAL_UNITS;
          const loadedEntries = storedEntries ? JSON.parse(storedEntries) : INITIAL_TIMETABLE_ENTRIES;
          const loadedPrefs = storedPrefs ? JSON.parse(storedPrefs) : INITIAL_TRAINER_PREFERENCES;
          const loadedAcademic = storedAcademic ? JSON.parse(storedAcademic) : DEFAULT_ACADEMIC_SETTING;

          setUsers(loadedUsers);
          setDepartments(loadedDepts);
          setCourses(loadedCourses);
          setClassroom(loadedRooms);
          setUnits(loadedUnits);
          setTimetableEntries(loadedEntries);
          setTrainerPreferences(loadedPrefs);
          setAcademicSetting(loadedAcademic);

          // Save fallback/seeded to localStorage
          localStorage.setItem(KEYS.USERS, JSON.stringify(loadedUsers));
          localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(loadedDepts));
          localStorage.setItem(KEYS.COURSES, JSON.stringify(loadedCourses));
          localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify(loadedRooms));
          localStorage.setItem(KEYS.UNITS, JSON.stringify(loadedUnits));
          localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(loadedEntries));
          localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(loadedPrefs));
          localStorage.setItem(KEYS.ACADEMIC, JSON.stringify(loadedAcademic));

          // Sync to server so the server database is initialized immediately.
          const initialState = {
            users: loadedUsers,
            departments: loadedDepts,
            courses: loadedCourses,
            classrooms: loadedRooms,
            units: loadedUnits,
            timetableEntries: loadedEntries,
            trainerPreferences: loadedPrefs,
            academicSetting: loadedAcademic,
          };
          await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initialState),
          });
        }

        // Auto-restore logged in user session if active
        const storedCurrentUser = localStorage.getItem(KEYS.CURRENT_USER);
        if (storedCurrentUser) {
          const parsedUser = JSON.parse(storedCurrentUser);
          // Latest users list
          const latestUsersStr = localStorage.getItem(KEYS.USERS);
          const latestUsers = latestUsersStr ? JSON.parse(latestUsersStr) : INITIAL_USERS;
          const verifiedUser = latestUsers.find((u: any) => u.id === parsedUser.id);
          if (verifiedUser && verifiedUser.isActive) {
            setCurrentUser(verifiedUser);
          } else {
            localStorage.removeItem(KEYS.CURRENT_USER);
          }
        }
      } catch (e) {
        console.error("Server synchronization initialization failed, fallback to local:", e);
        // Fallback completely to local storage
        try {
          const storedUsers = localStorage.getItem(KEYS.USERS);
          const storedDepts = localStorage.getItem(KEYS.DEPARTMENTS);
          const storedCourses = localStorage.getItem(KEYS.COURSES);
          const storedRooms = localStorage.getItem(KEYS.CLASSROOMS);
          const storedUnits = localStorage.getItem(KEYS.UNITS);
          const storedEntries = localStorage.getItem(KEYS.TIMETABLE);
          const storedPrefs = localStorage.getItem(KEYS.PREFERENCES);
          const storedAcademic = localStorage.getItem(KEYS.ACADEMIC);
          const storedCurrentUser = localStorage.getItem(KEYS.CURRENT_USER);

          setUsers(storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS);
          setDepartments(storedDepts ? JSON.parse(storedDepts) : INITIAL_DEPARTMENTS);
          setCourses(storedCourses ? JSON.parse(storedCourses) : INITIAL_COURSES);
          setClassroom(storedRooms ? JSON.parse(storedRooms) : INITIAL_CLASSROOMS);
          setUnits(storedUnits ? JSON.parse(storedUnits) : INITIAL_UNITS);
          setTimetableEntries(storedEntries ? JSON.parse(storedEntries) : INITIAL_TIMETABLE_ENTRIES);
          setTrainerPreferences(storedPrefs ? JSON.parse(storedPrefs) : INITIAL_TRAINER_PREFERENCES);
          setAcademicSetting(storedAcademic ? JSON.parse(storedAcademic) : DEFAULT_ACADEMIC_SETTING);

          if (storedCurrentUser) {
            const parsedUser = JSON.parse(storedCurrentUser);
            const verifiedUser = INITIAL_USERS.concat(storedUsers ? JSON.parse(storedUsers) : []).find(u => u.id === parsedUser.id);
            if (verifiedUser && verifiedUser.isActive) {
              setCurrentUser(verifiedUser);
            } else {
              localStorage.removeItem(KEYS.CURRENT_USER);
            }
          }
        } catch (innerError) {
          console.error("Local storage fallback also failed:", innerError);
        }
      } finally {
        setIsInitialized(true);
      }
    };

    initializeData();
  }, []);

  // SYNCHRONIZED WRITING HELPERS
  const updateUsersState = (updated: User[]) => {
    setUsers(updated);
    localStorage.setItem(KEYS.USERS, JSON.stringify(updated));
    // If current logged-in user details changed, update them
    if (currentUser) {
      const match = updated.find(u => u.id === currentUser.id);
      if (match) {
        if (!match.isActive) {
          handleLogout(); // Force logout if administrator deactivated account
        } else {
          setCurrentUser(match);
          localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(match));
        }
      }
    }
    syncStateToServer({ users: updated });
  };

  const updateDepartmentsState = (updated: Department[]) => {
    setDepartments(updated);
    localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(updated));
    syncStateToServer({ departments: updated });
  };

  const updateCoursesState = (updated: Course[]) => {
    setCourses(updated);
    localStorage.setItem(KEYS.COURSES, JSON.stringify(updated));
    syncStateToServer({ courses: updated });
  };

  const updateClassroomsState = (updated: Classroom[]) => {
    setClassroom(updated);
    localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify(updated));
    syncStateToServer({ classrooms: updated });
  };

  const updateUnitsState = (updated: Unit[]) => {
    setUnits(updated);
    localStorage.setItem(KEYS.UNITS, JSON.stringify(updated));
    syncStateToServer({ units: updated });
  };

  const updateTimetableEntriesState = (updated: TimetableEntry[]) => {
    setTimetableEntries(updated);
    localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(updated));
    syncStateToServer({ timetableEntries: updated });
  };

  const updateTrainerPreferencesState = (updated: TrainerSlotPreference[]) => {
    setTrainerPreferences(updated);
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(updated));
    syncStateToServer({ trainerPreferences: updated });
  };

  const updateAcademicSettingState = (updated: AcademicSetting) => {
    setAcademicSetting(updated);
    localStorage.setItem(KEYS.ACADEMIC, JSON.stringify(updated));
    syncStateToServer({ academicSetting: updated });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(KEYS.CURRENT_USER);
  };

  // FULL BACKUP IMPORT STATE
  const handleImportState = (fullState: any) => {
    const updatedUsers = fullState.users || users;
    const updatedDepartments = fullState.departments || departments;
    const updatedCourses = fullState.courses || courses;
    const updatedClassrooms = fullState.classrooms || classrooms;
    const updatedUnits = fullState.units || units;
    const updatedTimetableEntries = fullState.timetableEntries || timetableEntries;
    const updatedTrainerPreferences = fullState.trainerPreferences || trainerPreferences;
    const updatedAcademicSetting = fullState.academicSetting || academicSetting;

    setUsers(updatedUsers);
    setDepartments(updatedDepartments);
    setCourses(updatedCourses);
    setClassroom(updatedClassrooms);
    setUnits(updatedUnits);
    setTimetableEntries(updatedTimetableEntries);
    setTrainerPreferences(updatedTrainerPreferences);
    setAcademicSetting(updatedAcademicSetting);

    localStorage.setItem(KEYS.USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(updatedDepartments));
    localStorage.setItem(KEYS.COURSES, JSON.stringify(updatedCourses));
    localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify(updatedClassrooms));
    localStorage.setItem(KEYS.UNITS, JSON.stringify(updatedUnits));
    localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(updatedTimetableEntries));
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(updatedTrainerPreferences));
    localStorage.setItem(KEYS.ACADEMIC, JSON.stringify(updatedAcademicSetting));

    // Also update logged-in user if changed
    if (currentUser) {
      const match = updatedUsers.find(u => u.id === currentUser.id);
      if (match) {
        if (!match.isActive) {
          handleLogout();
        } else {
          setCurrentUser(match);
          localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(match));
        }
      }
    }

    // Save the entire state to the server in one single payload
    const combinedState = {
      users: updatedUsers,
      departments: updatedDepartments,
      courses: updatedCourses,
      classrooms: updatedClassrooms,
      units: updatedUnits,
      timetableEntries: updatedTimetableEntries,
      trainerPreferences: updatedTrainerPreferences,
      academicSetting: updatedAcademicSetting
    };
    
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(combinedState)
    }).catch(e => console.error("Failed to sync import state to server:", e));
  };

  // Bundle the complete state for Admin backup
  const getFullSystemStateBundle = () => {
    return {
      users,
      departments,
      courses,
      classrooms,
      units,
      timetableEntries,
      trainerPreferences,
      academicSetting
    };
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <span className="text-sm font-semibold text-slate-500 font-mono">Initializing Kitutu Chache TVC Timetable...</span>
        </div>
      </div>
    );
  }

  // Not Logged In
  if (!currentUser) {
    return (
      <Login 
        onLogin={handleLogin} 
        users={users} 
        departments={departments} 
      />
    );
  }

  // Admin Portal Router
  if (currentUser.role === 'admin') {
    return (
      <AdminDashboard
        currentUser={currentUser}
        users={users}
        departments={departments}
        courses={courses}
        classrooms={classrooms}
        units={units}
        timetableEntries={timetableEntries}
        trainerPreferences={trainerPreferences}
        academicSetting={academicSetting}
        onUpdateUsers={updateUsersState}
        onUpdateDepartments={updateDepartmentsState}
        onUpdateCourses={updateCoursesState}
        onUpdateClassrooms={updateClassroomsState}
        onUpdateAcademicSetting={updateAcademicSettingState}
        onImportState={handleImportState}
        onLogout={handleLogout}
        fullState={getFullSystemStateBundle()}
      />
    );
  }

  // HOD Portal Router
  if (currentUser.role === 'hod') {
    return (
      <HodDashboard
        currentUser={currentUser}
        users={users}
        departments={departments}
        courses={courses}
        classrooms={classrooms}
        units={units}
        timetableEntries={timetableEntries}
        trainerPreferences={trainerPreferences}
        academicSetting={academicSetting}
        onUpdateTimetableEntries={updateTimetableEntriesState}
        onUpdateUnits={updateUnitsState}
        onUpdateTrainerPreferences={updateTrainerPreferencesState}
        onUpdateCourses={updateCoursesState}
        onUpdateUsers={updateUsersState}
        onLogout={handleLogout}
      />
    );
  }

  // Trainer Portal Router
  if (currentUser.role === 'trainer') {
    return (
      <TrainerDashboard
        currentUser={currentUser}
        users={users}
        departments={departments}
        courses={courses}
        classrooms={classrooms}
        units={units}
        timetableEntries={timetableEntries}
        trainerPreferences={trainerPreferences}
        academicSetting={academicSetting}
        onUpdateTrainerPreferences={updateTrainerPreferencesState}
        onUpdateUsers={updateUsersState}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-red-50 text-red-700 font-semibold border border-red-150">
      Error: Unauthorized User Session State. Role '{currentUser.role}' is not supported. Please sign out and re-authenticate.
      <button onClick={handleLogout} className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors">Logout</button>
    </div>
  );
}
