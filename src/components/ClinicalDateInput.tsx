import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface ClinicalDateInputProps {
  value: string; // ISO date string: YYYY-MM-DD
  onChange: (isoDate: string) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
  max?: string;
  min?: string;
}

/**
 * Converts ISO "YYYY-MM-DD" to clinical "DD/MM/YYYY"
 */
function isoToClinical(isoStr?: string): string {
  if (!isoStr) return '';
  const clean = isoStr.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (y && m && d) {
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }
  return isoStr;
}

/**
 * Converts clinical "DD/MM/YYYY" or "DDMMYYYY" to ISO "YYYY-MM-DD"
 */
function clinicalToIso(displayStr: string): string | null {
  if (!displayStr) return null;
  const digits = displayStr.replace(/[^0-9]/g, '');
  if (digits.length !== 8) return null;

  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Clinical Date Input component that strictly displays and accepts "DD/MM/YYYY" (Day/Month/Year).
 * Guarantees DD/MM/YYYY display regardless of browser/system locale, while syncing ISO strings with state.
 */
export const ClinicalDateInput: React.FC<ClinicalDateInputProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  id,
  className = '',
  placeholder = 'DD/MM/YYYY',
  max,
  min,
}) => {
  const [displayText, setDisplayText] = useState(() => isoToClinical(value));
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Sync display text when value prop changes from outside
  useEffect(() => {
    setDisplayText(isoToClinical(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digits = rawVal.replace(/[^0-9]/g, '').slice(0, 8);

    // Format with slashes as user types
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    setDisplayText(formatted);

    // If 8 digits entered and valid date, emit ISO
    if (digits.length === 8) {
      const iso = clinicalToIso(formatted);
      if (iso) {
        onChange(iso);
      }
    }
  };

  const handleBlur = () => {
    // If empty and not required, clear
    if (!displayText.trim()) {
      if (!required) {
        onChange('');
      } else {
        setDisplayText(isoToClinical(value));
      }
      return;
    }

    // Try to parse
    const iso = clinicalToIso(displayText);
    if (iso) {
      onChange(iso);
      setDisplayText(isoToClinical(iso));
    } else {
      // Revert to current valid value
      setDisplayText(isoToClinical(value));
    }
  };

  const handleCalendarClick = () => {
    if (disabled) return;
    try {
      if (hiddenInputRef.current && typeof hiddenInputRef.current.showPicker === 'function') {
        hiddenInputRef.current.showPicker();
      } else {
        hiddenInputRef.current?.focus();
        hiddenInputRef.current?.click();
      }
    } catch {
      hiddenInputRef.current?.focus();
      hiddenInputRef.current?.click();
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        id={id}
        inputMode="numeric"
        required={required}
        disabled={disabled}
        value={displayText}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full p-2 pr-9 border border-slate-300 rounded-lg font-mono text-xs bg-white text-slate-900 focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400 ${className}`}
      />

      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={handleCalendarClick}
        className="absolute right-2 p-1 text-slate-400 hover:text-teal-600 transition-colors rounded cursor-pointer disabled:opacity-50"
        title="Open calendar picker"
        aria-label="Open calendar picker"
      >
        <Calendar className="w-4 h-4" />
      </button>

      {/* Hidden native date input for calendar popup */}
      <input
        ref={hiddenInputRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        value={value ? value.slice(0, 10) : ''}
        max={max}
        min={min}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
            setDisplayText(isoToClinical(e.target.value));
          }
        }}
        className="sr-only pointer-events-none"
      />
    </div>
  );
};
