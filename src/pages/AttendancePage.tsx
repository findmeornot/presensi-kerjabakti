import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Loader2,
  Check,
  XCircle,
} from 'lucide-react';
import { api } from '@/services/api';
import { EventItem, Resident, Hallway } from '@/types';
import { formatDateIndo, formatTimeShort } from '@/lib/utils';
import { SearchableCombobox } from '@/components/SearchableCombobox';
import { AttendanceSuccessModal } from '@/components/AttendanceSuccessModal';
import { useToast } from '@/components/Toast';

export const AttendancePage: React.FC = () => {
  const { showToast } = useToast();

  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [status, setStatus] = useState<'Hadir' | 'Izin' | null>(null);
  const [excuseReason, setExcuseReason] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIsAlready, setModalIsAlready] = useState(false);
  const [modalData, setModalData] = useState<{
    residentName: string;
    hallway: Hallway;
    status: 'Hadir' | 'Izin';
    recordedAt: string;
    excuseReason?: string | null;
  } | null>(null);

  // Load active event & residents list
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eventData, residentsData] = await Promise.all([
        api.getActiveEvent(),
        api.getActiveResidents(),
      ]);
      setActiveEvent(eventData);
      setResidents(residentsData);
    } catch (err) {
      console.error('Failed to load attendance page data:', err);
      showToast('Gagal memuat data kegiatan. Silakan refresh halaman.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeEvent) {
      showToast('Tidak ada kegiatan aktif yang dibuka saat ini.', 'error');
      return;
    }

    if (!selectedResident) {
      showToast('Silakan pilih nama penghuni dari daftar yang tersedia.', 'error');
      return;
    }

    if (!status) {
      showToast('Silakan pilih status kehadiran (Hadir atau Izin).', 'error');
      return;
    }

    if (status === 'Izin' && !excuseReason.trim()) {
      showToast('Alasan izin wajib diisi secara jelas.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.submitAttendance({
        eventId: activeEvent.id,
        residentId: selectedResident.id,
        status,
        excuseReason: status === 'Izin' ? excuseReason.trim() : undefined,
      });

      if (result.alreadyRecorded && result.attendance) {
        setModalIsAlready(true);
        setModalData({
          residentName: result.attendance.residentName,
          hallway: result.attendance.hallway,
          status: result.attendance.status,
          recordedAt: result.attendance.recordedAt,
        });
        setModalOpen(true);
        showToast(`${result.attendance.residentName} sudah tercatat sebelumnya.`, 'info');
        return;
      }

      if (!result.success || !result.attendance) {
        showToast(result.error || 'Gagal menyimpan absensi.', 'error');
        return;
      }

      // Success
      setModalIsAlready(false);
      setModalData({
        residentName: result.attendance.residentName,
        hallway: result.attendance.hallway,
        status: result.attendance.status,
        recordedAt: result.attendance.recordedAt,
        excuseReason: status === 'Izin' ? excuseReason.trim() : null,
      });
      setModalOpen(true);
      showToast(`Absensi ${result.attendance.residentName} berhasil disimpan.`, 'success');

      // Reset form
      setSelectedResident(null);
      setStatus(null);
      setExcuseReason('');
    } catch (err: any) {
      console.error('Submit error:', err);
      showToast(err.message || 'Terjadi kesalahan saat memproses absensi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 px-4 max-w-2xl mx-auto">
      {/* Title & Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/10 text-primary mb-3 shadow-subtle border border-blue-100">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
          Absensi Kerja Bakti
        </h1>
        <p className="text-sm sm:text-base text-text-muted mt-1.5 font-normal">
          Pendataan kehadiran penghuni asrama
        </p>
      </div>

      {isLoading ? (
        // Skeleton loader
        <div className="space-y-6">
          <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-6 bg-slate-200 rounded w-2/3"></div>
            <div className="h-4 bg-slate-100 rounded w-full"></div>
          </div>
          <div className="bg-white rounded-card p-6 border border-slate-200/80 shadow-card animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="h-20 bg-slate-100 rounded"></div>
          </div>
        </div>
      ) : activeEvent ? (
        <div className="space-y-6">
          {/* Card Informasi Kegiatan */}
          <section className="bg-white rounded-card border border-slate-200/90 shadow-card overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/40 border-b border-blue-100/80 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-white/80 px-2.5 py-1 rounded-full border border-blue-200 shadow-xs">
                  Kegiatan Aktif
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Dibuka
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2">
                {activeEvent.name}
              </h2>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-400">Tanggal</div>
                  <div className="font-semibold text-slate-900">
                    {formatDateIndo(activeEvent.event_date)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-400">Waktu</div>
                  <div className="font-semibold text-slate-900">
                    {formatTimeShort(activeEvent.event_time)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-400">Lokasi</div>
                  <div className="font-semibold text-slate-900">{activeEvent.location}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-slate-700 sm:col-span-2 pt-2 border-t border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-400">Keterangan</div>
                  <div className="font-normal text-slate-700 text-xs sm:text-sm">
                    {activeEvent.description || 'Pembersihan bersama seluruh area asrama.'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Form Absensi */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-card border border-slate-200/90 shadow-card p-6 sm:p-7 space-y-6"
          >
            {/* Field: Nama Penghuni (Searchable Dropdown) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-900">
                Nama Penghuni <span className="text-red-500">*</span>
              </label>
              <SearchableCombobox
                residents={residents}
                selectedResident={selectedResident}
                onSelect={(resident) => setSelectedResident(resident)}
              />
              <p className="text-xs text-slate-500">
                Pilih namamu dari daftar yang terdaftar di database.
              </p>
            </div>

            {/* Field: Lorong (Read-only / Auto-filled) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-900">
                Lorong <span className="text-xs font-normal text-slate-400">(Otomatis)</span>
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-subtle bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 flex items-center justify-between">
                <span>{selectedResident ? selectedResident.hallway : '— Belum memilih nama —'}</span>
                {selectedResident && (
                  <span className="text-xs px-2 py-0.5 rounded font-semibold bg-blue-100 text-blue-800">
                    Terverifikasi
                  </span>
                )}
              </div>
            </div>

            {/* Field: Status Kehadiran (Dua Kartu: HADIR & IZIN) */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">
                Status Kehadiran <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3.5">
                {/* Kartu HADIR */}
                <button
                  type="button"
                  onClick={() => setStatus('Hadir')}
                  className={`relative p-4 rounded-subtle border-2 text-left transition-all duration-150 flex flex-col justify-between ${
                    status === 'Hadir'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                        status === 'Hadir'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Pilihan 1
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        status === 'Hadir' ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {status === 'Hadir' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-900">HADIR</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mengikuti kerja bakti tepat waktu
                    </p>
                  </div>
                </button>

                {/* Kartu IZIN */}
                <button
                  type="button"
                  onClick={() => setStatus('Izin')}
                  className={`relative p-4 rounded-subtle border-2 text-left transition-all duration-150 flex flex-col justify-between ${
                    status === 'Izin'
                      ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                        status === 'Izin'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Pilihan 2
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        status === 'Izin' ? 'bg-amber-600 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {status === 'Izin' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-900">IZIN</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Berhalangan hadir dengan alasan
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Kolom Alasan Izin (Hanya muncul jika memilih IZIN) */}
            {status === 'Izin' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-semibold text-slate-900">
                  Alasan Izin <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={excuseReason}
                  onChange={(e) => setExcuseReason(e.target.value)}
                  placeholder="Tuliskan alasan tidak dapat hadir secara jelas..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-subtle border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 placeholder:text-slate-400 resize-none shadow-subtle"
                />
                <p className="text-xs text-slate-500">
                  Alasan ini akan ditinjau langsung oleh pengurus asrama.
                </p>
              </div>
            )}

            {/* Tombol Utama: Konfirmasi Kehadiran */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedResident || !status}
              className="w-full py-3.5 px-6 rounded-subtle bg-primary hover:bg-primary-hover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base shadow-subtle transition-all duration-150 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses Absensi...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Konfirmasi Kehadiran</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-card border border-slate-200 p-8 text-center shadow-card">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Tidak Ada Kegiatan Aktif</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Saat ini belum ada jadwal absensi kerja bakti yang dibuka. Silakan tunggu informasi dari
            pengurus.
          </p>
        </div>
      )}

      {/* Modal Notifikasi Sukses / Sudah Tercatat */}
      <AttendanceSuccessModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isAlreadyRecorded={modalIsAlready}
        data={modalData}
      />
    </div>
  );
};
