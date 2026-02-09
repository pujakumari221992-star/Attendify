
/**
 * Defines the possible attendance statuses for a staff member on a given day.
 */
export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  HALF_DAY = 'Half Day',
  OVERTIME = 'Overtime',
  LEAVE = 'Leave',
  LATE = 'Late',
  SICK_LEAVE = 'Sick Leave',
  EARLY_EXIT = 'Early Exit'
}

/**
 * Defines the types of logs that can be recorded for staff members.
 */
export enum LogType {
  EARLY_EXIT = 'Early Exit',
  LATE_ARRIVAL = 'Late Arrival',
  EARLY_ARRIVAL = 'Early Arrival', // New
  LATE_EXIT = 'Late Exit',         // New
  OVERTIME = 'Overtime',
  LEAVE = 'Leave',
  ATTENDANCE_CHANGE = 'Attendance Change',
  REGULAR = 'Marked'
}

/**
 * Represents a log entry for a staff member.
 * Tracks history of attendance marking and changes.
 */
export interface StaffLog {
  id?: string;
  staffId: string;
  staffName: string;
  type: LogType;
  status: AttendanceStatus | null;
  previousStatus?: AttendanceStatus | null;
  date: string; // YYYY-MM-DD
  timeIn?: string;
  timeOut?: string;
  timestamp: any; // Firestore Server Timestamp
  uid: string; // Owner UID
  description?: string;
}

/**
 * Represents a single attendance record for a staff member on a specific date.
 */
export interface AttendanceRecord {
  id?: string; // Firestore Document ID
  staffId: string;
  date: string; // Format: YYYY-MM-DD
  status: AttendanceStatus;
  timestamp: any; // Firestore Server Timestamp
  created_at: any; // Firestore Server Timestamp
  uid: string; // Owner UID
  checkInTime?: string; // HH:mm string for local display
}

/**
 * Represents the user's subscription status within the app.
 */
export interface Subscription {
  status: 'active' | 'expired' | 'free';
  plan: 'Free' | 'Pro';
  expiry: number | null; // Timestamp of expiry date
  platform: 'android' | 'web';
  transactionId?: string;
}

/**
 * Represents a single staff member in the organization.
 */
export interface Staff {
  id: string;
  staffId?: string; // e.g., STF-001
  name: string;
  role: string;
  shift: string;
  status: 'Online' | 'Offline' | 'On Leave' | 'Remote' | 'Off Duty';
  avatar?: string;
  monthlySalary: number;
  email?: string;
  startDate: string;
  uid: string; // The app user's UID who owns this staff record
  createdAt: any; // Firestore Server Timestamp
  notes?: string;
  employmentType: 'Full-time' | 'Part-time';
}

/**
 * Defines the valid names for the main tabs in the application's navigation.
 */
export type TabType = 'admin' | 'stats' | 'schedule' | 'staff' | 'profile';

/**
 * Represents a single holiday entry.
 */
export interface Holiday {
  id: string;
  uid: string;
  date: string; // Format: YYYY-MM-DD
  name: string;
  greeting: string;
  createdAt: any; // Firestore Server Timestamp
}
