import React, { useState, useEffect } from 'react';
import { ALL_TREATMENT_PHASES, ALL_MAINTENANCE_DAYS } from '../utils/protocolRoadmaps';

export interface ProtocolStageSelectorProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  initialMode?: 'phase' | 'week' | 'cycle' | 'custom';
}

export const ProtocolStageSelector: React.FC<ProtocolStageSelectorProps> = ({
  value,
  onChange,
  label = 'Protocol Stage / Treatment Phase',
  initialMode,
}) => {
  // Infer initial mode from value if not provided
  const inferMode = (val: string): 'phase' | 'week' | 'cycle' | 'custom' => {
    if (initialMode) return initialMode;
    const lower = (val || '').toLowerCase();
    if (lower.includes('week')) return 'week';
    if (lower.includes('cycle')) return 'cycle';
    if (
      lower.includes('induction') ||
      lower.includes('consolidation') ||
      lower.includes('maintenance') ||
      lower.includes('intensification') ||
      lower.includes('phase')
    ) {
      return 'phase';
    }
    return 'phase';
  };

  const [mode, setMode] = useState<'phase' | 'week' | 'cycle' | 'custom'>(() => inferMode(value));

  // Week tracking state
  const [weekNum, setWeekNum] = useState<number>(() => {
    const match = value?.match(/week\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 1;
  });
  const [totalWeeks, setTotalWeeks] = useState<string>(() => {
    const match = value?.match(/of\s*(\d+)/i);
    return match ? match[1] : '52';
  });

  // Cycle tracking state
  const [cycleNum, setCycleNum] = useState<number>(() => {
    const match = value?.match(/cycle\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 1;
  });
  const [totalCycles, setTotalCycles] = useState<string>(() => {
    const match = value?.match(/of\s*(\d+)/i);
    return match ? match[1] : '6';
  });
  const [cycleDay, setCycleDay] = useState<string>(() => {
    const match = value?.match(/day\s*(\d+)/i);
    return match ? match[1] : '';
  });

  // Phase selection state
  const [selectedPhase, setSelectedPhase] = useState<string>(() => {
    for (const p of ALL_TREATMENT_PHASES) {
      if (value?.toLowerCase().includes(p.toLowerCase())) return p;
    }
    return 'Induction';
  });
  const [maintenanceDay, setMaintenanceDay] = useState<number | null>(() => {
    if (value?.toLowerCase().includes('maintenance')) {
      const match = value.match(/day\s*(\d+)/i);
      if (match) {
        const d = parseInt(match[1], 10);
        if (d === 1 || d === 29 || d === 57) return d;
      }
    }
    return null;
  });

  // Sync state when external value changes (e.g. opening different patient in modal)
  useEffect(() => {
    if (!value) return;
    const lower = value.toLowerCase();
    if (lower.includes('week')) {
      setMode('week');
      const match = value.match(/week\s*(\d+)/i);
      if (match) setWeekNum(parseInt(match[1], 10));
      const totMatch = value.match(/of\s*(\d+)/i);
      if (totMatch) setTotalWeeks(totMatch[1]);
    } else if (lower.includes('cycle')) {
      setMode('cycle');
      const match = value.match(/cycle\s*(\d+)/i);
      if (match) setCycleNum(parseInt(match[1], 10));
      const totMatch = value.match(/of\s*(\d+)/i);
      if (totMatch) setTotalCycles(totMatch[1]);
      const dayMatch = value.match(/day\s*(\d+)/i);
      if (dayMatch) setCycleDay(dayMatch[1]);
    } else {
      let matched = false;
      for (const p of ALL_TREATMENT_PHASES) {
        if (lower.includes(p.toLowerCase())) {
          setSelectedPhase(p);
          matched = true;
          break;
        }
      }
      if (matched) {
        setMode('phase');
        if (lower.includes('maintenance')) {
          const match = value.match(/day\s*(\d+)/i);
          if (match) {
            const d = parseInt(match[1], 10);
            if (d === 1 || d === 29 || d === 57) setMaintenanceDay(d);
          }
        }
      } else {
        setMode('custom');
      }
    }
  }, [value]);

  const handleModeChange = (newMode: 'phase' | 'week' | 'cycle' | 'custom') => {
    setMode(newMode);
    if (newMode === 'phase') {
      if (selectedPhase === 'Maintenance Cycles') {
        const stageStr = maintenanceDay
          ? `Maintenance Cycles · Day ${maintenanceDay}`
          : 'Maintenance Cycles';
        onChange(stageStr);
      } else {
        onChange(selectedPhase);
      }
    } else if (newMode === 'week') {
      const stageStr = totalWeeks ? `Week ${weekNum} of ${totalWeeks}` : `Week ${weekNum}`;
      onChange(stageStr);
    } else if (newMode === 'cycle') {
      const dayStr = cycleDay ? ` · Day ${cycleDay}` : '';
      const totalStr = totalCycles ? ` of ${totalCycles}` : '';
      onChange(`Cycle ${cycleNum}${totalStr}${dayStr}`);
    }
  };

  const handlePhaseSelect = (phase: string) => {
    setSelectedPhase(phase);
    if (phase === 'Maintenance Cycles') {
      const stageStr = maintenanceDay
        ? `Maintenance Cycles · Day ${maintenanceDay}`
        : 'Maintenance Cycles';
      onChange(stageStr);
    } else {
      setMaintenanceDay(null);
      onChange(phase);
    }
  };

  const handleMaintenanceDaySelect = (day: number) => {
    setMaintenanceDay(day);
    setSelectedPhase('Maintenance Cycles');
    onChange(`Maintenance Cycles · Day ${day}`);
  };

  const updateWeek = (newWeek: number, newTotal: string) => {
    setWeekNum(newWeek);
    setTotalWeeks(newTotal);
    const stageStr = newTotal.trim() ? `Week ${newWeek} of ${newTotal.trim()}` : `Week ${newWeek}`;
    onChange(stageStr);
  };

  const updateCycle = (newCycle: number, newTotal: string, newDay: string) => {
    setCycleNum(newCycle);
    setTotalCycles(newTotal);
    setCycleDay(newDay);
    const dayStr = newDay.trim() ? ` · Day ${newDay.trim()}` : '';
    const totalStr = newTotal.trim() ? ` of ${newTotal.trim()}` : '';
    onChange(`Cycle ${newCycle}${totalStr}${dayStr}`);
  };

  return (
    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 space-y-2.5">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="font-semibold text-slate-800 text-xs">{label}</label>

        {/* 4 Mode Tabs: Phase, Weeks, Cycles, Custom */}
        <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold shadow-inner">
          <button
            type="button"
            onClick={() => handleModeChange('phase')}
            className={`px-3 py-1 rounded-md transition-all text-xs ${
              mode === 'phase'
                ? 'bg-teal-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            Phase
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('week')}
            className={`px-3 py-1 rounded-md transition-all text-xs ${
              mode === 'week'
                ? 'bg-teal-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            Weeks
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('cycle')}
            className={`px-3 py-1 rounded-md transition-all text-xs ${
              mode === 'cycle'
                ? 'bg-teal-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            Cycles
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('custom')}
            className={`px-3 py-1 rounded-md transition-all text-xs ${
              mode === 'custom'
                ? 'bg-teal-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Mode Sub-panels */}
      {/* 1. Phase Selection Panel */}
      {mode === 'phase' && (
        <div className="space-y-2 bg-white p-2.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-600 block">
            Choose Treatment Phase:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TREATMENT_PHASES.map((p) => {
              const isSelected = selectedPhase === p || value === p || value.startsWith(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePhaseSelect(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-slate-50 hover:bg-teal-50 text-slate-700 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Special Day selector for Maintenance Cycles (Days 1, 29, 57) */}
          {(selectedPhase === 'Maintenance Cycles' || value?.includes('Maintenance')) && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-teal-800">
                Maintenance Cycle Pulse Days:
              </span>
              <div className="flex gap-1.5">
                {ALL_MAINTENANCE_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleMaintenanceDaySelect(day)}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold border transition-colors ${
                      maintenanceDay === day || value?.includes(`Day ${day}`)
                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                        : 'bg-white hover:bg-teal-50 text-teal-900 border-teal-200'
                    }`}
                  >
                    Day {day}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Weeks Input Panel */}
      {mode === 'week' && (
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
          <span className="text-[11px] font-semibold text-slate-600 block">
            Specify Treatment Week:
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {/* Week counter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700">Week:</span>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => updateWeek(Math.max(1, weekNum - 1), totalWeeks)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={250}
                  value={weekNum}
                  onChange={(e) => updateWeek(parseInt(e.target.value, 10) || 1, totalWeeks)}
                  className="w-14 text-center py-1 text-xs font-bold text-teal-950 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => updateWeek(weekNum + 1, totalWeeks)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total weeks */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">of</span>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                <input
                  type="number"
                  min={1}
                  max={250}
                  placeholder="Total (e.g. 52)"
                  value={totalWeeks}
                  onChange={(e) => updateWeek(weekNum, e.target.value)}
                  className="w-20 px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-400">(optional)</span>
            </div>

            {/* Quick total week shortcuts */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400">Total:</span>
              <button
                type="button"
                onClick={() => updateWeek(weekNum, '52')}
                className={`px-2 py-0.5 rounded border ${
                  totalWeeks === '52'
                    ? 'bg-teal-600 text-white border-teal-600 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                52 wks
              </button>
              <button
                type="button"
                onClick={() => updateWeek(weekNum, '104')}
                className={`px-2 py-0.5 rounded border ${
                  totalWeeks === '104'
                    ? 'bg-teal-600 text-white border-teal-600 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                104 wks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Cycles Input Panel */}
      {mode === 'cycle' && (
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
          <span className="text-[11px] font-semibold text-slate-600 block">
            Specify Treatment Cycle & Day:
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {/* Cycle Counter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700">Cycle:</span>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => updateCycle(Math.max(1, cycleNum - 1), totalCycles, cycleDay)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={cycleNum}
                  onChange={(e) =>
                    updateCycle(parseInt(e.target.value, 10) || 1, totalCycles, cycleDay)
                  }
                  className="w-12 text-center py-1 text-xs font-bold text-teal-950 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => updateCycle(cycleNum + 1, totalCycles, cycleDay)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total cycles */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">of</span>
              <input
                type="number"
                min={1}
                max={50}
                placeholder="Total (e.g. 6)"
                value={totalCycles}
                onChange={(e) => updateCycle(cycleNum, e.target.value, cycleDay)}
                className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
              />
            </div>

            {/* Day in cycle */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700">Day:</span>
              <input
                type="number"
                min={1}
                max={84}
                placeholder="Day (e.g. 1)"
                value={cycleDay}
                onChange={(e) => updateCycle(cycleNum, totalCycles, e.target.value)}
                className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
              />
            </div>

            {/* Common days quick selection */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400">Day:</span>
              {[1, 8, 15, 21, 29].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updateCycle(cycleNum, totalCycles, String(d))}
                  className={`px-1.5 py-0.5 rounded border text-[11px] ${
                    cycleDay === String(d)
                      ? 'bg-teal-600 text-white border-teal-600 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Custom Mode */}
      {mode === 'custom' && (
        <div className="pt-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter custom protocol stage (e.g. Interim Maintenance, Re-induction)"
            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-teal-950 bg-white shadow-2xs focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
      )}
    </div>
  );
};
