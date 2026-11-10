import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, User, X } from 'lucide-react';
import { Resident } from '@/types';
import { cn } from '@/lib/utils';

interface SearchableComboboxProps {
  residents: Resident[];
  selectedResident: Resident | null;
  onSelect: (resident: Resident | null) => void;
  disabled?: boolean;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  residents,
  selectedResident,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredResidents = residents.filter((r) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || r.hallway.toLowerCase().includes(q);
  });

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSelect = (r: Resident) => {
    onSelect(r);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Selected Box / Toggle button */}
      <div
        onClick={handleOpen}
        className={cn(
          'w-full min-h-[46px] px-3.5 py-2.5 rounded-subtle border bg-white flex items-center justify-between gap-2 cursor-pointer transition-all duration-150 shadow-subtle',
          isOpen ? 'ring-2 ring-primary/20 border-primary' : 'border-slate-300 hover:border-slate-400',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-50'
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <User className="w-4 h-4" />
          </div>
          {selectedResident ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-slate-900 truncate">{selectedResident.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {selectedResident.hallway}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 font-normal text-sm">
              Cari & pilih nama dari daftar...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedResident && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
              title="Hapus pilihan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-subtle shadow-elevated z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ketik untuk mencari nama..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1">
            {filteredResidents.length > 0 ? (
              filteredResidents.map((r) => {
                const isSelected = selectedResident?.id === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelect(r)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-md text-sm flex items-center justify-between transition-colors',
                      isSelected
                        ? 'bg-blue-50/80 text-blue-900 font-medium'
                        : 'hover:bg-slate-100 text-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="truncate">{r.name}</div>
                      <span
                        className={cn(
                          'text-[11px] px-2 py-0.5 rounded font-medium',
                          r.hallway === 'Lorong 3'
                            ? 'bg-sky-50 text-sky-700 border border-sky-100'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        )}
                      >
                        {r.hallway}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-sm text-slate-500">
                Nama tidak ditemukan dalam database.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
