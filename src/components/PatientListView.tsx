import React, { useMemo } from 'react';
import { useOncology } from '../context/OncologyContext';
import { Patient, FollowUpStatus } from '../types/oncology';
import {
  Layers,
  ChevronRight,
  ShieldCheck,
  Pill,
  AlertTriangle,
  Clock,
  UserCheck,
  Calendar,
  Search,
  Plus,
  CheckCircle2,
  Check,
  CalendarPlus,
  Activity,
  X,
  HeartHandshake,
  Compass,
  Award,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  CLINICAL_TODAY,
  formatClinicalDate,
  isAppointmentMissed,
  formatRegimenNameWithoutDuplicate,
  formatAppointmentScheduleLabel,
  normalizeDiagnosisDisplay,
  getDiagnosisAbbreviation,
  getPatientColorTheme,
  isALLDiagnosis,
  abbreviateChemoDrugNames,
  normalizeFollowUpBox,
  FOLLOW_UP_BOX_CATEGORIES,
  FollowUpBoxCategory,
  getFollowUpTypeLabel,
} from '../utils/oncologyUtils';

const getLastChemoSchedule = (patient: Patient) => {
  const isALL = isALLDiagnosis(patient.diagnosis);
  const administered = [...patient.appointments]
    .filter((a) => a.status === 'Administered')
    .sort((a, b) => (b.administeredAt || b.scheduledDate).localeCompare(a.administeredAt || a.scheduledDate));
  if (administered.length > 0) {
    const appt = administered[0];
    const phaseName = appt.phaseName || (isALL ? (patient.treatmentStageOrPhase?.replace(/\s*\(.*?\)/, '').trim() || 'Induction') : undefined);
    return {
      regimen: formatRegimenNameWithoutDuplicate(appt.regimenName, appt.cycleNumber, appt.dayInCycle),
      cycle: formatAppointmentScheduleLabel({ ...appt, phaseName }, patient.diagnosis),
      date: appt.administeredAt ? appt.administeredAt.slice(0, 10) : appt.scheduledDate,
    };
  }
  if (patient.lastChemoReceived && patient.lastChemoReceived !== 'None' && patient.lastChemoReceived !== 'None (Treatment naive)') {
    return {
      regimen: patient.lastChemoReceived,
      cycle: '',
      date: patient.lastChemoDate || '',
    };
  }
  const pastAppts = [...patient.appointments]
    .filter((a) => a.scheduledDate <= CLINICAL_TODAY)
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  if (pastAppts.length > 0) {
    const appt = pastAppts[0];
    const phaseName = appt.phaseName || (isALL ? (patient.treatmentStageOrPhase?.replace(/\s*\(.*?\)/, '').trim() || 'Induction') : undefined);
    return {
      regimen: formatRegimenNameWithoutDuplicate(appt.regimenName, appt.cycleNumber, appt.dayInCycle),
      cycle: formatAppointmentScheduleLabel({ ...appt, phaseName }, patient.diagnosis),
      date: appt.scheduledDate,
    };
  }
  return null;
};

const getNextChemoSchedule = (patient: Patient) => {
  const isALL = isALLDiagnosis(patient.diagnosis);
  const upcoming = [...patient.appointments]
    .filter((a) => a.status !== 'Administered')
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  if (upcoming.length > 0) {
    const appt = upcoming[0];
    const phaseName = appt.phaseName || (isALL ? (patient.treatmentStageOrPhase?.replace(/\s*\(.*?\)/, '').trim() || 'Interim Maintenance 1') : undefined);
    return {
      appointment: appt,
      regimen: formatRegimenNameWithoutDuplicate(appt.regimenName, appt.cycleNumber, appt.dayInCycle),
      cycle: formatAppointmentScheduleLabel({ ...appt, phaseName }, patient.diagnosis),
      date: appt.scheduledDate,
      status: appt.status,
    };
  }
  return null;
};

