import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Power,
  Search,
  Check,
  X,
  Loader2,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { api } from '@/services/api';
import { Resident, Hallway } from '@/types';
import { useToast } from '@/components/Toast';

export const ResidentsManagementPage: React.FC = () => {
  const { showToast } = useToast();

  const [residents, setResidents] = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hallwayFilter, setHallwayFilter] = useState<'Semua' | Hallway>('Semua');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalHallway, setModalHallway] = useState<Hallway>('Lorong 3');
  const [isSaving, setIsSaving] = useState(false);

  // Status toggle confirmation
  const [toggleResident, setToggleResident] = useState<Resident | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const loadResidents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllResidents();
      setResidents(data);
    } catch (err) {
      console.error('Error loading residents:', err);
      showToast('Gagal memuat data penghuni.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResidents();
  }, []);

  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      if (hallwayFilter !== 'Semua' && r.hallway !== hallwayFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return r.name.toLowerCase().includes(q) || r.hallway.toLowerCase().includes(q);
      }
      return true;
    });
  }, [residents, hallwayFilter, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingResident(null);
    setModalName('');
    setModalHallway('Lorong 3');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: Resident) => {
    setEditingResident(r);
    setModalName(r.name);
    setModalHallway(r.hallway);
    setIsModalOpen(true);
  };

  const handleSaveResident = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = modalName.trim();
    if (!cleanName) {
      showToast('Nama penghuni wajib diisi.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingResident) {
        // Edit existing
        const updated = await api.updateResident(editingResident.id, cleanName, modalHallway);
        setResidents((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        );
        showToast(`Data ${updated.name} berhasil diperbarui.`, 'success');
      } else {
        // Add new
        const created = await api.createResident(cleanName, modalHallway);
        setResidents((prev) => [created, ...prev]);
        showToast(`Penghuni ${created.name} berhasil ditambahkan.`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save resident error:', err);
      showToast(err.message || 'Gagal menyimpan data penghuni.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!toggleResident) return;
    setIsToggling(true);
    try {
      const nextStatus = !toggleResident.is_active;
      const updated = await api.toggleResidentStatus(toggleResident.id, nextStatus);
      setResidents((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      showToast(
        `Penghuni ${updated.name} berhasil ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
        'success'
      );
      setToggleResident(null);
    } catch (err: any) {
      console.error('Toggle status error:', err);
      showToast(err.message || 'Gagal mengubah status penghuni.', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Data Penghuni
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data master warga asrama Lorong 3 dan Lorong 4.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold rounded-subtle shadow-subtle transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Penghuni</span>
        </button>
      </div>

      {/* Main card */}
      <section className="bg-white rounded-card border border-slate-200/90 shadow-card overflow-hidden">
        {/* Controls: Search and Hallway Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama penghuni..."
              className="w-full pl-9 pr-3.5 py-2 rounded-subtle border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setHallwayFilter('Semua')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                hallwayFilter === 'Semua'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Semua Lorong
            </button>
            <button
              type="button"
              onClick={() => setHallwayFilter('Lorong 3')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                hallwayFilter === 'Lorong 4'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Lorong 4
            </button>
          </div>
        </div>

        {/* Residents Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Memuat data penghuni...</p>
            </div>
          ) : filteredResidents.length > 0 ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No.</th>
                  <th className="py-3 px-4">Nama Penghuni</th>
                  <th className="py-3 px-4">Lorong</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResidents.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      !r.is_active ? 'opacity-60 bg-slate-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-medium text-slate-400 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {r.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          r.hallway === 'Lorong 3'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {r.hallway}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {r.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(r)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors shadow-xs flex items-center gap-1"
                          title="Edit nama atau lorong"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setToggleResident(r)}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors shadow-xs flex items-center gap-1 ${
                            r.is_active
                              ? 'text-red-700 hover:bg-red-50 border-red-200 bg-white'
                              : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200 bg-white'
                          }`}
                          title={r.is_active ? 'Nonaktifkan penghuni' : 'Aktifkan penghuni'}
                        >
                          <Power className="w-3 h-3" />
                          <span>{r.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-sm">Tidak ada data penghuni yang cocok.</p>
            </div>
          )}
        </div>
      </section>

      {/* Modal: Tambah / Edit Penghuni */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-card shadow-elevated border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingResident ? 'Edit Data Penghuni' : 'Tambah Penghuni Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResident} className="p-5 space-y-4">
              {/* Field: Nama */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="Contoh: Dimas Pratama"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-subtle border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 placeholder:text-slate-400 shadow-subtle"
                />
              </div>

              {/* Field: Lorong */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Pilih Lorong <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalHallway('Lorong 3')}
                    className={`py-2.5 px-3 rounded-subtle border-2 text-center text-sm font-semibold transition-all ${
                      modalHallway === 'Lorong 3'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Lorong 3
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalHallway('Lorong 4')}
                    className={`py-2.5 px-3 rounded-subtle border-2 text-center text-sm font-semibold transition-all ${
                      modalHallway === 'Lorong 4'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Lorong 4
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-subtle transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-subtle shadow-subtle transition-colors flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Toggle Status Aktif/Nonaktif */}
      {toggleResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-card shadow-elevated border border-slate-200 p-5 space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <div
              className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                toggleResident.is_active
                  ? 'bg-red-50 text-red-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Power className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {toggleResident.is_active ? 'Nonaktifkan Penghuni?' : 'Aktifkan Penghuni?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah kamu yakin ingin {toggleResident.is_active ? 'menonaktifkan' : 'mengaktifkan'}{' '}
                <strong className="text-slate-800">{toggleResident.name}</strong> ({toggleResident.hallway})?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setToggleResident(null)}
                className="py-2 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-subtle border border-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isToggling}
                onClick={handleConfirmToggleStatus}
                className={`py-2 px-3 text-xs font-semibold text-white rounded-subtle transition-colors flex items-center justify-center gap-1 shadow-subtle ${
                  toggleResident.is_active
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isToggling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Lanjutkan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
