import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  placeholder,
  className = '',
  disabled = false,
  required = false,
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    const current = Number.isFinite(value) ? value : min;
    const next = current - step;
    if (min !== undefined && next < min) {
      onChange(min);
      return;
    }
    onChange(next);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    const current = Number.isFinite(value) ? value : min;
    const next = current + step;
    if (max !== undefined && next > max) {
      onChange(max);
      return;
    }
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(min);
      return;
    }
    let parsed = parseInt(raw, 10);
    if (isNaN(parsed)) parsed = min;
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;
    onChange(parsed);
  };

  const canDecrement = !disabled && (min === undefined || value > min);
  const canIncrement = !disabled && (max === undefined || value < max);

  return (
    <div
      className={`inline-flex items-stretch border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={!canDecrement}
        aria-label="Decrease number"
        title="Decrease (-1)"
        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-slate-50 text-slate-700 border-r border-slate-300 transition-colors flex items-center justify-center shrink-0 active:bg-slate-200 cursor-pointer disabled:cursor-not-allowed select-none touch-manipulation"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <input
        type="number"
        min={min}
        max={max}
        required={required}
        value={Number.isFinite(value) ? value : min}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-w-12 text-center font-mono font-bold text-xs bg-white text-slate-900 focus:outline-none py-1.5 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={!canIncrement}
        aria-label="Increase number"
        title="Increase (+1)"
        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-slate-50 text-slate-700 border-l border-slate-300 transition-colors flex items-center justify-center shrink-0 active:bg-slate-200 cursor-pointer disabled:cursor-not-allowed select-none touch-manipulation"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
