import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Building,
} from 'lucide-react';
import { api } from '@/services/api';
import { EventItem, AttendanceRecordRow, DashboardStats, Hallway } from '@/types';
import { formatDateIndo, formatDateTimeIndo } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export const DashboardPage: React.FC = () => {
  const { showToast } = useToast();

  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [records, setRecords] = useState<AttendanceRecordRow[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalResidents: 0,
    hadir: 0,
    izin: 0,
    belumHadir: 0,
    attendancePercentage: 0,
  });

  const [activeTab, setActiveTab] = useState<'semua' | 'hadir' | 'belumHadir'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [hallwayFilter, setHallwayFilter] = useState<'Semua' | Hallway>('Semua');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const eventData = await api.getActiveEvent();
      setActiveEvent(eventData);

      if (eventData) {
        const [rows, calculatedStats] = await Promise.all([
          api.getAttendanceRecords(eventData.id),
          api.getDashboardStats(eventData.id),
        ]);
        setRecords(rows);
        setStats(calculatedStats);
      } else {
        setRecords([]);
        setStats({
          totalResidents: 0,
          hadir: 0,
          izin: 0,
          belumHadir: 0,
          attendancePercentage: 0,
        });
      }

      if (isManualRefresh) {
        showToast('Data kehadiran berhasil diperbarui.', 'success');
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      showToast('Gagal memuat data dashboard.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filtered rows calculation based on tab, hallway, and search query
  const filteredRows = useMemo(() => {
    return records.filter((row) => {
      // 1. Tab filtering
      if (activeTab === 'hadir' && row.status !== 'Hadir') return false;
      // Tab 3: Belum Hadir (Izin TIDAK boleh dimasukkan ke Belum Hadir)
      if (activeTab === 'belumHadir' && row.status !== 'Belum Hadir') return false;

      // 2. Hallway filter
      if (hallwayFilter !== 'Semua' && row.hallway !== hallwayFilter) return false;

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return row.name.toLowerCase().includes(q) || row.hallway.toLowerCase().includes(q);
      }

      return true;
    });
  }, [records, activeTab, hallwayFilter, searchQuery]);

  // Export CSV functionality
  const handleExportCsv = () => {
    if (!filteredRows.length) {
      showToast('Tidak ada data untuk diekspor.', 'info');
      return;
    }

    const headers = ['No', 'Nama Penghuni', 'Lorong', 'Status Kehadiran', 'Waktu Absensi', 'Alasan Izin'];
    const rows = filteredRows.map((r, i) => [
      i + 1,
      `"${r.name.replace(/"/g, '""')}"`,
      r.hallway,
      r.status,
      r.recorded_at ? `"${formatDateTimeIndo(r.recorded_at)}"` : '-',
      r.excuse_reason ? `"${r.excuse_reason.replace(/"/g, '""')}"` : '-',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanEventName = (activeEvent?.name || 'kegiatan').toLowerCase().replace(/\s+/g, '-');
    link.download = `absensi-${cleanEventName}-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('File CSV berhasil diunduh.', 'success');
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Dashboard Absensi
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Halo, <span className="font-semibold text-slate-700">Admin</span> &bull; Pantau absensi
            dan kehadiran warga asrama secara real-time.
          </p>
        </div>

        {/* Top actions & active event pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeEvent && (
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-subtle bg-slate-100/90 border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-slate-800">{activeEvent.name}</span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-slate-600">{formatDateIndo(activeEvent.event_date)}</span>
            </div>
          )}

          <button
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-subtle transition-colors shadow-subtle flex items-center gap-1.5"
            title="Muat ulang data kehadiran"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Perbarui</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Penghuni */}
        <div className="bg-white rounded-card p-4 sm:p-5 border border-slate-200/90 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Penghuni
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.totalResidents}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Penghuni aktif terdaftar</div>
          </div>
        </div>

        {/* Card 2: Hadir */}
        <div className="bg-white rounded-card p-4 sm:p-5 border border-emerald-100 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Hadir
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {stats.hadir}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              <span className="font-semibold text-emerald-600">
                {stats.attendancePercentage}%
              </span>{' '}
              dari total penghuni
            </div>
          </div>
        </div>

        {/* Card 3: Izin */}
        <div className="bg-white rounded-card p-4 sm:p-5 border border-amber-100 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Izin
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {stats.izin}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Berhalangan dengan keterangan</div>
          </div>
        </div>

        {/* Card 4: Belum Hadir */}
        <div className="bg-white rounded-card p-4 sm:p-5 border border-red-100 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
              Belum Hadir
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <UserX className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600">
              {stats.belumHadir}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Belum mengisi kehadiran</div>
          </div>
        </div>
      </div>

      {/* Daftar Kehadiran (Main Table Section) */}
      <section className="bg-white rounded-card border border-slate-200/90 shadow-card overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* 3 Tabs: Semua, Hadir, Belum Hadir */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 self-start">
              <button
                type="button"
                onClick={() => setActiveTab('semua')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  activeTab === 'semua'
                    ? 'bg-white text-slate-900 shadow-subtle'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({stats.totalResidents})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hadir')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  activeTab === 'hadir'
                    ? 'bg-emerald-600 text-white shadow-subtle'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hadir ({stats.hadir})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('belumHadir')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  activeTab === 'belumHadir'
                    ? 'bg-red-600 text-white shadow-subtle'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belum Hadir ({stats.belumHadir})
              </button>
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-subtle transition-colors shadow-subtle flex items-center gap-1.5 self-start md:self-auto"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Ekspor CSV</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama penghuni..."
                className="w-full pl-9 pr-3.5 py-2 rounded-subtle border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 bg-slate-50/50"
              />
            </div>

            {/* Filter Lorong: Semua, Lorong 3, Lorong 4 */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" />
                Lorong:
              </span>
              <button
                type="button"
                onClick={() => setHallwayFilter('Semua')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  hallwayFilter === 'Semua'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setHallwayFilter('Lorong 3')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  hallwayFilter === 'Lorong 3'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Lorong 3
              </button>
              <button
                type="button"
                onClick={() => setHallwayFilter('Lorong 4')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  hallwayFilter === 'Lorong 4'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Lorong 4
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Memuat daftar kehadiran...</p>
            </div>
          ) : filteredRows.length > 0 ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No.</th>
                  <th className="py-3 px-4">Nama Penghuni</th>
                  <th className="py-3 px-4">Lorong</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waktu Absensi &amp; Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row, idx) => (
                  <tr
                    key={row.resident_id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center font-medium text-slate-400 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          row.hallway === 'Lorong 3'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {row.hallway}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {row.status === 'Hadir' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Hadir
                        </span>
                      )}
                      {row.status === 'Izin' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5" />
                          Izin
                        </span>
                      )}
                      {row.status === 'Belum Hadir' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
                          <UserX className="w-3.5 h-3.5" />
                          Belum Hadir
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {row.status === 'Belum Hadir' ? (
                        <span className="text-slate-400 italic">— Belum ada catatan —</span>
                      ) : (
                        <div>
                          <div className="font-medium text-slate-700">
                            {row.recorded_at ? formatDateTimeIndo(row.recorded_at) : '-'}
                          </div>
                          {row.excuse_reason && (
                            <div className="text-amber-800 font-normal bg-amber-50/80 border border-amber-200/60 rounded px-2 py-1 mt-1">
                              Alasan: "{row.excuse_reason}"
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-sm">Tidak ada data kehadiran yang sesuai.</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Coba sesuaikan pencarian atau filter yang dipilih.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
