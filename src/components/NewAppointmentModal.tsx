import React, { useState, useEffect, useMemo } from 'react';
import { useOncology } from '../context/OncologyContext';
import { ChemotherapyAppointment, ChemotherapyDrug, ScheduleTrackingType, STANDARD_CHEMOTHERAPY_DRUGS } from '../types/oncology';
import { X, Calendar, Plus, Trash2, ShieldAlert, Stethoscope, CheckCircle2, Layers, Pill, Syringe, Minus, Check } from 'lucide-react';
import {
  isALLDiagnosis,
  getPatientTreatmentPhases,
  isIntrathecalDrug,
  getSundayWeekRanges,
  getTodayDateString,
  addDaysToIso,
  formatClinicalDate,
} from '../utils/oncologyUtils';
import { ClinicalDateInput } from './ClinicalDateInput';
import { NumberStepper } from './NumberStepper';

export const NewAppointmentModal: React.FC = () => {
  const {
    isNewAppointmentOpen,
    setIsNewAppointmentOpen,
    newAppointmentPatientId,
    setNewAppointmentPatientId,
    patients,
    addAppointment,
  } = useOncology();

  const [selectedPatId, setSelectedPatId] = useState<string>(
    newAppointmentPatientId || (patients.length > 0 ? patients[0].id : '')
  );

  useEffect(() => {
    if (newAppointmentPatientId) {
      setSelectedPatId(newAppointmentPatientId);
    } else if (patients.length > 0 && !selectedPatId) {
      setSelectedPatId(patients[0].id);
    }
  }, [newAppointmentPatientId, patients]);

  const targetPatient = patients.find((p) => p.id === selectedPatId) || patients[0];
  const isFollowUp = targetPatient?.status === 'Under Follow up';
  const isALL = isALLDiagnosis(targetPatient?.diagnosis);

  // Available phases for ALL patient (previously entered phases + protocol phases)
  const availablePhases = useMemo(() => getPatientTreatmentPhases(targetPatient), [targetPatient]);

  // Today's real date of the day and Sunday-based week ranges
  const todayStr = useMemo(() => getTodayDateString(), []);
  const weekRanges = useMemo(() => getSundayWeekRanges(todayStr), [todayStr]);

  const [scheduledDate, setScheduledDate] = useState(todayStr);
  const [intervalDays, setIntervalDays] = useState<number>(14);
  const [scheduleFollowingAlso, setScheduleFollowingAlso] = useState<boolean>(false);

  const [scheduleType, setScheduleType] = useState<ScheduleTrackingType>(
    isALL ? 'Phase' : 'Cycle'
  );
  const [phaseName, setPhaseName] = useState<string>('Induction');
  const [customPhase, setCustomPhase] = useState<string>('');
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [cycleNumber, setCycleNumber] = useState(targetPatient?.currentCycle || 1);
  const [dayInCycle, setDayInCycle] = useState(1);

  const isALLMaintenance =
    isALL &&
    phaseName.toLowerCase().includes('maintenance') &&
    !phaseName.toLowerCase().includes('interim');
  const [remarks, setRemarks] = useState('');

  // Auto update scheduleType and phaseName if switching to an ALL leukemia patient
  useEffect(() => {
    if (isALL) {
      setScheduleType('Phase');
      if (availablePhases.length > 0) {
        const currentClean = targetPatient?.treatmentStageOrPhase?.replace(/\s*\(.*?\)/, '').trim();
        if (currentClean && availablePhases.includes(currentClean)) {
          setPhaseName(currentClean);
        } else {
          setPhaseName(availablePhases[0]);
        }
      }
    }
  }, [selectedPatId, isALL, availablePhases, targetPatient]);

  // Drug list initialized empty so user enters medications themselves
  const [drugs, setDrugs] = useState<ChemotherapyDrug[]>([]);

  // Ensure drugs and remarks always start empty whenever the modal opens (no pre-added clutter)
  useEffect(() => {
    if (isNewAppointmentOpen) {
      setDrugs([]);
      setRemarks('');
      setScheduledDate(todayStr);
      setScheduleFollowingAlso(false);
    }
  }, [isNewAppointmentOpen, todayStr]);

  if (!isNewAppointmentOpen) return null;

  const handleAddDrug = () => {
    setDrugs((prev) => [...prev, { name: '' }]);
  };

  const handleRemoveDrug = (index: number) => {
    setDrugs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyInterval = (days: number) => {
    setIntervalDays(days);
    setScheduledDate(addDaysToIso(todayStr, days));
  };

  // Get day of week name for scheduledDate
  const getDayOfWeekName = (isoDate: string) => {
    try {
      const parts = isoDate.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
    } catch {
      return '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatId) return;

    if (isFollowUp) {
      // Follow-up appointment: ONLY Date of scheduled visit for outpatient clinic review of investigation and clinical assessment
      const followUpAppt: ChemotherapyAppointment = {
        id: `apt-${Date.now()}`,
        patientId: selectedPatId,
        patientName: targetPatient?.name,
        mrn: targetPatient?.mrn,
        diagnosis: targetPatient?.diagnosis,
        scheduledDate,
        regimenName: 'Outpatient Clinic Review of Investigation and Clinical Assessment',
        cycleNumber: 1,
        dayInCycle: 1,
        remarks: remarks.trim(),
        status: 'Scheduled',
        drugs: [],
      };

      addAppointment(followUpAppt);
    } else {
      const finalScheduleType = isALL ? 'Phase' : scheduleType;
      const finalPhaseName =
        finalScheduleType === 'Phase'
          ? (phaseName === 'Other' ? customPhase.trim() : phaseName)
          : undefined;

      const validDrugs = drugs
        .filter((d) => d.name.trim() !== '')
        .map((d) => ({ name: d.name.trim() }));

      const computedRegimenName =
        validDrugs.length > 0
          ? validDrugs.map((d) => d.name).join(' + ')
          : (finalPhaseName || (finalScheduleType === 'Week' ? `Week ${weekNumber}` : `Cycle ${cycleNumber || 1}`));

      const newAppt: ChemotherapyAppointment = {
        id: `apt-${Date.now()}`,
        patientId: selectedPatId,
        patientName: targetPatient?.name,
        mrn: targetPatient?.mrn,
        diagnosis: targetPatient?.diagnosis,
        scheduledDate,
        scheduleType: finalScheduleType,
        phaseName: finalPhaseName,
        weekNumber: finalScheduleType === 'Week' ? weekNumber : undefined,
        regimenName: computedRegimenName,
        cycleNumber: isALL ? (isALLMaintenance ? (cycleNumber || 1) : 1) : (cycleNumber || 1),
        dayInCycle: finalScheduleType === 'Week' ? 1 : dayInCycle,
        remarks: remarks.trim(),
        status: 'Scheduled',
        drugs: validDrugs,
      };

      addAppointment(newAppt);

      // If user chose to automatically schedule the following session with interval:
      if (scheduleFollowingAlso && intervalDays > 0) {
        const nextDate = addDaysToIso(scheduledDate, intervalDays);
        const nextCycleNum = (cycleNumber || 1) + 1;
        const followingAppt: ChemotherapyAppointment = {
          ...newAppt,
          id: `apt-${Date.now() + 1}`,
          scheduledDate: nextDate,
          cycleNumber: isALL ? (isALLMaintenance ? nextCycleNum : 1) : nextCycleNum,
          remarks: `${remarks.trim() ? `${remarks.trim()} · ` : ''}Following session auto-scheduled (+${intervalDays} days)`,
        };
        addAppointment(followingAppt);
      }
    }

    setDrugs([]);
    setRemarks('');
    setIsNewAppointmentOpen(false);
    setNewAppointmentPatientId(null);
  };

  const isThisWeekChosen = scheduledDate >= weekRanges.thisWeek.start && scheduledDate <= weekRanges.thisWeek.end;
  const isFollowingWeekChosen = scheduledDate >= weekRanges.nextWeek.start && scheduledDate <= weekRanges.nextWeek.end;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto text-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isFollowUp ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}`}>
              {isFollowUp ? <Stethoscope className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isFollowUp ? 'Schedule Outpatient Clinic Follow-up' : 'Schedule Chemotherapy Appointment'}
              </h2>
              <p className="text-xs text-slate-500">
                {targetPatient && newAppointmentPatientId ? (
                  <span>
                    Patient: <strong className="text-slate-800">{targetPatient.name}</strong> (MRN: {targetPatient.mrn}) · {targetPatient.diagnosis}
                  </span>
                ) : isFollowUp ? (
                  'Outpatient clinic appointment for review of investigation and clinical assessment'
                ) : (
                  'Book protocol cycle, infusion date, and chemotherapy agents'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsNewAppointmentOpen(false);
              setNewAppointmentPatientId(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-900">
          {/* Patient Selector - hidden when launched for a specific patient */}
          {!newAppointmentPatientId && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
              <select
                value={selectedPatId}
                onChange={(e) => setSelectedPatId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              >
                {patients.map((pat) => (
                  <option key={pat.id} value={pat.id} className="bg-white text-slate-900">
                    {pat.name} ({pat.mrn}) — {pat.diagnosis} [{pat.status === 'Under Follow up' ? 'Follow-up' : 'Treatment'}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If Follow-Up Patient: Dedicated Clean Outpatient Clinic View */}
          {isFollowUp ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <strong className="text-emerald-900 font-bold text-xs uppercase tracking-wide">
                    Follow-up Surveillance Clinic Visit
                  </strong>
                </div>
                <p className="text-emerald-800 text-xs">
                  Appointment in outpatient clinic for <strong>review of investigation and clinical assessment</strong>.
                </p>
              </div>

              {/* ONLY Field Required: Date of Scheduled Visit */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs flex items-center justify-between">
                  <span>Date of Scheduled Visit *</span>
                  <span className="text-[10px] text-slate-500 font-mono font-normal">DD/MM/YYYY</span>
                </label>
                <ClinicalDateInput
                  required
                  value={scheduledDate}
                  onChange={(d) => setScheduledDate(d)}
                />
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  {formatClinicalDate(scheduledDate)} ({getDayOfWeekName(scheduledDate)})
                </div>
              </div>
            </div>
          ) : (
            /* On Treatment: Chemotherapy Appointment Details */
            <>
              {/* Scheduled Chemotherapy Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Scheduled Chemotherapy Date *</span>
                  <span className="text-[10px] text-slate-500 font-mono">DD/MM/YYYY</span>
                </label>
                <div className={isALLMaintenance ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
                  <ClinicalDateInput
                    required
                    value={scheduledDate}
                    onChange={(d) => setScheduledDate(d)}
                  />
                  {isALLMaintenance && (
                    <div>
                      <NumberStepper
                        min={1}
                        max={36}
                        required
                        value={cycleNumber}
                        onChange={(val) => setCycleNumber(val)}
                        placeholder="Maintenance Cycle #"
                        className="w-full border-blue-400"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* CTH Regimen & Protocol Schedule Tracking */}
              <div className="space-y-3">
                {/* Protocol Schedule Tracking Unit */}
                {isALL ? (
                  /* ALL Patients: Chemotherapy phases NOT cycles */
                  <div className="space-y-3 bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-700" />
                        <span>CTH regimen (Treatment Phase)</span>
                      </label>
                      <span className="text-[10px] text-blue-700 font-medium">
                        Phases (Induction, Interim Maint., etc.) — No cycles
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Select Treatment Phase (Previously entered & standard phases)
                      </label>
                      <select
                        value={phaseName}
                        onChange={(e) => setPhaseName(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                      >
                        {availablePhases.map((ph) => (
                          <option key={ph} value={ph} className="bg-white text-slate-900">
                            {ph}
                          </option>
                        ))}
                        <option value="Other" className="bg-white text-slate-900">Other / Enter New Treatment Phase...</option>
                      </select>

                      {phaseName === 'Other' && (
                        <input
                          type="text"
                          required
                          placeholder="Enter treatment phase name (e.g. Interim Maintenance 2)"
                          value={customPhase}
                          onChange={(e) => setCustomPhase(e.target.value)}
                          className="mt-2 w-full p-2 border border-blue-400 rounded-lg bg-white text-slate-900 text-xs font-semibold placeholder-slate-400 focus:outline-none"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Day in Phase *
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <NumberStepper
                          min={1}
                          max={120}
                          value={dayInCycle}
                          onChange={(val) => setDayInCycle(val)}
                          className="w-32"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          {[1, 8, 15, 22, 29, 43, 57].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setDayInCycle(d)}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                                dayInCycle === d
                                  ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              Day {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Non-ALL Patients: Choice of Cycles, Weeks, or Phases */
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-900 text-xs">
                        CTH regimen
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Cycles, Weeks, or Protocol Phases
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setScheduleType('Cycle')}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          scheduleType === 'Cycle'
                            ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Cycles
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleType('Phase')}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          scheduleType === 'Phase'
                            ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Phases
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleType('Week')}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          scheduleType === 'Week'
                            ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Weeks
                      </button>
                    </div>

                    {scheduleType === 'Phase' && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-200">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Treatment Phase Name *
                          </label>
                          <select
                            value={phaseName}
                            onChange={(e) => setPhaseName(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                          >
                            {availablePhases.map((ph) => (
                              <option key={ph} value={ph} className="bg-white text-slate-900">
                                {ph}
                              </option>
                            ))}
                            <option value="Other" className="bg-white text-slate-900">Other / Custom Phase Name</option>
                          </select>

                          {phaseName === 'Other' && (
                            <input
                              type="text"
                              placeholder="Enter custom phase name"
                              value={customPhase}
                              onChange={(e) => setCustomPhase(e.target.value)}
                              className="mt-2 w-full p-2 border border-blue-400 rounded-lg bg-white text-slate-900 text-xs font-semibold placeholder-slate-400"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Day in Phase *
                          </label>
                          <NumberStepper
                            min={1}
                            max={120}
                            value={dayInCycle}
                            onChange={(val) => setDayInCycle(val)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}

                    {scheduleType === 'Week' && (
                      <div className="pt-2 border-t border-slate-200">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Week Number *</label>
                          <NumberStepper
                            min={1}
                            max={150}
                            value={weekNumber}
                            onChange={(val) => setWeekNumber(val)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}

                    {scheduleType === 'Cycle' && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Cycle Number *</label>
                          <NumberStepper
                            min={1}
                            max={50}
                            value={cycleNumber}
                            onChange={(val) => setCycleNumber(val)}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Day in Cycle *</label>
                          <NumberStepper
                            min={1}
                            max={90}
                            value={dayInCycle}
                            onChange={(val) => setDayInCycle(val)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Prescribed Chemotherapy Drugs (Only Drug Names, No Doses or Routes) */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-teal-600" />
                      <span>Chemotherapy Drugs (Drug Names Only)</span>
                    </label>
                    <span className="block text-[11px] text-slate-500">
                      Only drug names are required
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDrug}
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer bg-teal-50 hover:bg-teal-100 border border-teal-300 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Drug Name
                  </button>
                </div>

                {/* Quick Add Presets: Arranged alphabetically */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      Quick Add Drug (Alphabetical A–Z):
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {STANDARD_CHEMOTHERAPY_DRUGS.map((drugName) => {
                      const isIT = isIntrathecalDrug(drugName);
                      const isChosen = drugs.some(
                        (d) => d.name.toLowerCase().trim() === drugName.toLowerCase().trim()
                      );
                      return (
                        <button
                          key={drugName}
                          type="button"
                          onClick={() => {
                            if (isChosen) {
                              setDrugs(
                                drugs.filter(
                                  (d) => d.name.toLowerCase().trim() !== drugName.toLowerCase().trim()
                                )
                              );
                            } else {
                              if (drugs.length === 1 && !drugs[0].name.trim()) {
                                setDrugs([{ name: drugName }]);
                              } else {
                                setDrugs([...drugs, { name: drugName }]);
                              }
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                            isChosen
                              ? 'bg-teal-600 text-white font-bold shadow-xs ring-2 ring-teal-500/50 border border-teal-700'
                              : isIT
                              ? 'bg-teal-50 text-teal-900 border border-teal-300 hover:bg-teal-100 shadow-2xs font-bold'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 font-medium'
                          }`}
                        >
                          {isChosen ? (
                            <Check className="w-3.5 h-3.5 text-white stroke-[3] shrink-0" />
                          ) : isIT ? (
                            <Syringe className="w-3 h-3 text-teal-600 shrink-0" />
                          ) : (
                            <span className="text-slate-400 font-normal">+</span>
                          )}
                          <span>{drugName}</span>
                          {isIT && !isChosen && (
                            <span className="text-[9px] px-1 py-0.2 bg-teal-200 text-teal-900 rounded font-bold uppercase tracking-wider">
                              IT
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* HTML Datalist for autocomplete */}
                <datalist id="oncology-chemo-drugs-list">
                  {STANDARD_CHEMOTHERAPY_DRUGS.map((drug) => (
                    <option key={drug} value={drug} />
                  ))}
                </datalist>

                {/* Drug Name Input Rows */}
                <div className="space-y-2">
                  {drugs.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 text-xs">
                      No medications added yet. Click <strong className="text-teal-700 font-bold">&quot;+ Add Drug Name&quot;</strong> or pick a drug above.
                    </div>
                  ) : (
                    drugs.map((drug, index) => {
                      const isIT = isIntrathecalDrug(drug.name);
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                            isIT
                              ? 'bg-teal-50/40 border-teal-300 shadow-2xs'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <input
                            type="text"
                            list="oncology-chemo-drugs-list"
                            placeholder="Drug Name (e.g. Vincristine, Methotrexate (HD), Intrathecal (IT))"
                            value={drug.name}
                            onChange={(e) =>
                              setDrugs(
                                drugs.map((d, i) => (i === index ? { name: e.target.value } : d))
                              )
                            }
                            className="flex-1 p-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          {isIT && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-900 bg-teal-100 border border-teal-200 px-2 py-0.5 rounded shrink-0">
                              <Syringe className="w-3 h-3 text-teal-700" />
                              <span>Intrathecal (IT)</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveDrug(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
                            title="Remove drug"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Remarks & Precautions */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  Special Clinical Remarks, Hydration & Safety Precautions
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Urine pH >= 7.0 alkalinization; antiemetic premed; check ANC >= 1.0; mesna uroprotection"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsNewAppointmentOpen(false);
                setNewAppointmentPatientId(null);
              }}
              className="px-4 py-2 text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 font-bold text-white rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                isFollowUp ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isFollowUp ? 'Schedule Follow-up Visit' : 'Schedule Chemotherapy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
