import React, { useState, useEffect, useRef } from 'react';
import { useOncology } from '../context/OncologyContext';
import { Patient, ChemotherapyAppointment, MajorClinicalEvent, ProtocolDocument } from '../types/oncology';
import {
  X,
  Calendar,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Check,
  Plus,
  Shield,
  Pill,
  Printer,
  Pencil,
  HeartPulse,
  AlertCircle,
  ShieldCheck,
  Search,
  ArrowRightLeft,
  BookOpen,
  FileText,
  Upload,
  Download,
  ExternalLink,
  Layers,
  Sparkles,
  Eye,
  Syringe,
} from 'lucide-react';
import {
  CLINICAL_TODAY,
  formatClinicalDate,
  isAppointmentMissed,
  calculateAgeFromDob,
  formatRegimenNameWithoutDuplicate,
  formatAppointmentScheduleLabel,
  normalizeDiagnosisDisplay,
  isALLDiagnosis,
  getPatientColorTheme,
  isIntrathecalDrug,
  normalizeVenousAccess,
  abbreviateChemoDrugNames,
  normalizeFollowUpBox,
  FOLLOW_UP_TYPE_OPTIONS,
  getFollowUpTypeLabel,
} from '../utils/oncologyUtils';
import { useTheme } from '../context/ThemeContext';
import { FollowUpStatus } from '../types/oncology';
import { ProtocolViewerModal } from './ProtocolViewerModal';
import { PEDIATRIC_STANDARD_PROTOCOLS } from '../utils/protocolRoadmaps';
import { useAuth } from '../context/AuthContext';
import { EditAppointmentModal } from './EditAppointmentModal';
import { EditEventModal } from './EditEventModal';
import { ClinicalDateInput } from './ClinicalDateInput';