export const PatientListView: React.FC = () => {
  const {
    patients,
    setSelectedPatientId,
    treatmentStatusFilter,
    setTreatmentStatusFilter,
    setIsNewAppointmentOpen,
    setNewAppointmentPatientId,
    setIsAddEventOpen,
    setAddEventPatientId,
    updatePatient,
    markAppointmentAdministered,
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
  } = useOncology();

  const { currentUser } = useAuth();
  const { theme, isDark } = useTheme();

  // Overall Statistics for the 3 selection boxes
  const stats = useMemo(() => {
    const total = patients.length;
    const onTreatment = patients.filter((p) => p.status === 'On Treatment').length;
    const followUp = patients.filter((p) => p.status === 'Under Follow up').length;
    return { total, onTreatment, followUp };
  }, [patients]);

  // Filter patients based strictly on the selected cohort box AND search query across name, MRN, and ID
  const filteredPatients = useMemo(() => {
    let list = patients;
    if (treatmentStatusFilter !== 'All') {
      list = list.filter((p) => p.status === treatmentStatusFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchMrn = p.mrn.toLowerCase().includes(q);
      const matchId = (p.nationalId || '').toLowerCase().includes(q);
      return matchName || matchMrn || matchId;
    });
  }, [patients, treatmentStatusFilter, searchQuery]);

  // Active (On Treatment) patients
  const activePatients = useMemo(() => {
    return filteredPatients.filter((p) => p.status === 'On Treatment');
  }, [filteredPatients]);

  // Follow-up patients
  const followUpPatients = useMemo(() => {
    return filteredPatients.filter((p) => p.status === 'Under Follow up');
  }, [filteredPatients]);

  // Group Active patients by Diagnosis and sort alphabetically
  const activeDiagnosisGroups = useMemo(() => {
    const groups: { [key: string]: Patient[] } = {};
    for (const pat of activePatients) {
      const diagKey = normalizeDiagnosisDisplay(pat.diagnosis);
      if (!groups[diagKey]) {
        groups[diagKey] = [];
      }
      groups[diagKey].push(pat);
    }
    return Object.entries(groups)
      .sort(([diagA], [diagB]) => diagA.localeCompare(diagB))
      .map(([diagnosisName, groupPatients]) => [
        diagnosisName,
        [...groupPatients].sort((a, b) => a.name.localeCompare(b.name)),
      ] as [string, Patient[]]);
  }, [activePatients]);

  // Group Follow-up patients into the 5 dedicated boxes:
  // 1. Regular Follow-up
  // 2. Lost Follow-up
  // 3. Discharged
  // 4. Palliative
  // 5. Died
  const followUpBoxes = useMemo(() => {
    const map: Record<FollowUpBoxCategory, Patient[]> = {
      'Regular Follow-up': [],
      'Lost Follow-up': [],
      'Discharged': [],
      'Palliative': [],
      'Died': [],
    };
    for (const pat of followUpPatients) {
      const cat = normalizeFollowUpBox(pat.followUpStatus);
      map[cat].push(pat);
    }
    for (const cat of FOLLOW_UP_BOX_CATEGORIES) {
      map[cat].sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [followUpPatients]);

  // Render individual patient card
  const renderPatientCard = (patient: Patient) => {
    const missedAppts = patient.appointments.filter((a) => isAppointmentMissed(a));
    const hasMissed = missedAppts.length > 0;
    const isFinished = patient.status === 'Under Follow up';
    const endOfTherapyDate = patient.followUpStartDate || patient.lastChemoDate || patient.treatmentStartDate;

    // Theme: blue outline for on-treatment, green outline for follow-up; white background in light mode
    const colorTheme = getPatientColorTheme(patient, isDark ? 'dark' : 'light');

    return (
      <div
        key={patient.id}
        className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md ${colorTheme.cardBg}`}
      >
        {/* Details: Name, MRN, ID, Age, Diagnosis Abbreviation & Schedules */}
        <div className="space-y-2 flex-1 min-w-0">
          {/* 1st Line: Patient Name, Age next to name, Diagnosis, MRN, ID, Status, Missed */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {/* Patient Name */}
            <h4
              onClick={() => setSelectedPatientId(patient.id)}
              className={`text-base sm:text-lg font-bold cursor-pointer transition-colors ${
                isDark ? 'text-white hover:text-teal-300' : 'text-slate-900 hover:text-teal-700'
              }`}
            >
              {patient.name}
            </h4>

            {/* Patient Age next to name */}
            <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {patient.ageYears} yrs
            </span>

            {/* Diagnosis Abbreviation */}
            <span className={`text-xs font-bold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
              {getDiagnosisAbbreviation(patient.diagnosis)}
              {patient.stage && patient.stage !== 'N/A' ? ` (${patient.stage})` : ''}
            </span>

            {patient.mrn && (
              <span className={`font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                MRN: {patient.mrn}
              </span>
            )}

            {patient.nationalId && (
              <span className={`font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                ID: {patient.nationalId}
              </span>
            )}

            {/* For follow-up patients: Separate box for ended therapy date & separate box for type of follow up */}
            {isFinished && (
              <>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                    isDark
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}
                >
                  Ended: {formatClinicalDate(endOfTherapyDate)}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                    isDark
                      ? 'bg-teal-950/90 text-teal-300 border-teal-500/40'
                      : 'bg-teal-50 text-teal-800 border-teal-300'
                  }`}
                >
                  Type: {getFollowUpTypeLabel(patient.followUpStatus)}
                </span>
              </>
            )}

            {hasMissed && (
              <span className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Missed Session
              </span>
            )}
          </div>

          {/* ON-TREATMENT: LAST CTH & NEXT CTH (OUTLINED, PRESERVING OUTLINE COLORS) */}
          {!isFinished && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
              {/* Last CTH */}
              {(() => {
                const lastSchedule = getLastChemoSchedule(patient);
                return (
                  <div className={`border ${colorTheme.outlineBorder} rounded-lg p-2.5 space-y-1`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`text-[11px] uppercase font-semibold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        Last CTH:
                      </span>
                      <span className={`font-mono text-xs ${isDark ? 'text-slate-200' : 'text-slate-800 font-bold'}`}>
                        {lastSchedule?.date ? formatClinicalDate(lastSchedule.date) : 'None recorded'}
                      </span>
                    </div>
                    <div className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {lastSchedule ? (
                        <span>
                          {lastSchedule.cycle ? <strong className="font-extrabold text-slate-900">{lastSchedule.cycle}</strong> : ''}
                          {lastSchedule.cycle ? ' • ' : ''}
                          {abbreviateChemoDrugNames(lastSchedule.regimen)}
                        </span>
                      ) : (
                        <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} italic`}>
                          No prior chemotherapy recorded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Next CTH */}
              {(() => {
                const nextSchedule = getNextChemoSchedule(patient);
                return (
                  <div className={`border ${colorTheme.outlineBorder} rounded-lg p-2.5 space-y-1`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`text-[11px] uppercase font-semibold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        Next CTH:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs ${isDark ? 'text-slate-200' : 'text-slate-800 font-bold'}`}>
                          {nextSchedule?.date ? formatClinicalDate(nextSchedule.date) : 'None scheduled'}
                        </span>
                        {nextSchedule?.date && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAppointmentAdministered(
                                nextSchedule.appointment.id,
                                currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Dr. Mansour, MD'
                              );
                            }}
                            className="w-6 h-6 rounded-md bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                            title="Mark as Done / Received"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {nextSchedule ? (
                        <span>
                          {nextSchedule.cycle ? <strong className="font-extrabold text-slate-900">{nextSchedule.cycle}</strong> : ''}
                          {nextSchedule.cycle ? ' • ' : ''}
                          {abbreviateChemoDrugNames(nextSchedule.regimen)}
                        </span>
                      ) : (
                        <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} italic`}>
                          No upcoming chemotherapy scheduled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* FOLLOW-UP: LAST SCHEDULE & NEXT SCHEDULE IN 2 SEPARATE BOXES */}
          {isFinished && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
              {/* Last Schedule Box */}
              {(() => {
                const lastAppt = [...patient.appointments]
                  .filter((a) => a.status === 'Administered' || a.scheduledDate <= CLINICAL_TODAY)
                  .sort((a, b) => (b.administeredAt || b.scheduledDate).localeCompare(a.administeredAt || a.scheduledDate))[0];
                const lastDate = lastAppt?.administeredAt?.slice(0, 10) || lastAppt?.scheduledDate || patient.lastVisitDate;
                const lastRegimen = lastAppt
                  ? abbreviateChemoDrugNames(lastAppt.regimenName)
                  : patient.lastChemoReceived && patient.lastChemoReceived !== 'None'
                  ? abbreviateChemoDrugNames(patient.lastChemoReceived)
                  : 'Outpatient Clinic Review of Investigation and Clinical Assessment';

                return (
                  <div className={`border ${colorTheme.outlineBorder} rounded-lg p-2.5 space-y-1`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`text-[11px] uppercase font-semibold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        Last Schedule:
                      </span>
                      <span className={`font-mono text-xs ${isDark ? 'text-slate-200' : 'text-slate-800 font-bold'}`}>
                        {lastDate ? formatClinicalDate(lastDate) : 'None recorded'}
                      </span>
                    </div>
                    <div className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span>{lastRegimen}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Next Schedule Box */}
              {(() => {
                const nextSchedule = getNextChemoSchedule(patient);
                const nextScheduledAppt = patient.appointments
                  ?.filter((a) => a.status === 'Scheduled')
                  ?.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];
                const nextVisitDate =
                  nextSchedule?.date || nextScheduledAppt?.scheduledDate || patient.nextVisitDate;

                return (
                  <div className={`border ${colorTheme.outlineBorder} rounded-lg p-2.5 space-y-1`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`text-[11px] uppercase font-semibold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        Next Schedule:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs ${isDark ? 'text-slate-200' : 'text-slate-800 font-bold'}`}>
                          {nextVisitDate ? formatClinicalDate(nextVisitDate) : 'Not scheduled'}
                        </span>
                        {nextVisitDate && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const clinician = currentUser
                                ? `${currentUser.firstName} ${currentUser.lastName}`
                                : 'Dr. Mansour, MD';
                              if (nextSchedule?.appointment) {
                                markAppointmentAdministered(nextSchedule.appointment.id, clinician);
                              } else if (nextScheduledAppt) {
                                markAppointmentAdministered(nextScheduledAppt.id, clinician);
                              } else if (patient.nextVisitDate) {
                                updatePatient({
                                  ...patient,
                                  lastVisitDate: patient.nextVisitDate,
                                  nextVisitDate: undefined,
                                  colleagueNotes: [
                                    {
                                      id: `note-${Date.now()}`,
                                      patientId: patient.id,
                                      timestamp: '2026-10-20 12:00',
                                      author: clinician,
                                      role: 'Pediatric Oncologist',
                                      tag: 'General',
                                      text: `Surveillance follow-up visit on ${formatClinicalDate(patient.nextVisitDate)} completed. Patient clinically evaluated and stable.`,
                                    },
                                    ...patient.colleagueNotes,
                                  ],
                                });
                              }
                            }}
                            className="w-6 h-6 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                            title="Mark as Done / Received"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {nextSchedule ? (
                        <span>{abbreviateChemoDrugNames(nextSchedule.regimen)}</span>
                      ) : nextVisitDate ? (
                        <span>Outpatient Clinic Review of Investigation and Clinical Assessment</span>
                      ) : (
                        <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} italic`}>
                          No upcoming follow-up scheduled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Action buttons: Add Schedule & Add Event small icon buttons for ALL patients + Chart */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setNewAppointmentPatientId(patient.id);
              setIsNewAppointmentOpen(true);
            }}
            title="Add Chemotherapy / Follow-up Schedule"
            className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center shadow-xs ${
              isDark
                ? 'bg-blue-600/40 hover:bg-blue-600/70 text-blue-100 hover:text-white border-blue-400/40'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300'
            }`}
          >
            <CalendarPlus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAddEventPatientId(patient.id);
              setIsAddEventOpen(true);
            }}
            title="Add Clinical Event / Toxicity"
            className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center shadow-xs ${
              isDark
                ? 'bg-teal-600/40 hover:bg-teal-600/70 text-teal-100 hover:text-white border-teal-400/40'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-300'
            }`}
          >
            <Activity className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedPatientId(patient.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs border ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600/60'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
            }`}
            title="Open full patient clinical chart"
          >
            <span>Chart</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // Follow-up Box Configuration metadata
  const boxMeta: Record<
    FollowUpBoxCategory,
    { label: string; icon: React.ReactNode; badgeClassDark: string; badgeClassLight: string; dotColor: string }
  > = {
    'Regular Follow-up': {
      label: 'Regular Follow-up',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      badgeClassDark: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50',
      badgeClassLight: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dotColor: 'bg-emerald-500',
    },
    'Lost Follow-up': {
      label: 'Lost Follow-up',
      icon: <Compass className="w-4 h-4 text-amber-400" />,
      badgeClassDark: 'bg-amber-950/70 text-amber-300 border-amber-500/50',
      badgeClassLight: 'bg-amber-50 text-amber-800 border-amber-300',
      dotColor: 'bg-amber-500',
    },
    'Discharged': {
      label: 'Discharged',
      icon: <Award className="w-4 h-4 text-sky-400" />,
      badgeClassDark: 'bg-sky-950/70 text-sky-300 border-sky-500/50',
      badgeClassLight: 'bg-sky-50 text-sky-800 border-sky-300',
      dotColor: 'bg-sky-500',
    },
    'Palliative': {
      label: 'Palliative',
      icon: <HeartHandshake className="w-4 h-4 text-purple-400" />,
      badgeClassDark: 'bg-purple-950/70 text-purple-300 border-purple-500/50',
      badgeClassLight: 'bg-purple-50 text-purple-800 border-purple-300',
      dotColor: 'bg-purple-500',
    },
    'Died': {
      label: 'Died',
      icon: <Clock className="w-4 h-4 text-slate-400" />,
      badgeClassDark: 'bg-slate-800 text-slate-300 border-slate-700',
      badgeClassLight: 'bg-slate-100 text-slate-700 border-slate-300',
      dotColor: 'bg-slate-400',
    },
  };

  return (
    <div className="space-y-5">
      {/* TOP CONTROL BAR: 3 COMPACT BUTTONS (ACTIVE, FOLLOW-UP, ALL) */}
      <div className={`w-full p-1.5 rounded-xl border transition-colors ${isDark ? 'bg-[#0e1424] border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full">
          {/* Active Button */}
          <button
            type="button"
            onClick={() => setTreatmentStatusFilter('On Treatment')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full ${
              treatmentStatusFilter === 'On Treatment'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800 bg-[#080d19] border border-slate-700/60'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 bg-slate-50 border border-slate-300'
            }`}
          >
            <span>Active</span>
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                treatmentStatusFilter === 'On Treatment'
                  ? 'bg-blue-800 text-white'
                  : isDark
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {stats.onTreatment}
            </span>
          </button>

          {/* Follow-up Button */}
          <button
            type="button"
            onClick={() => setTreatmentStatusFilter('Under Follow up')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full ${
              treatmentStatusFilter === 'Under Follow up'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800 bg-[#080d19] border border-slate-700/60'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 bg-slate-50 border border-slate-300'
            }`}
          >
            <span>Follow-up</span>
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                treatmentStatusFilter === 'Under Follow up'
                  ? 'bg-emerald-800 text-white'
                  : isDark
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {stats.followUp}
            </span>
          </button>

          {/* All Button */}
          <button
            type="button"
            onClick={() => setTreatmentStatusFilter('All')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full ${
              treatmentStatusFilter === 'All'
                ? 'bg-slate-700 text-white shadow-xs font-bold'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800 bg-[#080d19] border border-slate-700/60'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 bg-slate-50 border border-slate-300'
            }`}
          >
            <span>All</span>
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                treatmentStatusFilter === 'All'
                  ? 'bg-slate-600 text-white'
                  : isDark
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {stats.total}
            </span>
          </button>
        </div>
      </div>

      {/* SEARCH BOX: Appears ONLY if Search Button is pressed */}
      {isSearchOpen && (
        <div className={`p-3 rounded-2xl border shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-[#0e1424] border-slate-700/80' : 'bg-white border-slate-200'}`}>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Search patients by Name, ID, or MRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-24 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                isDark
                  ? 'bg-[#080d19] border-slate-700 text-white placeholder-slate-400 focus:border-teal-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:border-teal-500'
              }`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded cursor-pointer"
                  title="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300'
                }`}
                title="Hide search box"
              >
                Close
              </button>
            </div>
          </div>

          {searchQuery.trim() && (
            <div className={`flex items-center justify-between mt-2 pt-2 border-t text-xs ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
              <span>
                Found <strong className="text-teal-600 dark:text-teal-300 font-bold">{filteredPatients.length}</strong> matching {filteredPatients.length === 1 ? 'patient' : 'patients'} for &quot;{searchQuery}&quot;
                {treatmentStatusFilter !== 'All' && (
                  <span>
                    {' '}in <strong>{treatmentStatusFilter === 'On Treatment' ? 'Active' : 'Follow-up'}</strong>
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-teal-600 dark:text-teal-400 hover:underline font-medium cursor-pointer text-xs"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}

      {/* MAIN CONTENT AREA */}

      {/* 1. ON TREATMENT FILTER ONLY: Render Active Patients grouped by Diagnosis */}
      {treatmentStatusFilter === 'On Treatment' && (
        <div className="space-y-6">
          {activePatients.length === 0 ? (
            <div className={`p-10 text-center rounded-xl border ${isDark ? 'bg-[#0e1424] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
              <p className="text-xs">No active patients on treatment found.</p>
            </div>
          ) : (
            activeDiagnosisGroups.map(([diagnosisName, groupPatients]) => (
              <div key={diagnosisName} className="space-y-2.5">
                <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${isDark ? 'bg-[#0e1424] border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h3 className={`text-xs font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{diagnosisName}</h3>
                    <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      ({groupPatients.length})
                    </span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {groupPatients.map((patient) => renderPatientCard(patient))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. UNDER FOLLOW-UP FILTER ONLY: Render the 5 Separate Boxes */}
      {treatmentStatusFilter === 'Under Follow up' && (
        <div className="space-y-6">
          {FOLLOW_UP_BOX_CATEGORIES.map((catKey) => {
            const meta = boxMeta[catKey];
            const catPatients = followUpBoxes[catKey] || [];
            return (
              <div
                key={catKey}
                className={`rounded-2xl border p-3.5 sm:p-4 space-y-3 transition-colors ${
                  isDark ? 'bg-[#0e1424] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Dedicated Box Header */}
                <div className="flex items-center justify-between border-b pb-2.5 border-slate-700/40 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${meta.dotColor}`} />
                    <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {meta.label}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                      isDark ? meta.badgeClassDark : meta.badgeClassLight
                    }`}
                  >
                    {catPatients.length} {catPatients.length === 1 ? 'patient' : 'patients'}
                  </span>
                </div>

                {/* Patient Cards inside the Box */}
                {catPatients.length > 0 ? (
                  <div className="space-y-2.5">
                    {catPatients.map((patient) => renderPatientCard(patient))}
                  </div>
                ) : (
                  <div className={`py-4 text-center rounded-xl border border-dashed text-xs ${isDark ? 'border-slate-800 text-slate-500 bg-[#080d19]/40' : 'border-slate-200 text-slate-500 bg-slate-50/60'}`}>
                    No patients currently in {meta.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. ALL FILTER: Active Patients by Diagnosis + Follow-up Patients in 5 Dedicated Boxes */}
      {treatmentStatusFilter === 'All' && (
        <div className="space-y-8">
          {/* SECTION A: ACTIVE PATIENTS (ON TREATMENT) */}
          <div className="space-y-3">
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${isDark ? 'bg-[#0e1424] border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <h2 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Active Patients (On Treatment)
                </h2>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${isDark ? 'bg-blue-950/80 text-blue-300 border-blue-500/50' : 'bg-blue-50 text-blue-800 border-blue-300'}`}>
                {activePatients.length} {activePatients.length === 1 ? 'patient' : 'patients'}
              </span>
            </div>

            {activePatients.length === 0 ? (
              <div className={`p-6 text-center rounded-xl border ${isDark ? 'bg-[#0e1424]/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                <p className="text-xs">No active on-treatment patients matching criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeDiagnosisGroups.map(([diagnosisName, groupPatients]) => (
                  <div key={diagnosisName} className="space-y-2">
                    <div className={`flex items-center justify-between px-3 py-1 rounded-lg border ${isDark ? 'bg-[#10172a] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <h3 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{diagnosisName}</h3>
                        <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          ({groupPatients.length})
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {groupPatients.map((patient) => renderPatientCard(patient))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION B: FOLLOW-UP PATIENTS WITH 5 SEPARATE BOXES */}
          {/* User Request: In home page all list can the follow up patients have a separate box named: regular follow up, lost follow up, Discharged, Palliative, Died */}
          <div className="space-y-4 pt-2">
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${isDark ? 'bg-[#0e1424] border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <h2 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Follow-Up Patients
                </h2>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}`}>
                {followUpPatients.length} {followUpPatients.length === 1 ? 'patient' : 'patients'}
              </span>
            </div>

            {/* 5 SEPARATE BOXES FOR FOLLOW-UP PATIENTS */}
            <div className="space-y-4">
              {FOLLOW_UP_BOX_CATEGORIES.map((catKey) => {
                const meta = boxMeta[catKey];
                const catPatients = followUpBoxes[catKey] || [];
                return (
                  <div
                    key={catKey}
                    className={`rounded-2xl border p-3.5 sm:p-4 space-y-3 transition-colors ${
                      isDark ? 'bg-[#0e1424] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    {/* Dedicated Box Header */}
                    <div className="flex items-center justify-between border-b pb-2.5 border-slate-700/40 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${meta.dotColor}`} />
                        <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {meta.label}
                        </h3>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isDark ? meta.badgeClassDark : meta.badgeClassLight
                        }`}
                      >
                        {catPatients.length} {catPatients.length === 1 ? 'patient' : 'patients'}
                      </span>
                    </div>

                    {/* Patient Cards inside the Box */}
                    {catPatients.length > 0 ? (
                      <div className="space-y-2.5">
                        {catPatients.map((patient) => renderPatientCard(patient))}
                      </div>
                    ) : (
                      <div className={`py-4 text-center rounded-xl border border-dashed text-xs ${isDark ? 'border-slate-800 text-slate-500 bg-[#080d19]/40' : 'border-slate-200 text-slate-500 bg-slate-50/60'}`}>
                        No patients currently in {meta.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
