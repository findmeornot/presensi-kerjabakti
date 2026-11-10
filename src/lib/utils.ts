import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';
  } catch {
    return dateTimeStr;
  }
}

export function formatTimeShort(timeStr: string): string {
  if (!timeStr) return '';
  return timeStr.includes('WIB') ? timeStr : `${timeStr} WIB`;
}