export const PatientDetailModal: React.FC = () => {
  const {
    selectedPatient,
    setSelectedPatientId,
    markAppointmentAdministered,
    rescheduleAppointment,
    markAppointmentDelayed,
    setIsNewAppointmentOpen,
    setNewAppointmentPatientId,
    setIsAddEventOpen,
    setAddEventPatientId,
    setIsEditPatientOpen,
    setEditPatientId,
    setIsAddInvestigationOpen,
    setInvestigationPatientId,
    switchPatientCohort,
    updateFollowUpStatus,
    updateAppointment,
    updatePatient,
    patients,
    scheduleStartDate,
    scheduleEndDate,
  } = useOncology();

  const { currentUser } = useAuth();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'timeline' | 'protocol'>('timeline');
  const [isProtocolViewerOpen, setIsProtocolViewerOpen] = useState(false);
  const [selectedProtocolDocIndex, setSelectedProtocolDocIndex] = useState(0);
  const [previewEventImage, setPreviewEventImage] = useState<{ url: string; title: string } | null>(null);

  // Notes free-text state with auto-expanding textarea
  const [notesText, setNotesText] = useState(selectedPatient?.summaryProgress || '');
  const [isNotesSaved, setIsNotesSaved] = useState(false);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 40)}px`;
  };

  useEffect(() => {
    if (selectedPatient) {
      setNotesText(selectedPatient.summaryProgress || '');
      setIsNotesSaved(false);
    }
  }, [selectedPatient?.id, selectedPatient?.summaryProgress]);

  useEffect(() => {
    if (notesTextareaRef.current) {
      autoResizeTextarea(notesTextareaRef.current);
    }
  }, [notesText, selectedPatient?.id]);

  const handleSaveNotes = (val?: string) => {
    if (!selectedPatient) return;
    const textToSave = (val !== undefined ? val : notesText).trim();
    if (textToSave !== (selectedPatient.summaryProgress || '')) {
      updatePatient({
        ...selectedPatient,
        summaryProgress: textToSave,
      });
      setIsNotesSaved(true);
      setTimeout(() => setIsNotesSaved(false), 2000);
    }
  };

  // Quick reschedule state
  const [rescheduleApptId, setRescheduleApptId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(CLINICAL_TODAY);

  // Dose Reduction Window state
  const [doseReductionAppt, setDoseReductionAppt] = useState<ChemotherapyAppointment | null>(null);
  const [reductionPercent, setReductionPercent] = useState('25% Reduction');
  const [reductionReason, setReductionReason] = useState('Grade 4 Neutropenia');

  // Edit Appointment and Edit Event modal states
  const [editingAppointment, setEditingAppointment] = useState<ChemotherapyAppointment | null>(null);
  const [isEditApptOpen, setIsEditApptOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MajorClinicalEvent | null>(null);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);

  // End Chemo and Relapse transfer dialog states
  const [isEndChemoModalOpen, setIsEndChemoModalOpen] = useState(false);
  const [endChemoDate, setEndChemoDate] = useState(CLINICAL_TODAY);
  const [endChemoStatus, setEndChemoStatus] = useState<FollowUpStatus>('Regular Follow-up');
  const [isRelapseModalOpen, setIsRelapseModalOpen] = useState(false);

  const scrollBodyRef = useRef<HTMLDivElement>(null);

  // Forward scroll wheel from fixed top header/tabs to scrollable body
  const handleTopWheel = (e: React.WheelEvent) => {
    if (scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop += e.deltaY;
    }
  };

  // Prevent background scrolling while patient chart modal is open and reset scroll position
  useEffect(() => {
    if (selectedPatient) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      if (scrollBodyRef.current) {
        scrollBodyRef.current.scrollTop = 0;
      }
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedPatient?.id]);

  if (!selectedPatient) return null;

  const currentCycleNum = selectedPatient.currentCycle || 1;
  const totalCyclesNum = selectedPatient.totalPlannedCycles || 6;
  const cyclePercent = Math.min(
    100,
    Math.round((currentCycleNum / Math.max(1, totalCyclesNum)) * 100)
  );

  const ageInfo = calculateAgeFromDob(selectedPatient.dateOfBirth, CLINICAL_TODAY);
  const theme = getPatientColorTheme(selectedPatient, isDark ? 'dark' : 'light');

  return (
    <div className="fixed inset-0 z-50 h-full w-full bg-slate-900/60 flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className={`rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border-2 ${
        selectedPatient.status === 'On Treatment' ? 'border-blue-500' : 'border-emerald-500'
      } w-full max-w-4xl h-full sm:max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200 bg-white text-slate-900`}>
        {/* Modal Top Clinical Bar - Responsive 2-tier header matching home page patient card */}
        <div
          onWheel={handleTopWheel}
          className={`px-3.5 py-2.5 sm:px-5 sm:py-3 border-b-2 shrink-0 select-none space-y-2 transition-colors ${
            selectedPatient.status === 'On Treatment'
              ? 'bg-blue-50/70 border-blue-500 text-slate-900'
              : 'bg-emerald-50/70 border-emerald-500 text-slate-900'
          }`}
        >
          {/* Tier 1: Full Patient Name, Demographics summary & Primary actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2 min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-bold truncate text-slate-900">
                {selectedPatient.name}
              </h2>
              <span className="text-xs font-medium shrink-0 text-slate-600">
                ({ageInfo.displayText}, {selectedPatient.gender})
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditPatientId(selectedPatient.id);
                  setIsEditPatientOpen(true);
                }}
                title="Edit Patient Data"
                className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-md transition-colors cursor-pointer border border-slate-300 shadow-2xs"
              >
                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedPatientId(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer border border-slate-300 bg-white shadow-2xs"
                title="Close Chart"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Tier 2: Patient Identifiers & Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-xs bg-white text-slate-800 border border-slate-300 px-2 py-0.5 rounded font-semibold shadow-2xs">
                MRN: {selectedPatient.mrn}
              </span>
              {selectedPatient.nationalId && (
                <span className="font-mono text-xs bg-white text-slate-800 border border-slate-300 px-2 py-0.5 rounded font-semibold hidden md:inline shadow-2xs">
                  ID: {selectedPatient.nationalId}
                </span>
              )}
              {/* FOR FOLLOW-UP PATIENTS: Separate box for Ended Therapy Date & Separate box for Type of Follow-up */}
              {selectedPatient.status === 'Under Follow up' && (
                <>
                  {/* Box 1: Ended Therapy Date */}
                  <div className="flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-lg border font-semibold bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold opacity-75">Ended Therapy:</span>
                    <span className="font-mono font-bold">
                      {formatClinicalDate(
                        selectedPatient.followUpStartDate ||
                          selectedPatient.lastChemoDate ||
                          selectedPatient.treatmentStartDate
                      )}
                    </span>
                  </div>

                  {/* Box 2: Type of Follow-up (regular fu, lost fu, discharge, Palliative, died) */}
                  <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg border font-semibold bg-teal-50 text-teal-900 border-teal-300 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold opacity-75">Type:</span>
                    <select
                      value={normalizeFollowUpBox(selectedPatient.followUpStatus)}
                      onChange={(e) => updateFollowUpStatus(selectedPatient.id, e.target.value as FollowUpStatus)}
                      className="font-bold text-xs bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-0 p-0 text-teal-900"
                      title="Follow-up type"
                    >
                      {FOLLOW_UP_TYPE_OPTIONS.map((opt) => (
                        <option className="text-slate-900 bg-white" key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setNewAppointmentPatientId(selectedPatient.id);
                  setIsNewAppointmentOpen(true);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 shadow-2xs cursor-pointer border ${
                  selectedPatient.status === 'On Treatment'
                    ? 'text-blue-700 bg-white hover:bg-blue-50 border-blue-300'
                    : 'text-emerald-700 bg-white hover:bg-emerald-50 border-emerald-300'
                }`}
                title="Schedule Chemotherapy Session"
              >
                <Plus className={`w-3 h-3 ${selectedPatient.status === 'On Treatment' ? 'text-blue-600' : 'text-emerald-600'}`} />
                <span>Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddEventPatientId(selectedPatient.id);
                  setIsAddEventOpen(true);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 shadow-2xs cursor-pointer border ${
                  selectedPatient.status === 'On Treatment'
                    ? 'text-blue-700 bg-white hover:bg-blue-50 border-blue-300'
                    : 'text-emerald-700 bg-white hover:bg-emerald-50 border-emerald-300'
                }`}
                title="Log Major Clinical Event"
              >
                <Plus className={`w-3 h-3 ${selectedPatient.status === 'On Treatment' ? 'text-blue-600' : 'text-emerald-600'}`} />
                <span>Event</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProtocolViewerOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors cursor-pointer border border-slate-300 shadow-2xs"
                title="View Protocol Roadmap & Files"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Protocol</span>
                {((selectedPatient.protocolDocuments && selectedPatient.protocolDocuments.length > 0) || selectedPatient.protocolDocumentUrl) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body - Full height independent scroll container */}
        <div
          ref={scrollBodyRef}
          tabIndex={0}
          className="h-full overflow-y-auto flex-1 min-h-0 p-3 sm:p-5 space-y-3 sm:space-y-4 overscroll-contain focus:outline-none transition-colors bg-[#f8fafc] text-slate-900"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Patient Clinical Baseline & Surveillance Summary Block */}
          <div className={`border-2 ${
            selectedPatient.status === 'On Treatment' ? 'border-blue-200' : 'border-emerald-200'
          } rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3 shadow-2xs shrink-0 transition-colors bg-white text-slate-900`}>
            {/* Diagnosis, Stage, Protocol */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-teal-50 border border-teal-300 text-teal-950 font-bold px-2.5 py-1 rounded-lg text-xs sm:text-sm shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                  <span>{normalizeDiagnosisDisplay(selectedPatient.diagnosis)}</span>
                </div>
                {selectedPatient.stage && selectedPatient.stage !== 'N/A' && (
                  <div className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 flex items-center gap-1 border border-slate-300">
                    <span className="text-slate-500 font-medium">Stage:</span>
                    <strong className="text-slate-900 font-bold">{selectedPatient.stage}</strong>
                  </div>
                )}
                {selectedPatient.riskStratification && selectedPatient.riskStratification !== 'N/A' && (
                  <div className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 flex items-center gap-1 border border-blue-200">
                    <span className="text-blue-700 font-medium">Risk:</span>
                    <strong className="text-blue-950 font-bold">{selectedPatient.riskStratification}</strong>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-600 truncate max-w-full">
                Protocol: <strong className="text-slate-900 font-semibold">{selectedPatient.protocol}</strong>
              </div>
            </div>

            {/* Core Demographics & Clinical Factors: Compact Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Diagnosis Date:</span>
                <strong className="text-slate-900 font-mono">{formatClinicalDate(selectedPatient.dateOfDiagnosis)}</strong>
              </div>
              {selectedPatient.status !== 'Under Follow up' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Venous access:</span>
                  <strong className="text-slate-900">{normalizeVenousAccess(selectedPatient.lineAccess)}</strong>
                </div>
              )}
              <div className="flex items-center gap-1.5 sm:col-span-1">
                <span className="text-slate-500">Comorbidity:</span>
                <strong className="text-slate-800 font-medium truncate" title={selectedPatient.majorComorbidity || 'None (Unremarkable)'}>
                  {selectedPatient.majorComorbidity || 'None (Unremarkable)'}
                </strong>
              </div>
            </div>

            {/* Clinical Summary Cards: On-Treatment vs Under Follow-up */}
            {selectedPatient.status !== 'Under Follow up' ? (
              (() => {
                const nextUpcomingAppt = [...selectedPatient.appointments]
                  .filter((a) => a.status !== 'Administered')
                  .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];

                return (
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    {/* Scheduled CTH */}
                    <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">
                          Scheduled CTH
                        </span>
                        {nextUpcomingAppt && (
                          <span className="text-[10px] font-mono text-teal-800 font-bold bg-teal-100/70 px-1.5 py-0.2 rounded border border-teal-300 shrink-0">
                            {formatClinicalDate(nextUpcomingAppt.scheduledDate)}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-900 truncate text-xs">
                        {nextUpcomingAppt ? (
                          <span title={nextUpcomingAppt.regimenName}>
                            {formatAppointmentScheduleLabel(nextUpcomingAppt, selectedPatient.diagnosis) ? <strong className="font-extrabold text-slate-900">{formatAppointmentScheduleLabel(nextUpcomingAppt, selectedPatient.diagnosis)}</strong> : ''}
                            {formatAppointmentScheduleLabel(nextUpcomingAppt, selectedPatient.diagnosis) ? ' • ' : ''}
                            {abbreviateChemoDrugNames(formatRegimenNameWithoutDuplicate(nextUpcomingAppt.regimenName, nextUpcomingAppt.cycleNumber, nextUpcomingAppt.dayInCycle, nextUpcomingAppt.phaseName))}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-[11px]">No pending session</span>
                        )}
                      </div>
                    </div>

                    {/* Last CTH Received */}
                    <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">
                          Last CTH Received
                        </span>
                        {selectedPatient.lastChemoDate && (
                          <span className="text-[10px] font-mono text-slate-800 font-bold bg-slate-200/80 px-1.5 py-0.2 rounded border border-slate-300 shrink-0">
                            {formatClinicalDate(selectedPatient.lastChemoDate)}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-teal-800 truncate text-xs">
                        {selectedPatient.lastChemoReceived && selectedPatient.lastChemoReceived !== 'None'
                          ? abbreviateChemoDrugNames(selectedPatient.lastChemoReceived)
                          : (selectedPatient.treatmentStageOrPhase ? abbreviateChemoDrugNames(selectedPatient.treatmentStageOrPhase) : 'None recorded')}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              (() => {
                const nextUpcomingAppt = [...selectedPatient.appointments]
                  .filter((a) => a.status !== 'Administered')
                  .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];
                const nextFollowUpDate = nextUpcomingAppt?.scheduledDate || selectedPatient.nextVisitDate;

                const lastAdministeredAppt = [...selectedPatient.appointments]
                  .filter((a) => a.status === 'Administered')
                  .sort((a, b) => (b.administeredAt || b.scheduledDate).localeCompare(a.administeredAt || a.scheduledDate))[0];
                const lastVisitDate = lastAdministeredAppt?.administeredAt?.slice(0, 10) || lastAdministeredAppt?.scheduledDate || selectedPatient.lastVisitDate;

                const investigationEvents = selectedPatient.events
                  .filter((e) => e.category === 'Imaging & Response' || e.category === 'Bone Marrow & Labs')
                  .sort((a, b) => b.date.localeCompare(a.date));

                const lastInvestigation = investigationEvents[0];

                const nextInvestigation = investigationEvents
                  .filter((e) => e.date >= CLINICAL_TODAY || e.description.toLowerCase().includes('pending') || e.title.toLowerCase().includes('pending'))
                  .sort((a, b) => a.date.localeCompare(b.date))[0];

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-xs">
                    {/* 1. Next Follow-up Visit Date */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Next Follow-up Visit Date
                        </span>
                        {nextFollowUpDate && (
                          <span className="text-[10px] font-mono text-teal-800 font-bold bg-teal-100/70 px-1.5 py-0.2 rounded border border-teal-300">
                            {formatClinicalDate(nextFollowUpDate)}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-900 truncate text-xs">
                        {nextFollowUpDate ? (
                          <span>{nextUpcomingAppt?.regimenName || 'Outpatient Clinic Review & Assessment'}</span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">Not scheduled</span>
                        )}
                      </div>
                    </div>

                    {/* 2. Last Visit Date */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Last Visit Date
                        </span>
                        {lastVisitDate && (
                          <span className="text-[10px] font-mono text-slate-800 font-bold bg-slate-200/80 px-1.5 py-0.2 rounded border border-slate-300">
                            {formatClinicalDate(lastVisitDate)}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-teal-800 truncate text-xs">
                        {lastVisitDate ? (
                          <span>{lastAdministeredAppt?.regimenName || 'Outpatient Review Completed'}</span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">None recorded</span>
                        )}
                      </div>
                    </div>

                    {/* 3. Last Investigations */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Last Investigations
                        </span>
                        {lastInvestigation && (
                          <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-300">
                            {formatClinicalDate(lastInvestigation.date)}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-900 truncate text-xs">
                        {lastInvestigation ? (
                          <span title={lastInvestigation.title}>
                            <span className="text-emerald-700 font-bold mr-1">
                              [{lastInvestigation.category === 'Imaging & Response' ? 'Imaging' : 'Labs'}]
                            </span>
                            {lastInvestigation.title.replace(/^Investigation:\s*/, '')}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">No prior investigations</span>
                        )}
                      </div>
                    </div>

                    {/* 4. Next Investigations */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block truncate" title="Next investigations">
                          Next Investigations
                        </span>
                        <div className="flex items-center gap-1">
                          {nextInvestigation && (
                            <span className="text-[10px] font-mono text-teal-800 font-bold bg-teal-100/70 px-1.5 py-0.2 rounded border border-teal-300">
                              {formatClinicalDate(nextInvestigation.date)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setInvestigationPatientId(selectedPatient.id);
                              setIsAddInvestigationOpen(true);
                            }}
                            className="text-[10px] font-bold text-teal-800 hover:text-teal-950 px-1.5 py-0.2 rounded bg-teal-100 border border-teal-300 hover:bg-teal-200 transition-colors cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                      <div className="font-semibold text-teal-800 truncate text-xs">
                        {nextInvestigation ? (
                          <span title={nextInvestigation.title}>
                            <span className="text-teal-700 font-bold mr-1">
                              [{nextInvestigation.category === 'Imaging & Response' ? 'Imaging' : 'Labs'}]
                            </span>
                            {nextInvestigation.title.replace(/^Investigation:\s*/, '')}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">
                            Imaging & Response / Labs & Bone Marrow
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Follow-up controls or Notes and End chemo */}
            {selectedPatient.status === 'Under Follow up' ? (
              <div className="pt-2 border-t border-slate-200 flex flex-col gap-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    {/* Box 1: Ended Therapy Date */}
                    <div className="p-2 rounded-lg border bg-emerald-50 border-emerald-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold block text-slate-500">
                        Ended Therapy Date
                      </span>
                      <span className="font-mono font-bold text-emerald-800 text-xs">
                        {formatClinicalDate(
                          selectedPatient.followUpStartDate ||
                            selectedPatient.lastChemoDate ||
                            selectedPatient.treatmentStartDate
                        )}
                      </span>
                    </div>

                    {/* Box 2: Type of Follow-up */}
                    <div className="p-2 rounded-lg border bg-teal-50 border-teal-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold block text-slate-500">
                        Type of Follow-up
                      </span>
                      <select
                        value={normalizeFollowUpBox(selectedPatient.followUpStatus)}
                        onChange={(e: any) => updateFollowUpStatus(selectedPatient.id, e.target.value as FollowUpStatus)}
                        className="mt-0.5 px-2 py-0.5 rounded font-bold text-xs border shadow-2xs bg-white border-slate-300 text-teal-900 cursor-pointer"
                      >
                        {FOLLOW_UP_TYPE_OPTIONS.map((opt) => (
                          <option className="text-slate-900 bg-white" key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date of Last Visit */}
                    <div className="p-2 rounded-lg border bg-slate-50 border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold block text-slate-500">
                        Date of Last Visit
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-800">
                        {formatClinicalDate(selectedPatient.lastVisitDate || CLINICAL_TODAY)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInvestigationPatientId(selectedPatient.id);
                        setIsAddInvestigationOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs text-teal-800 bg-teal-50 hover:bg-teal-100 hover:text-teal-950 border border-teal-300 rounded-lg font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      Add Investigation
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRelapseModalOpen(true)}
                      className="px-2.5 py-1 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-semibold border border-rose-300 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Relapse
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Notes</span>
                    {isNotesSaved && <span className="text-[10px] text-emerald-600 font-bold">Saved</span>}
                  </div>
                  <textarea
                    ref={notesTextareaRef}
                    value={notesText}
                    onChange={(e) => {
                      setNotesText(e.target.value);
                      setIsNotesSaved(false);
                      autoResizeTextarea(e.target);
                    }}
                    onBlur={() => handleSaveNotes()}
                    rows={1}
                    placeholder="Enter surveillance notes or clinical observations as free text..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-[border-color,background-color] overflow-hidden resize-none font-normal"
                  />
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Notes</span>
                    {isNotesSaved && <span className="text-[10px] text-emerald-600 font-bold">Saved</span>}
                  </div>
                  <textarea
                    ref={notesTextareaRef}
                    value={notesText}
                    onChange={(e) => {
                      setNotesText(e.target.value);
                      setIsNotesSaved(false);
                      autoResizeTextarea(e.target);
                    }}
                    onBlur={() => handleSaveNotes()}
                    rows={1}
                    placeholder="Enter clinical notes, progress updates, or observations as free text..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-[border-color,background-color] overflow-hidden resize-none font-normal"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEndChemoDate(selectedPatient.lastChemoDate || CLINICAL_TODAY);
                      setEndChemoStatus('Regular Follow-up');
                      setIsEndChemoModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>End CTH</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section Header: Clinical Timeline - Sticky inside chart scroll container */}
          <div
            className="sticky top-0 z-20 border-b border-slate-200 bg-[#f8fafc] py-2 px-3 sm:px-5 -mx-3 sm:-mx-5 shrink-0 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Activity className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Timeline</span>
              <span
                className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                  selectedPatient.status === 'On Treatment'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {selectedPatient.appointments.filter((a) => a.status === 'Administered').length +
                  selectedPatient.events.length}
              </span>
            </div>
          </div>

          {/* TAB 1: UNIFIED CLINICAL TIMELINE & CHEMOTHERAPY */}
          {activeTab === 'timeline' && (() => {
            const upcomingAppointments = [...selectedPatient.appointments]
              .filter((a) => a.status !== 'Administered')
              .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

            type UnifiedTimelineEntry =
              | { kind: 'chemo'; id: string; date: string; appt: ChemotherapyAppointment }
              | { kind: 'event'; id: string; date: string; event: MajorClinicalEvent };

            const unifiedTimeline: UnifiedTimelineEntry[] = [
              ...selectedPatient.appointments
                .filter((a) => a.status === 'Administered' || a.status === 'Missed')
                .map((a) => ({
                  kind: 'chemo' as const,
                  id: `chemo-${a.id}`,
                  date: a.scheduledDate || (a.administeredAt ? a.administeredAt.slice(0, 10) : CLINICAL_TODAY),
                  appt: a,
                })),
              ...selectedPatient.events.map((e) => ({
                kind: 'event' as const,
                id: `event-${e.id}`,
                date: e.date,
                event: e,
              })),
            ].sort((a, b) => b.date.localeCompare(a.date));

            const getEventCategoryStyle = (category: string) => {
              const cat = category.toLowerCase();
              if (cat.includes('infection')) {
                return {
                  badgeClass: 'bg-rose-50 text-rose-700 border-rose-300',
                  dotClass: 'bg-rose-500',
                  icon: '',
                  label: 'Infection',
                };
              }
              if (cat.includes('toxic')) {
                return {
                  badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
                  dotClass: 'bg-amber-500',
                  icon: '',
                  label: 'Toxicity',
                };
              }
              if (cat.includes('lab') || cat.includes('marrow')) {
                return {
                  badgeClass: 'bg-blue-50 text-blue-700 border-blue-300',
                  dotClass: 'bg-blue-500',
                  icon: '',
                  label: 'Labs',
                };
              }
              if (cat.includes('surg') || cat.includes('access')) {
                return {
                  badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-300',
                  dotClass: 'bg-indigo-500',
                  icon: '',
                  label: 'Surgery/access',
                };
              }
              if (cat.includes('imag') || cat.includes('response')) {
                return {
                  badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
                  dotClass: 'bg-cyan-500',
                  icon: '',
                  label: 'Imaging/response',
                };
              }
              if (cat.includes('milestone') || cat.includes('eval') || cat.includes('remission')) {
                return {
                  badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                  dotClass: 'bg-emerald-500',
                  icon: '',
                  label: 'Evaluation milestone',
                };
              }
              return {
                badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
                dotClass: 'bg-teal-500',
                icon: '',
                label: category,
              };
            };

            return (
              <div className="h-full min-h-0 space-y-4 pt-1">
                {/* SECTION 1: UPCOMING SCHEDULED CHEMOTHERAPY (IF ANY) */}
                {upcomingAppointments.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Upcoming Scheduled Chemotherapy ({upcomingAppointments.length})</span>
                      </h4>
                    </div>

                    <div className="space-y-2.5">
                      {upcomingAppointments.map((appt) => {
                        const isMissed = isAppointmentMissed(appt);
                        return (
                          <div
                            key={appt.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isMissed
                                ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/60 shadow-xs'
                                : appt.status === 'Delayed'
                                ? 'bg-orange-50/60 border-orange-300 shadow-xs'
                                : 'bg-white border-blue-200 hover:border-blue-300 shadow-2xs'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-extrabold text-blue-800 px-2 py-0.5 bg-blue-50 rounded border border-blue-200">
                                    {formatAppointmentScheduleLabel(appt, selectedPatient.diagnosis) ||
                                      (isALLDiagnosis(selectedPatient.diagnosis)
                                        ? appt.phaseName || 'Phase'
                                        : `Cycle ${appt.cycleNumber}`)}
                                  </span>
                                  <h5 className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                                    {formatRegimenNameWithoutDuplicate(appt.regimenName, appt.cycleNumber, appt.dayInCycle, appt.phaseName)}
                                  </h5>
                                  <span
                                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                      isMissed
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : appt.status === 'Delayed'
                                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                                    }`}
                                  >
                                    {isMissed && appt.status !== 'Missed' ? 'Missed / Overdue' : appt.status}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300 font-mono shadow-2xs">
                                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                    Scheduled: {formatClinicalDate(appt.scheduledDate)}
                                  </span>

                                  {/* Dose protocol button toggle */}
                                  <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-300 text-xs">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateAppointment(appt.id, {
                                          doseType: 'Full Dose',
                                          reductionPercentage: undefined,
                                          reductionReason: undefined,
                                        })
                                      }
                                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                                        appt.doseType !== 'With Reduction'
                                          ? 'bg-emerald-600 text-white shadow-2xs'
                                          : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                    >
                                      Full Dose
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDoseReductionAppt(appt);
                                        setReductionPercent(appt.reductionPercentage || '25% Reduction');
                                        setReductionReason(appt.reductionReason || 'Grade 4 Neutropenia');
                                      }}
                                      className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                                        appt.doseType === 'With Reduction'
                                          ? 'bg-amber-600 text-white shadow-2xs'
                                          : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                    >
                                      With Reduction {appt.reductionPercentage ? `(${appt.reductionPercentage})` : ''}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 self-start">
                                <button
                                  type="button"
                                  onClick={() => markAppointmentAdministered(appt.id)}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                                  title="Record chemotherapy session as received"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Received
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRescheduleApptId(appt.id);
                                    setNewDate(appt.scheduledDate);
                                  }}
                                  className="px-2.5 py-1 text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer shadow-2xs font-medium"
                                >
                                  Reschedule
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAppointment(appt);
                                    setIsEditApptOpen(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer bg-white shadow-2xs"
                                  title="Edit Schedule / Regimen Data"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inline Reschedule date picker if active */}
                            {rescheduleApptId === appt.id && (
                              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-2 text-xs">
                                <span className="font-medium text-slate-700 shrink-0">New Date (DD/MM/YYYY):</span>
                                <div className="w-44">
                                  <ClinicalDateInput
                                    value={newDate}
                                    onChange={(d) => setNewDate(d)}
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    rescheduleAppointment(appt.id, newDate);
                                    setRescheduleApptId(null);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md"
                                >
                                  Save Date
                                </button>
                                <button
                                  onClick={() => setRescheduleApptId(null)}
                                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {/* Prescribed Drugs list */}
                            {appt.drugs.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase mr-1">Drugs:</span>
                                {appt.drugs.map((d, i) => {
                                  const isIT = isIntrathecalDrug(d.name);
                                  return (
                                    <span
                                      key={i}
                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs shadow-2xs ${
                                        isIT
                                          ? 'font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-300 ring-1 ring-indigo-200'
                                          : 'font-semibold text-slate-800 bg-slate-100 border border-slate-200'
                                      }`}
                                    >
                                      {isIT ? (
                                        <>
                                          <Syringe className="w-3 h-3 text-indigo-600" />
                                          <span>{d.name}</span>
                                          <span className="text-[9px] px-1 py-0.2 bg-indigo-200 text-indigo-900 rounded font-bold uppercase tracking-wider">IT</span>
                                        </>
                                      ) : (
                                        <>
                                          <Pill className="w-3 h-3 text-teal-600" />
                                          <span>{d.name}</span>
                                        </>
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Remarks */}
                            {appt.remarks && (
                              <div className="mt-2 text-xs text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                <strong>Remarks:</strong> {appt.remarks}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SECTION 2: UNIFIED CLINICAL TIMELINE (RECEIVED CTH + CLINICAL EVENTS) */}
                <div className="space-y-3">
                  {unifiedTimeline.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                      No chemotherapy sessions received or major clinical events logged yet.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300">
                      {unifiedTimeline.map((item) => {
                        if (item.kind === 'chemo') {
                          const appt = item.appt;
                          const isMissed = appt.status === 'Missed' || isAppointmentMissed(appt);
                          return (
                            <div key={item.id} className="relative group">
                              {/* Dot on vertical timeline */}
                              <div
                                className={`absolute -left-6 top-2 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                  isMissed ? 'bg-rose-500' : 'bg-emerald-500'
                                } shadow-2xs`}
                              />

                              <div className={`bg-white p-4 rounded-xl border ${
                                selectedPatient.status === 'On Treatment' ? 'border-blue-200 hover:border-blue-300' : 'border-emerald-200 hover:border-emerald-300'
                              } shadow-2xs space-y-2 text-xs`}>
                                <div className="relative pt-1 pr-8">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`font-mono font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                                        isMissed
                                          ? 'text-rose-700 bg-rose-50 border border-rose-300'
                                          : 'text-emerald-800 bg-emerald-50 border border-emerald-300'
                                      }`}
                                    >
                                      {isMissed ? (
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                      ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      )}
                                      {formatClinicalDate(item.date)}
                                    </span>
                                    {isMissed && (
                                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                                        Missed
                                      </span>
                                    )}
                                    <span className="font-mono text-xs font-bold text-teal-800 px-2 py-0.5 bg-teal-50 rounded border border-teal-300">
                                      {formatAppointmentScheduleLabel(appt, selectedPatient.diagnosis) ||
                                        (isALLDiagnosis(selectedPatient.diagnosis)
                                          ? appt.phaseName || 'Phase'
                                          : `Cycle ${appt.cycleNumber}`)}
                                    </span>
                                    {appt.doseType === 'With Reduction' && (
                                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded">
                                        {appt.reductionPercentage || 'With Reduction'}{appt.reductionReason ? ` (${appt.reductionReason})` : ''}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingAppointment(appt);
                                      setIsEditApptOpen(true);
                                    }}
                                    className="absolute top-0 right-0 p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 rounded-md bg-white transition-colors cursor-pointer shadow-2xs"
                                    title="Edit Chemotherapy Session Record"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <h4 className="text-sm font-bold text-slate-900">
                                  {formatRegimenNameWithoutDuplicate(appt.regimenName, appt.cycleNumber, appt.dayInCycle, appt.phaseName)}
                                </h4>

                                {/* Remarks & Notes */}
                                {appt.remarks && (
                                  <p className="text-slate-700 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                                    <strong>Notes:</strong> {appt.remarks}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        } else {
                          const evt = item.event;
                          const catStyle = getEventCategoryStyle(evt.category);
                          return (
                            <div key={item.id} className="relative group">
                              {/* Dot on vertical timeline */}
                              <div className={`absolute -left-6 top-2 w-3.5 h-3.5 rounded-full border-2 border-white ${catStyle.dotClass} shadow-2xs`} />

                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-slate-700 font-semibold bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-md">
                                      {formatClinicalDate(item.date)}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${catStyle.badgeClass}`}>
                                      {catStyle.label}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingEvent(evt);
                                      setIsEditEventOpen(true);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 rounded-md bg-white transition-colors cursor-pointer shadow-2xs"
                                    title="Edit Clinical Event Data"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <p className="text-slate-800 leading-relaxed font-normal pt-0.5 text-xs">
                                  {evt.description || evt.title}
                                </p>

                                {/* Attached Image / Scan Thumbnail */}
                                {evt.imageUrl && (
                                  <div className="pt-1.5">
                                    <div
                                      onClick={() => setPreviewEventImage({ url: evt.imageUrl!, title: evt.category || evt.title })}
                                      className="inline-flex items-center gap-2.5 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors shadow-2xs group/img"
                                      title="Click to view full image"
                                    >
                                      <img
                                        src={evt.imageUrl}
                                        alt={evt.imageName || evt.title}
                                        className="w-14 h-14 object-cover rounded-md border border-slate-200 shrink-0 group-hover/img:opacity-90"
                                      />
                                      <div className="text-left pr-2">
                                        <span className="text-[11px] font-bold text-slate-800 block group-hover/img:text-blue-700 flex items-center gap-1">
                                          <Eye className="w-3 h-3 text-teal-600" />
                                          {evt.imageName || 'View Event Image'}
                                        </span>
                                        <span className="text-[10px] text-slate-500">Click to expand scan / photo</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 3: PROTOCOL ROADMAP & DOCUMENT */}
          {activeTab === 'protocol' && (() => {
            const attachedDocs: ProtocolDocument[] =
              selectedPatient.protocolDocuments && selectedPatient.protocolDocuments.length > 0
                ? selectedPatient.protocolDocuments
                : selectedPatient.protocolDocumentUrl
                ? [
                    {
                      id: 'doc-legacy',
                      name: selectedPatient.protocolDocumentName || 'Protocol Roadmap Document',
                      type: (selectedPatient.protocolDocumentType as any) || 'pdf',
                      url: selectedPatient.protocolDocumentUrl,
                      size: selectedPatient.protocolDocumentSize,
                      uploadedAt: selectedPatient.protocolDocumentUploadedAt || 'Attached',
                    },
                  ]
                : [];

            const currentDocIndex = Math.min(selectedProtocolDocIndex, Math.max(0, attachedDocs.length - 1));
            const currentDoc = attachedDocs[currentDocIndex];

            return (
              <div className="h-full min-h-0 space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50 p-4 rounded-xl border border-teal-200 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-300">
                        Chemotherapy Protocol Roadmap
                      </span>
                      {selectedPatient.treatmentStageOrPhase && (
                        <span className="text-xs font-bold text-teal-800 font-mono">
                          Current: {selectedPatient.treatmentStageOrPhase}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{selectedPatient.protocol}</h3>
                    <p className="text-xs text-slate-600">
                      Patient diagnosis: <strong className="text-slate-900">{selectedPatient.diagnosis}</strong>{selectedPatient.stage && selectedPatient.stage !== 'N/A' ? ` (${selectedPatient.stage})` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsProtocolViewerOpen(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      Open Full Roadmap Viewer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditPatientId(selectedPatient.id);
                        setIsEditPatientOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-teal-800 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {attachedDocs.length > 0 ? 'Manage / Add Files' : 'Upload PDF, JPG, DOCX'}
                    </button>
                  </div>
                </div>

                {/* Uploaded Documents View */}
                {attachedDocs.length > 0 && currentDoc ? (
                  <div className="space-y-3">
                    {/* Multi-Document Switcher Tabs */}
                    {attachedDocs.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                          Attached Files ({attachedDocs.length}):
                        </span>
                        {attachedDocs.map((doc, idx) => {
                          const isActive = idx === currentDocIndex;
                          const badgeColor =
                            doc.type === 'pdf'
                              ? 'text-rose-700'
                              : doc.type === 'image'
                              ? 'text-purple-700'
                              : doc.type === 'docx' || doc.type === 'doc'
                              ? 'text-blue-700'
                              : 'text-slate-700';

                          return (
                            <button
                              key={doc.id || idx}
                              type="button"
                              onClick={() => setSelectedProtocolDocIndex(idx)}
                              className={`px-3 py-1.5 text-xs rounded-lg border font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                                isActive
                                  ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span className={`text-[10px] font-mono uppercase px-1 py-0.2 rounded font-bold ${
                                isActive ? 'bg-white/20 text-white' : `bg-slate-100 ${badgeColor}`
                              }`}>
                                {doc.type}
                              </span>
                              <span className="truncate max-w-[180px]">{doc.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Active Document Viewer */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] border ${
                            currentDoc.type === 'pdf'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : currentDoc.type === 'image'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : currentDoc.type === 'docx' || currentDoc.type === 'doc'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {currentDoc.type}
                          </span>
                          <span className="font-bold text-slate-900">{currentDoc.name}</span>
                          {currentDoc.size && (
                            <span className="text-slate-500 text-[11px]">({currentDoc.size})</span>
                          )}
                          {currentDoc.uploadedAt && (
                            <span className="text-slate-400 text-[11px] font-mono">
                              • Uploaded {currentDoc.uploadedAt}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={currentDoc.url}
                            download={currentDoc.name || 'protocol_file'}
                            className="px-2.5 py-1 text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs"
                          >
                            <Download className="w-3 h-3 text-slate-600" />
                            Download File
                          </a>
                          <button
                            type="button"
                            onClick={() => setIsProtocolViewerOpen(true)}
                            className="px-2.5 py-1 text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded font-medium flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3 text-teal-600" />
                            Expand Viewer
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-900/5 flex items-center justify-center min-h-[480px]">
                        {currentDoc.type === 'pdf' ? (
                          <iframe
                            src={currentDoc.url}
                            title={currentDoc.name || 'Protocol Document'}
                            className="w-full h-[520px] rounded-lg border border-slate-300 bg-white"
                          />
                        ) : currentDoc.type === 'image' ? (
                          <img
                            src={currentDoc.url}
                            alt={currentDoc.name || 'Protocol Roadmap'}
                            className="max-w-full max-h-[520px] rounded-lg shadow-md object-contain"
                          />
                        ) : (
                          /* DOCX / DOC / Other File Preview Card */
                          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center max-w-md w-full space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
                              <FileText className="w-8 h-8" />
                            </div>
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900">
                                Microsoft Word / Document
                              </span>
                              <h4 className="font-bold text-slate-900 text-base mt-2 truncate">
                                {currentDoc.name}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1">
                                Size: {currentDoc.size || 'Standard'} • Uploaded {currentDoc.uploadedAt}
                              </p>
                            </div>
                            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              This protocol file is saved to the patient clinical record. Download to open in Microsoft Word, Google Docs, or your desktop document viewer.
                            </p>
                            <a
                              href={currentDoc.url}
                              download={currentDoc.name}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Download {currentDoc.name}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                /* Standard Pediatric Protocol Roadmap Schema */
                <div className="space-y-4">
                  {/* Prompt to upload custom PDF */}
                  <div className="p-4 bg-teal-50/50 border border-dashed border-teal-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 border border-teal-200 flex items-center justify-center shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">Have an official protocol PDF or roadmap flowchart?</strong>
                        <span className="text-slate-600">
                          Upload hospital or trial-specific documentation to cross-reference while reviewing this patient.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditPatientId(selectedPatient.id);
                        setIsEditPatientOpen(true);
                      }}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold whitespace-nowrap shadow-xs transition-colors shrink-0"
                    >
                      Upload Patient Protocol PDF
                    </button>
                  </div>

                  {/* Built-in Standard Clinical Guidelines */}
                  {(() => {
                    const std =
                      PEDIATRIC_STANDARD_PROTOCOLS[selectedPatient.diagnosis] ||
                      PEDIATRIC_STANDARD_PROTOCOLS['B-Cell Acute Lymphoblastic Leukemia (B-ALL)'];

                    return (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
                        <div className="border-b border-slate-200 pb-3">
                          <h4 className="font-bold text-slate-900 text-sm">{std.protocolName}</h4>
                          <p className="text-slate-600 mt-1">{std.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                            <span>Protocol Structure: <strong className="text-slate-800">{std.treatmentType}</strong></span>
                            <span>•</span>
                            <span>Expected Total Duration: <strong className="text-slate-800">{std.totalDuration}</strong></span>
                          </div>
                        </div>

                        {/* Phases */}
                        <div className="space-y-2.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                            Protocol Treatment Phases & Key Agents:
                          </span>
                          <div className="space-y-2">
                            {std.phases.map((ph, idx) => {
                              const isCurrent = selectedPatient.treatmentStageOrPhase
                                ? selectedPatient.treatmentStageOrPhase.toLowerCase().includes(ph.phaseName.toLowerCase().split(' ')[0])
                                : idx === 0;

                              return (
                                <div
                                  key={ph.phaseName}
                                  className={`p-3 rounded-lg border text-xs ${
                                    isCurrent ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-300' : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold text-slate-900">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                        {idx + 1}
                                      </span>
                                      <span>{ph.phaseName}</span>
                                      {isCurrent && (
                                        <span className="px-1.5 py-0.2 bg-teal-600 text-white rounded text-[10px] font-semibold">
                                          Current
                                        </span>
                                      )}
                                    </div>
                                    {ph.durationWeeks && (
                                      <span className="text-slate-500 font-mono text-[11px]">~{ph.durationWeeks} wks</span>
                                    )}
                                  </div>
                                  <p className="text-slate-600 mt-1 ml-6">{ph.description}</p>
                                  <div className="mt-2 ml-6 flex flex-wrap gap-1">
                                    {ph.keyDrugs.map((d) => (
                                      <span key={d} className="px-1.5 py-0.5 bg-white text-slate-800 border border-slate-300 rounded text-[11px]">
                                        {d}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Dose modifications */}
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] space-y-1">
                          <strong className="block font-bold text-amber-800">Dose Modification Guidelines:</strong>
                          <ul className="list-disc list-inside space-y-0.5">
                            {std.doseModificationGuidelines.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })()}
        </div>
      </div>

      {/* Window for Chemotherapy Dose Reduction Reason */}
      {doseReductionAppt && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Chemotherapy Dose Reduction Window</h3>
              </div>
              <button
                onClick={() => setDoseReductionAppt(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Selected Chemotherapy Regimen
                </span>
                <span className="font-bold text-slate-900 text-xs">{doseReductionAppt.regimenName}</span>
                <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                  Cycle {doseReductionAppt.cycleNumber} · Date: {formatClinicalDate(doseReductionAppt.scheduledDate)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dose Reduction Level *</label>
                <select
                  value={reductionPercent}
                  onChange={(e) => setReductionPercent(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-900"
                >
                  <option value="15% Reduction">15% Dose Reduction</option>
                  <option value="20% Reduction">20% Dose Reduction</option>
                  <option value="25% Reduction">25% Dose Reduction</option>
                  <option value="33% Reduction">33% Dose Reduction</option>
                  <option value="50% Reduction">50% Dose Reduction</option>
                  <option value="75% Reduction">75% Dose Reduction</option>
                  <option value="Custom Modified Dose">Custom Modified Protocol Dose</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Dose Reduction *</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {[
                    'Neutropenia',
                    'Renal Impairment',
                    'Grade 3 Mucositis',
                    'Ototoxicity',
                    'Transaminitis',
                    'Neuropathy',
                    'Poor Tolerance',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReductionReason(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        reductionReason === preset
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  required
                  value={reductionReason}
                  onChange={(e) => setReductionReason(e.target.value)}
                  placeholder="Specify clinical rationale: e.g. Grade 4 febrile neutropenia nadir with delayed count recovery"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDoseReductionAppt(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (doseReductionAppt) {
                      updateAppointment(doseReductionAppt.id, {
                        doseType: 'With Reduction',
                        reductionPercentage: reductionPercent,
                        reductionReason: reductionReason.trim() || 'Clinical dose modification',
                      });
                      setDoseReductionAppt(null);
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs"
                >
                  Save Dose Reduction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen / Expanded Protocol Roadmap Viewer Modal */}
      <ProtocolViewerModal
        patient={selectedPatient}
        isOpen={isProtocolViewerOpen}
        onClose={() => setIsProtocolViewerOpen(false)}
      />

      {/* Clinical Event Image Lightbox Modal */}
      {previewEventImage && (
        <div
          className="fixed inset-0 z-70 bg-slate-900/80 flex items-center justify-center p-3 sm:p-5"
          onClick={() => setPreviewEventImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900 truncate">{previewEventImage.title}</h3>
              </div>
              <button
                onClick={() => setPreviewEventImage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950/5">
              <img
                src={previewEventImage.url}
                alt={previewEventImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Chemotherapy Appointment Modal */}
      <EditAppointmentModal
        appointment={editingAppointment}
        patientName={selectedPatient.name}
        isOpen={isEditApptOpen}
        onClose={() => {
          setIsEditApptOpen(false);
          setEditingAppointment(null);
        }}
      />

      {/* Edit Clinical Event Modal */}
      <EditEventModal
        event={editingEvent}
        patientName={selectedPatient.name}
        isOpen={isEditEventOpen}
        onClose={() => {
          setIsEditEventOpen(false);
          setEditingEvent(null);
        }}
      />

      {/* End Chemotherapy Confirmation Dialog */}
      {isEndChemoModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-5 space-y-4 bg-white text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">End Chemo & Move to Follow-up</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEndChemoModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Moving <strong>{selectedPatient.name}</strong> to the Follow-up surveillance list. Please specify the date chemotherapy ended and the type of follow-up:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 flex items-center justify-between">
                  <span>Date of Ending Therapy *</span>
                  <span className="text-[10px] text-slate-500 font-mono">DD/MM/YYYY</span>
                </label>
                <ClinicalDateInput
                  required
                  value={endChemoDate}
                  onChange={(d) => setEndChemoDate(d)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">
                  Type of Follow-up *
                </label>
                <select
                  value={endChemoStatus}
                  onChange={(e) => setEndChemoStatus(e.target.value as FollowUpStatus)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50 text-slate-900"
                >
                  {FOLLOW_UP_TYPE_OPTIONS.map((opt) => (
                    <option className="text-slate-900 bg-white" key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEndChemoModalOpen(false)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  switchPatientCohort(selectedPatient.id, 'Under Follow up', {
                    followUpStartDate: endChemoDate,
                    followUpStatus: endChemoStatus,
                  });
                  setIsEndChemoModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Confirm & Move to Follow-up</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Relapse Confirmation Dialog */}
      {isRelapseModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-5 space-y-4 bg-white text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">Relapse → Return to Active Treatment</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRelapseModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to mark <strong>{selectedPatient.name}</strong> as relapsed and return them to the Active Chemotherapy cohort?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRelapseModalOpen(false)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  switchPatientCohort(selectedPatient.id, 'On Treatment');
                  setIsRelapseModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                <span>Confirm Relapse</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
