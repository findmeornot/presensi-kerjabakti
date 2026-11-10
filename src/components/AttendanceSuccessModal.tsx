import React from 'react';
import { CheckCircle2, AlertTriangle, Calendar, Clock, MapPin, User, Check, X } from 'lucide-react';
import { formatDateTimeIndo } from '@/lib/utils';
import { Hallway } from '@/types';

interface AttendanceSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAlreadyRecorded?: boolean;
  data: {
    residentName: string;
    hallway: Hallway;
    status: 'Hadir' | 'Izin';
    recordedAt: string;
    excuseReason?: string | null;
  } | null;
}

export const AttendanceSuccessModal: React.FC<AttendanceSuccessModalProps> = ({
  isOpen,
  onClose,
  isAlreadyRecorded = false,
  data,
}) => {
  if (!isOpen || !data) return null;

  const isHadir = data.status === 'Hadir';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-card shadow-elevated border border-slate-100 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div
          className={
            isAlreadyRecorded
              ? 'bg-amber-500/10 border-b border-amber-200/60 p-6 text-center'
              : 'bg-emerald-500/10 border-b border-emerald-200/60 p-6 text-center'
          }
        >
          <div
            className={
              isAlreadyRecorded
                ? 'w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-sm'
                : 'w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm'
            }
          >
            {isAlreadyRecorded ? (
              <AlertTriangle className="w-7 h-7" />
            ) : (
              <CheckCircle2 className="w-7 h-7" />
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {isAlreadyRecorded ? 'Sudah Tercatat Sebelumnya' : 'Absensi Berhasil Tercatat!'}
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            {isAlreadyRecorded
              ? 'Kamu sudah mengisi absensi untuk kegiatan ini.'
              : 'Terima kasih, data kehadiranmu telah disimpan ke sistem.'}
          </p>
        </div>

        {/* Content details */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-subtle p-4 space-y-3">
            <div className="flex items-center justify-between text-sm pb-2.5 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Nama Penghuni
              </span>
              <span className="font-semibold text-slate-900">{data.residentName}</span>
            </div>

            <div className="flex items-center justify-between text-sm pb-2.5 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                Lorong
              </span>
              <span className="font-medium px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-200">
                {data.hallway}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm pb-2.5 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-400" />
                Status Kehadiran
              </span>
              <span
                className={`font-semibold px-2.5 py-0.5 rounded-full text-xs ${
                  isHadir
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {data.status.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Waktu Pencatatan
              </span>
              <span className="font-medium text-slate-700 text-xs text-right">
                {formatDateTimeIndo(data.recordedAt)}
              </span>
            </div>

            {data.excuseReason && (
              <div className="pt-2.5 border-t border-slate-200/60">
                <span className="text-xs text-slate-500 block mb-1">Alasan Izin:</span>
                <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded border border-slate-200">
                  "{data.excuseReason}"
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white font-medium rounded-subtle transition-colors shadow-subtle flex items-center justify-center gap-2"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
