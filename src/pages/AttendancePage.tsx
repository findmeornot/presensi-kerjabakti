import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  User,
  Check,
  X,
  Loader2,
  RefreshCw,
  Send,
  HelpCircle,
} from 'lucide-react';
import { api } from '@/services/api';
import { EventItem, Hallway, PublicResidentAttendance } from '@/types';
import { formatDateIndo, formatDateTimeIndo, formatTimeShort } from '@/lib/utils';
import { AttendanceSuccessModal } from '@/components/AttendanceSuccessModal';
import { useToast } from '@/components/Toast';

export const AttendancePage: React.FC = () => {
  const { showToast } = useToast();

  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [residents, setResidents] = useState<PublicResidentAttendance[]>([]);
  const [selectedHallway, setSelectedHallway] = useState<Hallway>('Lorong 3');
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Izin Modal state
  const [izinModalResident, setIzinModalResident] = useState<PublicResidentAttendance | null>(null);
  const [izinReason, setIzinReason] = useState('');
  const [isSubmittingIzin, setIsSubmittingIzin] = useState(false);

  // Success Receipt Modal
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    residentName: string;
    hallway: Hallway;
    status: 'Hadir' | 'Izin';
    recordedAt: string;
    excuseReason?: string | null;
  } | null>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [eventData, residentsData] = await Promise.all([
        api.getActiveEvent(),
        api.getPublicResidentsStatus(),
      ]);
      setActiveEvent(eventData);
      setResidents(residentsData);
      if (isManual) {
        showToast('Data absensi berhasil diperbarui.', 'success');
      }
    } catch (err) {
      console.error('Failed to load attendance list:', err);
      showToast('Gagal memuat data kegiatan.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter residents based on active hallway & optional search query
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      if (r.hallway !== selectedHallway) return false;
      if (searchQuery.trim()) {
        return r.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }
      return true;
    });
  }, [residents, selectedHallway, searchQuery]);

  // Counts for tabs
  const lorong3Count = useMemo(() => {
    const list = residents.filter((r) => r.hallway === 'Lorong 3');
    const attended = list.filter((r) => r.attendance !== null).length;
    return { total: list.length, attended };
  }, [residents]);

  const lorong4Count = useMemo(() => {
    const list = residents.filter((r) => r.hallway === 'Lorong 4');
    const attended = list.filter((r) => r.attendance !== null).length;
    return { total: list.length, attended };
  }, [residents]);

  // Handle 1-Click Hadir
  const handleQuickHadir = async (resident: PublicResidentAttendance) => {
    if (!activeEvent) {
      showToast('Kegiatan belum aktif.', 'error');
      return;
    }

    if (resident.attendance) {
      showToast(`${resident.name} sudah tercatat ${resident.attendance.status}.`, 'info');
      return;
    }

    setSubmittingId(resident.id);
    try {
      const result = await api.submitAttendance({
        eventId: activeEvent.id,
        residentId: resident.id,
        status: 'Hadir',
      });

      if (result.alreadyRecorded && result.attendance) {
        showToast(`${resident.name} sudah tercatat sebelumnya.`, 'info');
        // Update local list
        setResidents((prev) =>
          prev.map((r) =>
            r.id === resident.id
              ? {
                  ...r,
                  attendance: {
                    status: result.attendance!.status,
                    recordedAt: result.attendance!.recordedAt,
                  },
                }
              : r
          )
        );
        return;
      }

      if (!result.success || !result.attendance) {
        showToast(result.error || 'Gagal menyimpan absensi.', 'error');
        return;
      }

      // Optimistic update local state
      setResidents((prev) =>
        prev.map((r) =>
          r.id === resident.id
            ? {
                ...r,
                attendance: {
                  status: 'Hadir',
                  recordedAt: result.attendance!.recordedAt,
                },
              }
            : r
        )
      );

      // Open success receipt modal
      setSuccessModalData({
        residentName: resident.name,
        hallway: resident.hallway,
        status: 'Hadir',
        recordedAt: result.attendance.recordedAt,
      });
      setSuccessModalOpen(true);
      showToast(`Absensi HADIR ${resident.name} berhasil disimpan!`, 'success');
    } catch (err: any) {
      console.error('Error submitting hadir:', err);
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  // Open Izin modal
  const handleOpenIzinModal = (resident: PublicResidentAttendance) => {
    setIzinModalResident(resident);
    setIzinReason('');
  };

  // Submit Izin with reason
  const handleSubmitIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !izinModalResident) return;

    const cleanReason = izinReason.trim();
    if (!cleanReason) {
      showToast('Alasan izin wajib diisi.', 'error');
      return;
    }

    setIsSubmittingIzin(true);
    try {
      const result = await api.submitAttendance({
        eventId: activeEvent.id,
        residentId: izinModalResident.id,
        status: 'Izin',
        excuseReason: cleanReason,
      });

      if (!result.success || !result.attendance) {
        showToast(result.error || 'Gagal menyimpan izin.', 'error');
        return;
      }

      // Update local state
      setResidents((prev) =>
        prev.map((r) =>
          r.id === izinModalResident.id
            ? {
                ...r,
                attendance: {
                  status: 'Izin',
                  recordedAt: result.attendance!.recordedAt,
                  excuseReason: cleanReason,
                },
              }
            : r
        )
      );

      setSuccessModalData({
        residentName: izinModalResident.name,
        hallway: izinModalResident.hallway,
        status: 'Izin',
        recordedAt: result.attendance.recordedAt,
        excuseReason: cleanReason,
      });
      setSuccessModalOpen(true);
      setIzinModalResident(null);
      showToast(`Izin ${izinModalResident.name} berhasil tercatat.`, 'success');
    } catch (err: any) {
      console.error('Error submitting izin:', err);
      showToast(err.message || 'Gagal menyimpan izin.', 'error');
    } finally {
      setIsSubmittingIzin(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/10 text-primary mb-2 shadow-subtle border border-blue-100">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Absensi Kerja Bakti
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">
          Pilih lorongmu, lalu klik tombol <strong className="text-emerald-700 font-semibold">HADIR</strong> atau <strong className="text-amber-700 font-semibold">IZIN</strong> di sebelah namamu.
        </p>
      </div>

      {isLoading ? (
        // Skeleton loader
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-slate-200/80 rounded-card"></div>
          <div className="h-12 bg-slate-200/80 rounded-xl"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-white rounded-subtle border border-slate-200"></div>
            ))}
          </div>
        </div>
      ) : activeEvent ? (
        <div className="space-y-5">
          {/* Active Event Card Banner */}
          <section className="bg-white rounded-card border border-slate-200/90 shadow-card overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/40 border-b border-blue-100/80 px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-white/90 px-2 py-0.5 rounded-full border border-blue-200">
                  Kegiatan Aktif
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {activeEvent.name}
                </h2>
              </div>
              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors"
                title="Perbarui daftar"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">
                  {formatDateIndo(activeEvent.event_date)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-800">
                  {formatTimeShort(activeEvent.event_time)}
                </span>
              </div>

              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">
                  {activeEvent.location}
                </span>
              </div>

              {activeEvent.description && (
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100 flex items-start gap-2 text-slate-500 text-[11px]">
                  <FileText className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                  <span>{activeEvent.description}</span>
                </div>
              )}
            </div>
          </section>

          {/* Hallway Selection Buttons (Big Clean Switcher) */}
          <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
            {/* Tab Lorong 3 */}
            <button
              type="button"
              onClick={() => {
                setSelectedHallway('Lorong 3');
                setSearchQuery('');
              }}
              className={`p-3 rounded-xl text-left transition-all duration-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 ${
                selectedHallway === 'Lorong 3'
                  ? 'bg-white shadow-subtle border border-slate-200/80 text-blue-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <div className="font-bold text-sm sm:text-base">Lorong 3</div>
              <div className="text-[11px] font-medium opacity-80">
                <span className="font-semibold text-emerald-600">{lorong3Count.attended}</span> /{' '}
                {lorong3Count.total} sudah absen
              </div>
            </button>

            {/* Tab Lorong 4 */}
            <button
              type="button"
              onClick={() => {
                setSelectedHallway('Lorong 4');
                setSearchQuery('');
              }}
              className={`p-3 rounded-xl text-left transition-all duration-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 ${
                selectedHallway === 'Lorong 4'
                  ? 'bg-white shadow-subtle border border-slate-200/80 text-indigo-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <div className="font-bold text-sm sm:text-base">Lorong 4</div>
              <div className="text-[11px] font-medium opacity-80">
                <span className="font-semibold text-emerald-600">{lorong4Count.attended}</span> /{' '}
                {lorong4Count.total} sudah absen
              </div>
            </button>
          </div>

          {/* Search Input (Cari cepat nama di lorong ini) */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari nama di ${selectedHallway}...`}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 bg-white shadow-xs"
            />
          </div>

          {/* Direct Residents Attendance List */}
          <div className="space-y-2.5">
            {filteredResidents.length > 0 ? (
              filteredResidents.map((resident, idx) => {
                const isSubmitting = submittingId === resident.id;
                const hasAttended = resident.attendance !== null;
                const isHadir = resident.attendance?.status === 'Hadir';
                const isIzin = resident.attendance?.status === 'Izin';

                return (
                  <div
                    key={resident.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                      hasAttended
                        ? isHadir
                          ? 'bg-emerald-50/40 border-emerald-200/80'
                          : 'bg-amber-50/40 border-amber-200/80'
                        : 'bg-white border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    {/* Left: Resident Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-xs ${
                          hasAttended
                            ? isHadir
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="truncate">
                        <div className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                          {resident.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span>{resident.hallway}</span>
                          {resident.attendance?.recordedAt && (
                            <>
                              <span>&bull;</span>
                              <span className="text-slate-500">
                                {formatDateTimeIndo(resident.attendance.recordedAt)}
                              </span>
                            </>
                          )}
                        </div>
                        {isIzin && resident.attendance?.excuseReason && (
                          <div className="text-[11px] text-amber-800 italic mt-0.5">
                            "{resident.attendance.excuseReason}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions or Recorded Status */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {hasAttended ? (
                        // Already submitted: Show Badge
                        <div
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs ${
                            isHadir
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {isHadir ? (
                            <>
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>HADIR</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4" />
                              <span>IZIN</span>
                            </>
                          )}
                        </div>
                      ) : (
                        // Not yet submitted: Show 2 Direct Action Buttons
                        <div className="flex items-center gap-2">
                          {/* Button 1: HADIR */}
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleQuickHadir(resident)}
                            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-subtle transition-all duration-150 flex items-center gap-1.5 disabled:opacity-60"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                            <span>Hadir</span>
                          </button>

                          {/* Button 2: IZIN */}
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleOpenIzinModal(resident)}
                            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-subtle transition-all duration-150 flex items-center gap-1.5 disabled:opacity-60"
                          >
                            <span>Izin</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                <HelpCircle className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
                <p className="text-sm font-medium">Tidak ada nama yang cocok.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-card border border-slate-200 p-8 text-center shadow-card">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-800">Belum Ada Kegiatan Aktif</h2>
          <p className="text-xs text-slate-500 mt-1">
            Silakan tunggu jadwal kerja bakti yang dibuka oleh pengurus.
          </p>
        </div>
      )}

      {/* Modal Izin dengan Alasan */}
      {izinModalResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-card shadow-elevated border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Konfirmasi Izin</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {izinModalResident.name} &bull; {izinModalResident.hallway}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIzinModalResident(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIzin} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Alasan Izin <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={izinReason}
                  onChange={(e) => setIzinReason(e.target.value)}
                  placeholder="Tuliskan alasan berhalangan hadir..."
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-subtle border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 placeholder:text-slate-400 resize-none shadow-xs"
                />
                <p className="text-[11px] text-slate-400">
                  Alasan izin akan tercatat dan dapat ditinjau oleh pengurus.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIzinModalResident(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIzin || !izinReason.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg shadow-subtle transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingIzin && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kirim Izin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Receipt Modal */}
      <AttendanceSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        data={successModalData}
      />
    </div>
  );
};
