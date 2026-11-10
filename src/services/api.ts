import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Resident,
  EventItem,
  Hallway,
  AttendanceStatus,
  AttendanceRecordRow,
  DashboardStats,
  SubmitAttendancePayload,
  SubmitAttendanceResult,
} from '@/types';

// ==============================================================================
// SEED DATA FOR LOCAL FALLBACK / OFFLINE MODE
// ==============================================================================
const DEFAULT_EVENT: EventItem = {
  id: 'e1111111-1111-1111-1111-111111111111',
  name: 'Kerja Bakti Asrama',
  event_date: '2026-11-10',
  event_time: '17.00 WIB',
  location: 'Lorong 3 & 4',
  description: 'Pembersihan kamar mandi baru dan wastafel',
  is_active: true,
  created_at: '2026-11-01T08:00:00Z',
};

const DEFAULT_RESIDENTS: Resident[] = [
  { id: 'r01', name: 'Ahmad Fauzi', hallway: 'Lorong 3', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r02', name: 'Budi Santoso', hallway: 'Lorong 3', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r03', name: 'Dimas Pratama', hallway: 'Lorong 3', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r04', name: 'Fajar Ramadhan', hallway: 'Lorong 3', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r05', name: 'Gilang Perkasa', hallway: 'Lorong 3', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r06', name: 'Hendra Wijaya', hallway: 'Lorong 3', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r07', name: 'Irfan Hakim', hallway: 'Lorong 3', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r08', name: 'Aditya Pratama', hallway: 'Lorong 4', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r09', name: 'Bagus Nugroho', hallway: 'Lorong 4', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r10', name: 'Candra Kusuma', hallway: 'Lorong 4', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r11', name: 'Dwi Saputra', hallway: 'Lorong 4', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r12', name: 'Farhan Maulana', hallway: 'Lorong 4', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r13', name: 'Hafizh Firdaus', hallway: 'Lorong 4', is_active: true, created_at: '2026-11-01T08:00:00Z' },
  { id: 'r14', name: 'Rizky Alamsyah', hallway: 'Lorong 4', is_active: true, created_at: '2026-11-01T08:00:00Z' },
];

const LOCAL_STORAGE_KEYS = {
  EVENTS: 'kebersihan_asrama_events_v2',
  RESIDENTS: 'kebersihan_asrama_residents_v2',
  ATTENDANCES: 'kebersihan_asrama_attendances_v2',
  SESSION: 'kebersihan_asrama_session_v2',
};

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

// Initialise storage if empty
function ensureLocalInitialized() {
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.EVENTS)) {
    setLocalData(LOCAL_STORAGE_KEYS.EVENTS, [DEFAULT_EVENT]);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.RESIDENTS)) {
    setLocalData(LOCAL_STORAGE_KEYS.RESIDENTS, DEFAULT_RESIDENTS);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.ATTENDANCES)) {
    setLocalData(LOCAL_STORAGE_KEYS.ATTENDANCES, []);
  }
}

// ==============================================================================
// PUBLIC API IMPLEMENTATION
// ==============================================================================

