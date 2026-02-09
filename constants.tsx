
import { AttendanceStatus, LogType } from './types';

export const THEME_COLOR = {
  primary: '#136A73',
  secondary: '#0D9488',
  bg: '#F8FAFC',
  textMain: '#1E293B',
  textMuted: '#64748B',
};

export const ATTENDANCE_COLORS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: '#10B981', // Green
  [AttendanceStatus.ABSENT]: '#EF4444',  // Red
  [AttendanceStatus.HALF_DAY]: '#F59E0B', // Yellow
  [AttendanceStatus.OVERTIME]: '#3B82F6', // Blue
  [AttendanceStatus.LEAVE]: '#64748B',    // Slate
  [AttendanceStatus.LATE]: '#FB923C',     // Orange
  [AttendanceStatus.SICK_LEAVE]: '#EC4899', // Pink
  [AttendanceStatus.EARLY_EXIT]: '#8B5CF6', // Violet
};

export const STATUS_TO_TRANSLATION_KEY: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'schedule_present',
  [AttendanceStatus.ABSENT]: 'schedule_absent',
  [AttendanceStatus.HALF_DAY]: 'schedule_half_day',
  [AttendanceStatus.LATE]: 'schedule_late',
  [AttendanceStatus.LEAVE]: 'schedule_leave',
  [AttendanceStatus.OVERTIME]: 'schedule_overtime',
  [AttendanceStatus.SICK_LEAVE]: 'schedule_sick_leave',
  [AttendanceStatus.EARLY_EXIT]: 'schedule_early_exit',
};

export const LOG_TYPE_TO_TRANSLATION_KEY: Record<LogType, string> = {
  [LogType.EARLY_EXIT]: 'log_type_early_exit',
  [LogType.LATE_ARRIVAL]: 'log_type_late_arrival',
  [LogType.EARLY_ARRIVAL]: 'log_type_early_arrival',
  [LogType.LATE_EXIT]: 'log_type_late_exit',
  [LogType.OVERTIME]: 'schedule_overtime',
  [LogType.LEAVE]: 'schedule_leave',
  [LogType.ATTENDANCE_CHANGE]: 'Attendance Edit',
  [LogType.REGULAR]: 'Marked',
};
