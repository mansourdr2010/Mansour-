import React, { useMemo, useState } from 'react';
import { useOncology } from '../context/OncologyContext';
import {
  Calendar,
  CheckCircle2,
  FileText,
  ChevronRight,
  Pill,
  ShieldAlert,
  Syringe,
} from 'lucide-react';
import {
  formatClinicalDate,
  filterAppointmentsByDateRange,
  isAppointmentMissed,
  getSundayWeekRanges,
  getTodayDateString,
  calculateAgeFromDob,
  formatRegimenNameWithoutDuplicate,
  formatAppointmentScheduleLabel,
  isIntrathecalDrug,
} from '../utils/oncologyUtils';

export const DateRangeChemoSchedule: React.FC = () => {
  const {
    patients,
    scheduleStartDate,
    setScheduleStartDate,
    scheduleEndDate,
    setScheduleEndDate,
    setSelectedPatientId,
    markAppointmentAdministered,
    markAppointmentDelayed,
    markAppointmentMissed,
    rescheduleAppointment,
    setIsNewAppointmentOpen,
    setIsPrintModalOpen,
  } = useOncology();

  // Sunday-based week ranges calculated from the current real date of the day
  const todayStr = useMemo(() => getTodayDateString(), []);
  const weekRanges = useMemo(() => getSundayWeekRanges(todayStr), [todayStr]);

  // Inline action state (e.g. for delaying or rescheduling an appointment)
  const [activeActionApptId, setActiveActionApptId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'delay' | 'reschedule' | 'missed' | null>(null);
  const [actionReason, setActionReason] = useState<string>('');
  const [actionNewDate, setActionNewDate] = useState<string>(todayStr);

  // Filtered appointments: ONLY search in patients on active treatment ('On Treatment'), no diagnosis or status filters
  const scheduledItems = useMemo(() => {
    return filterAppointmentsByDateRange(
      patients,
      scheduleStartDate,
      scheduleEndDate,
      'All', // No diagnosis filter
      'All', // No chemo status filter
      'On Treatment' // Strictly only patients on active treatment
    );
  }, [patients, scheduleStartDate, scheduleEndDate]);

  // Statistics for this date range
  const rangeStats = useMemo(() => {
    const total = scheduledItems.length;
    const administered = scheduledItems.filter((i) => i.appointment.status === 'Administered').length;
    const scheduled = scheduledItems.filter(
      (i) => i.appointment.status === 'Scheduled' && !isAppointmentMissed(i.appointment)
    ).length;
    const missed = scheduledItems.filter((i) => isAppointmentMissed(i.appointment)).length;
    const delayed = scheduledItems.filter((i) => i.appointment.status === 'Delayed').length;
    const uniquePatients = new Set(scheduledItems.map((i) => i.patient.id)).size;

    return { total, administered, scheduled, missed, delayed, uniquePatients };
  }, [scheduledItems]);

  const handleExecuteAction = () => {
    if (!activeActionApptId) return;

    if (actionType === 'delay') {
      markAppointmentDelayed(activeActionApptId, actionReason || 'Clinical hold (ANC/Infection)', actionNewDate);
    } else if (actionType === 'reschedule') {
      rescheduleAppointment(activeActionApptId, actionNewDate);
    } else if (actionType === 'missed') {
      markAppointmentMissed(activeActionApptId, actionReason || 'Patient absent');
    }

    setActiveActionApptId(null);
    setActionType(null);
    setActionReason('');
  };

  const isThisWeekActive =
    scheduleStartDate === weekRanges.thisWeek.start && scheduleEndDate === weekRanges.thisWeek.end;
  const isFollowingWeekActive =
    scheduleStartDate === weekRanges.nextWeek.start && scheduleEndDate === weekRanges.nextWeek.end;

  return (
    <div className="space-y-6">
      {/* Date Range & Controls Header - Crisp Light Theme */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Chemo Schedule</h2>
          </div>

          {/* Quick Date Presets: This Week & Following Week (starting on Sunday) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold mr-1">Quick Presets (Sun–Sat):</span>
            <button
              type="button"
              onClick={() => {
                setScheduleStartDate(weekRanges.thisWeek.start);
                setScheduleEndDate(weekRanges.thisWeek.end);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                isThisWeekActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              This Week ({formatClinicalDate(weekRanges.thisWeek.start)} – {formatClinicalDate(weekRanges.thisWeek.end)})
            </button>

            <button
              type="button"
              onClick={() => {
                setScheduleStartDate(weekRanges.nextWeek.start);
                setScheduleEndDate(weekRanges.nextWeek.end);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                isFollowingWeekActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              Following Week ({formatClinicalDate(weekRanges.nextWeek.start)} – {formatClinicalDate(weekRanges.nextWeek.end)})
            </button>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={scheduleStartDate}
              onChange={(e) => setScheduleStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={scheduleEndDate}
              onChange={(e) => setScheduleEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Action strip: Printable View as PDF Form + Schedule counts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-700 font-medium">
            <span>
              Sessions: <strong className="font-mono text-slate-900">{scheduledItems.length}</strong> ({rangeStats.uniquePatients} Patients)
            </span>
            <span aria-hidden="true" className="text-slate-300">|</span>
            <span className="text-teal-700 font-semibold">
              {rangeStats.scheduled} pending
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-emerald-700 font-semibold">
              {rangeStats.administered} administered
            </span>
            {rangeStats.missed > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-amber-700 font-bold">
                  {rangeStats.missed} missed/overdue
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Chemotherapy Schedule (PDF)"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Items List */}
      {scheduledItems.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-900 shadow-2xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            No active chemotherapy sessions scheduled for this period
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            From {formatClinicalDate(scheduleStartDate)} to {formatClinicalDate(scheduleEndDate)}.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setScheduleStartDate(weekRanges.thisWeek.start);
                setScheduleEndDate(weekRanges.thisWeek.end);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 cursor-pointer"
            >
              View This Week
            </button>
            <button
              type="button"
              onClick={() => {
                setScheduleStartDate(weekRanges.nextWeek.start);
                setScheduleEndDate(weekRanges.nextWeek.end);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 cursor-pointer"
            >
              View Following Week
            </button>
            <button
              type="button"
              onClick={() => setIsNewAppointmentOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              + Schedule Session
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {scheduledItems.map(({ patient, appointment }) => {
            const isMissed = isAppointmentMissed(appointment);
            const isToday = appointment.scheduledDate === todayStr;
            const isActionOpen = activeActionApptId === appointment.id;
            const ageInfo = calculateAgeFromDob(patient.dateOfBirth, todayStr);

            return (
              <div
                key={appointment.id}
                className={`bg-white rounded-xl border-2 p-4 sm:p-5 transition-all text-slate-900 shadow-2xs ${
                  isMissed
                    ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400/40'
                    : isToday
                    ? 'border-blue-600 ring-2 ring-blue-500/30'
                    : 'border-blue-500 hover:border-blue-600'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Date & Patient Info */}
                  <div className="space-y-2 lg:max-w-xs xl:max-w-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-md font-mono ${
                            isToday
                              ? 'bg-blue-600 text-white'
                              : isMissed
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {formatClinicalDate(appointment.scheduledDate)}
                        </span>
                        {isToday && (
                          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                            TODAY
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedPatientId(patient.id)}
                        className="px-2.5 py-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                        title="Open Patient Full Chart"
                      >
                        <span>Patient Chart</span>
                        <ChevronRight className="w-3.5 h-3.5 text-teal-700" />
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          onClick={() => setSelectedPatientId(patient.id)}
                          className="text-base font-bold text-slate-900 hover:text-teal-700 cursor-pointer transition-colors"
                        >
                          {patient.name}
                        </h3>
                        <span className="text-xs font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          MRN: {patient.mrn}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 font-medium">
                        Age: <strong className="text-slate-900 font-semibold">{patient.ageYears} yrs</strong> ({ageInfo.displayText}, {patient.gender})
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        ID: <strong className="font-mono text-slate-800">{patient.nationalId || patient.mrn}</strong>{patient.stage && patient.stage !== 'N/A' ? <> · <span className="font-mono font-bold text-slate-700">{patient.stage}</span></> : null}
                      </div>
                    </div>

                    <div className="text-xs text-slate-700">
                      <div className="font-bold text-slate-900">{patient.diagnosis}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Protocol: {patient.protocol} · Line: {patient.lineAccess?.split(' ')[0] || 'Port'}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Regimen, Drugs, Schedule Phase/Cycle/Week, and Remarks */}
                  <div className="flex-1 space-y-2.5 lg:border-l lg:border-slate-200 lg:pl-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 max-w-full">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-900 rounded-md text-xs font-mono font-extrabold border border-blue-300 shadow-2xs break-words">
                          {formatAppointmentScheduleLabel(appointment, patient.diagnosis)}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 break-words">
                          {formatRegimenNameWithoutDuplicate(
                            appointment.regimenName,
                            appointment.cycleNumber,
                            appointment.dayInCycle,
                            appointment.phaseName
                          )}
                        </h4>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          appointment.status === 'Administered'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isMissed
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                            : appointment.status === 'Delayed'
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {isMissed && appointment.status !== 'Missed' ? 'Missed / Overdue' : appointment.status}
                      </span>
                    </div>

                    {/* Prescribed Chemotherapy Drugs (Names Only) */}
                    {appointment.drugs.length > 0 && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Pill className="w-3 h-3 text-teal-600" />
                          Prescribed Chemotherapy Drugs
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          {appointment.drugs.map((drug, idx) => {
                            const isIT = isIntrathecalDrug(drug.name);
                            return (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs shadow-2xs ${
                                  isIT
                                    ? 'font-bold text-slate-900 bg-teal-50 border border-teal-300'
                                    : 'font-medium text-slate-800 bg-white border border-slate-200'
                                }`}
                              >
                                {isIT ? (
                                  <>
                                    <Syringe className="w-3 h-3 text-teal-600" />
                                    <span>{drug.name}</span>
                                    <span className="text-[9px] px-1 py-0.2 bg-teal-200 text-teal-900 rounded font-bold uppercase tracking-wider">IT</span>
                                  </>
                                ) : (
                                  <span>• {drug.name}</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Clinical Remarks & Special Precautions */}
                    <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-xs text-amber-950">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-0.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                        Clinical Remarks & Safety Precautions:
                      </div>
                      <p className="text-amber-900 font-normal leading-relaxed">{appointment.remarks || 'Standard chemotherapy precautions apply.'}</p>

                      {appointment.delayReason && (
                        <div className="mt-1 text-xs text-orange-900 font-semibold">
                          <strong>Delay Reason:</strong> {appointment.delayReason}
                        </div>
                      )}
                      {appointment.missedReason && (
                        <div className="mt-1 text-xs text-amber-900 font-semibold">
                          <strong>Missed Session Context:</strong> {appointment.missedReason}
                        </div>
                      )}
                      {appointment.administeredAt && (
                        <div className="mt-1 text-xs text-emerald-800 font-semibold">
                          <strong>Administered:</strong> {formatClinicalDate(appointment.administeredAt.slice(0, 10))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="w-full lg:w-36 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                    <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 w-full">
                      {appointment.status !== 'Administered' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => markAppointmentAdministered(appointment.id)}
                            className="w-full px-2 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer truncate"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Received</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionApptId(appointment.id);
                              setActionType('reschedule');
                              setActionNewDate(appointment.scheduledDate);
                            }}
                            className="w-full px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer text-center truncate"
                          >
                            Reschedule
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionApptId(appointment.id);
                              setActionType('delay');
                              setActionNewDate(appointment.scheduledDate);
                            }}
                            className="w-full px-2 py-1.5 text-xs font-semibold text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-300 rounded-lg transition-colors cursor-pointer text-center truncate"
                          >
                            Hold / Delay
                          </button>

                          {isMissed && appointment.status !== 'Missed' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionApptId(appointment.id);
                                setActionType('missed');
                              }}
                              className="col-span-3 lg:col-span-1 w-full px-2 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Flag Missed
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="col-span-3 lg:col-span-1 flex items-center justify-center lg:justify-start gap-1 text-xs font-bold text-emerald-700 py-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Administered
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Action Form Modal Drawer */}
                {isActionOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-3.5 rounded-xl space-y-3 text-slate-900">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 uppercase tracking-wide">
                        {actionType === 'delay'
                          ? 'Document Clinical Hold / Treatment Delay'
                          : actionType === 'reschedule'
                          ? 'Reschedule Chemotherapy Session'
                          : 'Document Missed Session'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveActionApptId(null);
                          setActionType(null);
                        }}
                        className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {(actionType === 'delay' || actionType === 'reschedule') && (
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">New Scheduled Date</label>
                          <input
                            type="date"
                            value={actionNewDate}
                            onChange={(e) => setActionNewDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-mono"
                          />
                        </div>
                      )}

                      <div className={actionType === 'missed' ? 'sm:col-span-2' : ''}>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Clinical Reason / Context
                        </label>
                        <input
                          type="text"
                          placeholder={
                            actionType === 'delay'
                              ? 'e.g., Delayed 5 days for ANC recovery (ANC 0.32)'
                              : actionType === 'reschedule'
                              ? 'e.g., Moved to Thursday morning'
                              : 'e.g., Caregiver missed transportation'
                          }
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveActionApptId(null);
                          setActionType(null);
                        }}
                        className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteAction}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs cursor-pointer"
                      >
                        Confirm & Update Record
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