export const api = {
  // 1. Get active event
  async getActiveEvent(): Promise<EventItem | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching active event:', error);
        return null;
      }
      return data;
    }

    // Local Fallback
    ensureLocalInitialized();
    const events = getLocalData<EventItem[]>(LOCAL_STORAGE_KEYS.EVENTS, [DEFAULT_EVENT]);
    return events.find((e) => e.is_active) || null;
  },

  // 2. Get active residents for attendance combobox
  async getActiveResidents(): Promise<Resident[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching active residents:', error);
        return [];
      }
      return data || [];
    }

    // Local Fallback
    ensureLocalInitialized();
    const residents = getLocalData<Resident[]>(LOCAL_STORAGE_KEYS.RESIDENTS, DEFAULT_RESIDENTS);
    return residents
      .filter((r) => r.is_active)
      .sort((a, b) => a.name.localeCompare(b.name, 'id'));
  },

  // 3. Get all residents for Admin Master Penghuni
  async getAllResidents(): Promise<Resident[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .order('hallway', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching all residents:', error);
        throw new Error(error.message);
      }
      return data || [];
    }

    // Local Fallback
    ensureLocalInitialized();
    const residents = getLocalData<Resident[]>(LOCAL_STORAGE_KEYS.RESIDENTS, DEFAULT_RESIDENTS);
    return [...residents].sort((a, b) => {
      if (a.hallway === b.hallway) {
        return a.name.localeCompare(b.name, 'id');
      }
      return a.hallway.localeCompare(b.hallway);
    });
  },

  // 4. Create new resident
  async createResident(name: string, hallway: Hallway): Promise<Resident> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nama penghuni tidak boleh kosong.');
    if (!['Lorong 3', 'Lorong 4'].includes(hallway)) throw new Error('Pilih lorong yang valid.');

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('residents')
        .insert([{ name: trimmed, hallway, is_active: true }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    // Local Fallback
    ensureLocalInitialized();
    const residents = getLocalData<Resident[]>(LOCAL_STORAGE_KEYS.RESIDENTS, DEFAULT_RESIDENTS);
    const newResident: Resident = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'r_' + Date.now(),
      name: trimmed,
      hallway,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    residents.push(newResident);
    setLocalData(LOCAL_STORAGE_KEYS.RESIDENTS, residents);
    return newResident;
  },

  // 5. Update existing resident
  async updateResident(id: string, name: string, hallway: Hallway): Promise<Resident> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nama penghuni tidak boleh kosong.');
    if (!['Lorong 3', 'Lorong 4'].includes(hallway)) throw new Error('Pilih lorong yang valid.');

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('residents')
        .update({ name: trimmed, hallway })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    // Local Fallback
    ensureLocalInitialized();
    const residents = getLocalData<Resident[]>(LOCAL_STORAGE_KEYS.RESIDENTS, DEFAULT_RESIDENTS);
    const index = residents.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Penghuni tidak ditemukan.');

    residents[index] = {
      ...residents[index],
      name: trimmed,
      hallway,
    };
    setLocalData(LOCAL_STORAGE_KEYS.RESIDENTS, residents);
    return residents[index];
  },

  // 6. Toggle resident status (active / inactive)
  async toggleResidentStatus(id: string, isActive: boolean): Promise<Resident> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('residents')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    // Local Fallback
    ensureLocalInitialized();
    const residents = getLocalData<Resident[]>(LOCAL_STORAGE_KEYS.RESIDENTS, DEFAULT_RESIDENTS);
    const index = residents.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Penghuni tidak ditemukan.');

    residents[index] = {
      ...residents[index],
      is_active: isActive,
    };
    setLocalData(LOCAL_STORAGE_KEYS.RESIDENTS, residents);
    return residents[index];
  },

  // 7. Submit resident attendance
  async submitAttendance(payload: SubmitAttendancePayload): Promise<SubmitAttendanceResult> {
    const { eventId, residentId, status, excuseReason } = payload;

    if (!eventId || !residentId || !status) {
      return { success: false, error: 'Data absensi tidak lengkap.' };
    }

    if (status === 'Izin' && (!excuseReason || !excuseReason.trim())) {
      return { success: false, error: 'Alasan izin wajib diisi.' };
    }

    if (isSupabaseConfigured && supabase) {
      // Use secure backend RPC stored procedure
      const { data, error } = await supabase.rpc('submit_attendance', {
        p_event_id: eventId,
        p_resident_id: residentId,
        p_status: status,
        p_excuse_reason: status === 'Izin' ? excuseReason?.trim() : null,
      });

      if (error) {
        console.error('RPC submit_attendance error:', error);
        return { success: false, error: error.message };
      }

      return data as SubmitAttendanceResult;
    }

    // Local Fallback
    ensureLocalInitialized();
    const residents = getLocalData<Resident[]>(LOCAL_STORAGE_KEYS.RESIDENTS, DEFAULT_RESIDENTS);
    const attendances = getLocalData<any[]>(LOCAL_STORAGE_KEYS.ATTENDANCES, []);

    const resident = residents.find((r) => r.id === residentId);
    if (!resident || !resident.is_active) {
      return { success: false, error: 'Data penghuni tidak aktif atau tidak ditemukan.' };
    }

    // Check existing
    const existing = attendances.find((a) => a.event_id === eventId && a.resident_id === residentId);
    if (existing) {
      return {
        success: false,
        alreadyRecorded: true,
        error: 'Absensi sudah tercatat sebelumnya.',
        attendance: {
          residentName: resident.name,
          hallway: resident.hallway,
          status: existing.status,
          recordedAt: existing.created_at,
        },
      };
    }

    const recordedAt = new Date().toISOString();
    const newRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'att_' + Date.now(),
      event_id: eventId,
      resident_id: residentId,
      status,
      excuse_reason: status === 'Izin' ? excuseReason?.trim() || null : null,
      created_at: recordedAt,
    };

    attendances.push(newRecord);
    setLocalData(LOCAL_STORAGE_KEYS.ATTENDANCES, attendances);

    return {
      success: true,
      alreadyRecorded: false,
      attendance: {
        residentName: resident.name,
        hallway: resident.hallway,
        status,
        recordedAt,
      },
    };
  },

  // 8. Get full attendance records for active event
  async getAttendanceRecords(eventId: string): Promise<AttendanceRecordRow[]> {
    if (isSupabaseConfigured && supabase) {
      // Fetch active residents
      const { data: residents, error: resErr } = await supabase
        .from('residents')
        .select('*')
        .eq('is_active', true)
        .order('hallway', { ascending: true })
        .order('name', { ascending: true });

      if (resErr) {
        console.error('Error fetching residents for records:', resErr);
        return [];
      }

      // Fetch attendances for this event
      const { data: attendances, error: attErr } = await supabase
        .from('attendances')
        .select('*')
        .eq('event_id', eventId);

      if (attErr) {
        console.error('Error fetching attendances:', attErr);
        return [];
      }

      const attMap = new Map<string, any>();
      (attendances || []).forEach((a) => {
        attMap.set(a.resident_id, a);
      });

      return (residents || []).map((r) => {
        const att = attMap.get(r.id);
        const status: AttendanceStatus = att ? (att.status as 'Hadir' | 'Izin') : 'Belum Hadir';
        return {
          resident_id: r.id,
          name: r.name,
          hallway: r.hallway,
          status,
          excuse_reason: att?.excuse_reason || null,
          recorded_at: att?.created_at || null,
          attendance_id: att?.id || null,
        };
      });
    }

    // Local Fallback
    ensureLocalInitialized();
    const residents = getLocalData<Resident[]>(LOCAL_STORAGE_KEYS.RESIDENTS, DEFAULT_RESIDENTS).filter(
      (r) => r.is_active
    );
    const attendances = getLocalData<any[]>(LOCAL_STORAGE_KEYS.ATTENDANCES, []).filter(
      (a) => a.event_id === eventId
    );

    const attMap = new Map<string, any>();
    attendances.forEach((a) => {
      attMap.set(a.resident_id, a);
    });

    return residents.map((r) => {
      const att = attMap.get(r.id);
      const status: AttendanceStatus = att ? (att.status as 'Hadir' | 'Izin') : 'Belum Hadir';
      return {
        resident_id: r.id,
        name: r.name,
        hallway: r.hallway,
        status,
        excuse_reason: att?.excuse_reason || null,
        recorded_at: att?.created_at || null,
        attendance_id: att?.id || null,
      };
    });
  },

  // 9. Compute dashboard stats
  async getDashboardStats(eventId: string): Promise<DashboardStats> {
    const rows = await this.getAttendanceRecords(eventId);
    const totalResidents = rows.length;
    const hadir = rows.filter((r) => r.status === 'Hadir').length;
    const izin = rows.filter((r) => r.status === 'Izin').length;
    // Belum Hadir = Total Penghuni - Hadir - Izin (Izin tidak boleh masuk Belum Hadir)
    const belumHadir = totalResidents - hadir - izin;
    const attendancePercentage = totalResidents > 0 ? Math.round((hadir / totalResidents) * 100) : 0;

    return {
      totalResidents,
      hadir,
      izin,
      belumHadir,
      attendancePercentage,
    };
  },

  // 10. Admin Authentication
  async loginAdmin(identifier: string, password: string): Promise<{ success: boolean; error?: string }> {
    const cleanId = identifier.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      // Map username 'admin' to 'admin@asrama.local'
      const email = cleanId.includes('@') ? cleanId : `${cleanId}@asrama.local`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: 'Kredensial tidak valid. Periksa kembali username dan password.' };
      }

      if (data.session) {
        return { success: true };
      }
      return { success: false, error: 'Sesi gagal dibuat.' };
    }

    // Local Fallback Auth Verification
    // Username: admin, Password: admingacor123
    if ((cleanId === 'admin' || cleanId === 'admin@asrama.local') && password === 'admingacor123') {
      const mockSession = {
        user: { id: 'admin-001', username: 'admin', role: 'admin' },
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };
      setLocalData(LOCAL_STORAGE_KEYS.SESSION, mockSession);
      return { success: true };
    }

    return {
      success: false,
      error: 'Username atau password salah. Gunakan username "admin" dan password yang benar.',
    };
  },

  // 11. Logout Admin
  async logoutAdmin(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION);
  },

  // 12. Check Admin Session
  async checkAdminSession(): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      return Boolean(data?.session);
    }

    const session = getLocalData<any>(LOCAL_STORAGE_KEYS.SESSION, null);
    if (!session) return false;
    if (session.expiresAt && session.expiresAt < Date.now()) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION);
      return false;
    }
    return true;
  },
};
