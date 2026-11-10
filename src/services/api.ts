import {
  Resident,
  EventItem,
  Hallway,
  AttendanceRecordRow,
  DashboardStats,
  SubmitAttendancePayload,
  SubmitAttendanceResult,
} from '@/types';

const ADMIN_TOKEN_KEY = 'kebersihan_admin_token_v2';

function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function setAdminToken(token: string | null) {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

// Helper to safely parse JSON and prevent "Unexpected token '<' / 'T'"
async function safeParseJson<T>(res: Response): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const text = await res.text();
    if (!text || text.trim().startsWith('<') || text.includes('The page cannot') || text.includes('The page could')) {
      return { ok: false, error: 'Server backend sedang tidak aktif atau rute tidak ditemukan.' };
    }
    const json = JSON.parse(text);
    return { ok: res.ok, data: json };
  } catch {
    return { ok: false, error: 'Respon server tidak valid (bukan JSON).' };
  }
}

// Fallback seed data
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

export const api = {
  // 1. Get active event
  async getActiveEvent(): Promise<EventItem | null> {
    try {
      const res = await fetch('/api/active-event');
      const parsed = await safeParseJson<any>(res);
      if (parsed.ok && parsed.data?.success) {
        return parsed.data.data;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_EVENT;
  },

  // 2. Get active residents for combobox
  async getActiveResidents(): Promise<Resident[]> {
    try {
      const res = await fetch('/api/active-residents');
      const parsed = await safeParseJson<any>(res);
      if (parsed.ok && parsed.data?.success) {
        return parsed.data.data;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_RESIDENTS.filter((r) => r.is_active);
  },

  // 2b. Get active residents with their attendance status (Direct Absensi Flow)
  async getPublicResidentsStatus(): Promise<any[]> {
    try {
      const res = await fetch('/api/public-residents-status');
      const parsed = await safeParseJson<any>(res);
      if (parsed.ok && parsed.data?.success) {
        return parsed.data.data;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_RESIDENTS.filter((r) => r.is_active).map((r) => ({
      ...r,
      attendance: null,
    }));
  },

  // 3. Get all residents for Admin
  async getAllResidents(): Promise<Resident[]> {
    const token = getAdminToken();
    try {
      const res = await fetch('/api/admin/residents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const parsed = await safeParseJson<any>(res);
      if (parsed.ok && parsed.data?.success) {
        return parsed.data.data;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_RESIDENTS;
  },

  // 4. Create resident
  async createResident(name: string, hallway: Hallway): Promise<Resident> {
    const token = getAdminToken();
    const res = await fetch('/api/admin/residents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, hallway }),
    });

    const parsed = await safeParseJson<any>(res);
    if (!parsed.ok || !parsed.data?.success) {
      throw new Error(parsed.data?.error || parsed.error || 'Gagal menambahkan penghuni.');
    }
    return parsed.data.data;
  },

  // 5. Update resident
  async updateResident(id: string, name: string, hallway: Hallway): Promise<Resident> {
    const token = getAdminToken();
    const res = await fetch(`/api/admin/residents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, hallway }),
    });

    const parsed = await safeParseJson<any>(res);
    if (!parsed.ok || !parsed.data?.success) {
      throw new Error(parsed.data?.error || parsed.error || 'Gagal mengubah data penghuni.');
    }
    return parsed.data.data;
  },

  // 6. Toggle resident status
  async toggleResidentStatus(id: string, isActive: boolean): Promise<Resident> {
    const token = getAdminToken();
    const res = await fetch(`/api/admin/residents/${id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_active: isActive }),
    });

    const parsed = await safeParseJson<any>(res);
    if (!parsed.ok || !parsed.data?.success) {
      throw new Error(parsed.data?.error || parsed.error || 'Gagal mengubah status penghuni.');
    }
    return parsed.data.data;
  },

  // 7. Submit attendance
  async submitAttendance(payload: SubmitAttendancePayload): Promise<SubmitAttendanceResult> {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const parsed = await safeParseJson<SubmitAttendanceResult>(res);
      if (parsed.data) {
        return parsed.data;
      }
      return { success: false, error: parsed.error || 'Koneksi ke server gagal.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi ke server gagal.' };
    }
  },

  // 8. Get full attendance records
  async getAttendanceRecords(eventId: string): Promise<AttendanceRecordRow[]> {
    const token = getAdminToken();
    try {
      const res = await fetch(`/api/admin/dashboard-records?eventId=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const parsed = await safeParseJson<any>(res);
      if (parsed.ok && parsed.data?.records) {
        return parsed.data.records;
      }
    } catch {
      // Fallback
    }
    return [];
  },

  // 9. Get dashboard stats
  async getDashboardStats(eventId: string): Promise<DashboardStats> {
    const token = getAdminToken();
    try {
      const res = await fetch(`/api/admin/dashboard-records?eventId=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const parsed = await safeParseJson<any>(res);
      if (parsed.ok && parsed.data?.stats) {
        return parsed.data.stats;
      }
    } catch {
      // Fallback
    }
    return {
      totalResidents: 0,
      hadir: 0,
      izin: 0,
      belumHadir: 0,
      attendancePercentage: 0,
    };
  },

  // 10. Login Admin
  async loginAdmin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const parsed = await safeParseJson<any>(res);
      if (parsed.ok && parsed.data?.success && parsed.data?.token) {
        setAdminToken(parsed.data.token);
        return { success: true };
      }
      return { success: false, error: parsed.data?.error || parsed.error || 'Login gagal.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menghubungi server.' };
    }
  },

  // 11. Logout Admin
  async logoutAdmin(): Promise<void> {
    const token = getAdminToken();
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Ignore
    }
    setAdminToken(null);
  },

  // 12. Check Admin Session
  async checkAdminSession(): Promise<boolean> {
    const token = getAdminToken();
    if (!token) return false;

    try {
      const res = await fetch('/api/admin/check-session', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const parsed = await safeParseJson<any>(res);
      if (parsed.ok && parsed.data?.success) {
        return Boolean(parsed.data.authenticated);
      }
    } catch {
      // Ignore
    }
    return false;
  },
};
