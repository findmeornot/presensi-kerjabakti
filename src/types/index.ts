export type Hallway = 'Lorong 3' | 'Lorong 4';

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Belum Hadir';

export interface Resident {
  id: string;
  name: string;
  hallway: Hallway;
  is_active: boolean;
  created_at: string;
}

export interface EventItem {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  location: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  event_id: string;
  resident_id: string;
  status: 'Hadir' | 'Izin';
  excuse_reason: string | null;
  created_at: string;
}

export interface AttendanceRecordRow {
  resident_id: string;
  name: string;
  hallway: Hallway;
  status: AttendanceStatus;
  excuse_reason: string | null;
  recorded_at: string | null;
  attendance_id: string | null;
}

export interface DashboardStats {
  totalResidents: number;
  hadir: number;
  izin: number;
  belumHadir: number;
  attendancePercentage: number;
}

export interface SubmitAttendancePayload {
  eventId: string;
  residentId: string;
  status: 'Hadir' | 'Izin';
  excuseReason?: string;
}

export interface SubmitAttendanceResult {
  success: boolean;
  alreadyRecorded?: boolean;
  attendance?: {
    residentName: string;
    hallway: Hallway;
    status: 'Hadir' | 'Izin';
    recordedAt: string;
  };
  error?: string;
}

export interface PublicResidentAttendance {
  id: string;
  name: string;
  hallway: Hallway;
  is_active: boolean;
  attendance: {
    status: 'Hadir' | 'Izin';
    recordedAt: string;
    excuseReason?: string | null;
  } | null;
}
