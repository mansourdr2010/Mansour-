import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Patient,
  ChemotherapyAppointment,
  MajorClinicalEvent,
  ColleagueNote,
  PediatricDiagnosis,
  TreatmentStatus,
  ChemotherapyStatus,
  FollowUpStatus,
} from '../types/oncology';
import { INITIAL_PATIENTS } from '../data/initialData';
import { CLINICAL_TODAY, isAppointmentMissed, calculateBSA, formatClinicalDate, isALLDiagnosis, sanitizeForFirestore } from '../utils/oncologyUtils';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY = 'pedonco_clinical_patients_v1';

export type ActiveTab = 'dashboard' | 'schedule' | 'alerts' | 'bsa-calc';

interface OncologyContextType {
  patients: Patient[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  selectedPatient: Patient | null;
  // Filters & Search
  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  diagnosisFilter: string;
  setDiagnosisFilter: (diagnosis: string) => void;
  treatmentStatusFilter: string;
  setTreatmentStatusFilter: (status: string) => void;
  // Date range for chemotherapy scheduler
  scheduleStartDate: string;
  setScheduleStartDate: (date: string) => void;
  scheduleEndDate: string;
  setScheduleEndDate: (date: string) => void;
  scheduleStatusFilter: string;
  setScheduleStatusFilter: (status: string) => void;
  // Computed alerts
  missedAppointments: Array<{ patient: Patient; appointment: ChemotherapyAppointment }>;
  // Clinical Operations
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  deletePatient: (patientId: string) => void;
  addAppointment: (appointment: ChemotherapyAppointment) => void;
  updateAppointment: (appointmentId: string, updates: Partial<ChemotherapyAppointment>) => void;
  deleteAppointment: (appointmentId: string) => void;
  markAppointmentAdministered: (appointmentId: string, administeredBy?: string) => void;
  markAppointmentMissed: (appointmentId: string, reason: string) => void;
  markAppointmentDelayed: (appointmentId: string, reason: string, newDate?: string) => void;
  rescheduleAppointment: (appointmentId: string, newDate: string, newTime?: string) => void;
  addMajorEvent: (event: MajorClinicalEvent) => void;
  updateMajorEvent: (patientId: string, event: MajorClinicalEvent) => void;
  deleteMajorEvent: (patientId: string, eventId: string) => void;
  addColleagueNote: (note: ColleagueNote) => void;
  resetToDemoData: () => void;
  switchPatientCohort: (
    patientId: string,
    targetStatus: TreatmentStatus,
    details?: {
      followUpStartDate?: string;
      followUpStatus?: FollowUpStatus;
      relapseReason?: string;
      lastChemoReceived?: string;
      lastChemoDate?: string;
    }
  ) => void;
  updateFollowUpStatus: (patientId: string, status: FollowUpStatus, lastVisitDate?: string) => void;
  // Modals
  isNewPatientOpen: boolean;
  setIsNewPatientOpen: (open: boolean) => void;
  isNewAppointmentOpen: boolean;
  setIsNewAppointmentOpen: (open: boolean) => void;
  newAppointmentPatientId: string | null;
  setNewAppointmentPatientId: (id: string | null) => void;
  isAddEventOpen: boolean;
  setIsAddEventOpen: (open: boolean) => void;
  addEventPatientId: string | null;
  setAddEventPatientId: (id: string | null) => void;
  isEditPatientOpen: boolean;
  setIsEditPatientOpen: (open: boolean) => void;
  editPatientId: string | null;
  setEditPatientId: (id: string | null) => void;
  isAddInvestigationOpen: boolean;
  setIsAddInvestigationOpen: (open: boolean) => void;
  investigationPatientId: string | null;
  setInvestigationPatientId: (id: string | null) => void;
  isPrintModalOpen: boolean;
  setIsPrintModalOpen: (open: boolean) => void;
}

const OncologyContext = createContext<OncologyContextType | undefined>(undefined);

export const OncologyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const normalizePatientData = (p: Patient): Patient => {
    const isALL = isALLDiagnosis(p.diagnosis);
    let stageOrPhase = p.treatmentStageOrPhase;
    if (isALL && stageOrPhase && stageOrPhase.toLowerCase().includes('cycle')) {
      stageOrPhase = 'Induction';
    }

    // Ensure all previous administered appointments use their scheduledDate for administeredAt
    const normalizedAppts = (p.appointments || []).map((a: ChemotherapyAppointment) => {
      if (a.status === 'Administered') {
        const timePart = a.scheduledTime && a.scheduledTime.includes(':') ? a.scheduledTime : '09:00';
        return {
          ...a,
          administeredAt: `${a.scheduledDate}T${timePart}:00.000Z`,
        };
      }
      return a;
    });

    // Compute latest administered chemo date if any
    const administeredList = normalizedAppts.filter((a) => a.status === 'Administered');
    let lastChemoDate = p.lastChemoDate;
    let lastChemoReceived = p.lastChemoReceived;
    if (administeredList.length > 0) {
      const latest = [...administeredList].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))[0];
      lastChemoDate = latest.scheduledDate;
      lastChemoReceived = latest.regimenName;
    }

    return {
      ...p,
      treatmentStageOrPhase: stageOrPhase || (isALL ? 'Induction' : undefined),
      appointments: normalizedAppts,
      lastChemoDate,
      lastChemoReceived,
    };
  };

  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizePatientData);
        }
      }
    } catch (e) {
      console.error('Failed to load saved patient data', e);
    }
    return INITIAL_PATIENTS.map(normalizePatientData);
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Global search & filters
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState('All');
  const [treatmentStatusFilter, setTreatmentStatusFilter] = useState('On Treatment');

  // Date range scheduler defaults: Today to 7 days ahead
  const [scheduleStartDate, setScheduleStartDate] = useState('2026-10-20');
  const [scheduleEndDate, setScheduleEndDate] = useState('2026-10-27');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState('All');

  // Modals state
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [newAppointmentPatientId, setNewAppointmentPatientId] = useState<string | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [addEventPatientId, setAddEventPatientId] = useState<string | null>(null);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);
  const [isAddInvestigationOpen, setIsAddInvestigationOpen] = useState(false);
  const [investigationPatientId, setInvestigationPatientId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const savePatientToFirestore = async (pat: Patient) => {
    try {
      const cleanData = sanitizeForFirestore(pat);
      await setDoc(doc(db, 'patients', pat.id), cleanData);
    } catch (err) {
      console.error('Failed to save patient to Firestore:', err);
    }
  };

  const removePatientFromFirestore = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'patients', id));
    } catch (err) {
      console.error('Failed to delete patient from Firestore:', err);
    }
  };

  const setPatientsAndSync = (updater: Patient[] | ((prev: Patient[]) => Patient[])) => {
    setPatients((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setTimeout(() => {
        next.forEach((p) => savePatientToFirestore(p));
      }, 0);
      return next;
    });
  };

  // Persist patients to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } catch (e) {
      console.error('Failed to persist patients', e);
    }
  }, [patients]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Compute missed & overdue appointments
  const missedAppointments = useMemo(() => {
    const list: Array<{ patient: Patient; appointment: ChemotherapyAppointment }> = [];
    for (const patient of patients) {
      for (const apt of patient.appointments) {
        if (isAppointmentMissed(apt)) {
          list.push({ patient, appointment: apt });
        }
      }
    }
    list.sort((a, b) => a.appointment.scheduledDate.localeCompare(b.appointment.scheduledDate));
    return list;
  }, [patients]);

  const addPatient = (newPat: Patient) => {
    setPatientsAndSync((prev) => [newPat, ...prev]);
  };

  const updatePatient = (updated: Patient) => {
    setPatientsAndSync((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const deletePatient = (patientId: string) => {
    setPatientsAndSync((prev) => prev.filter((p) => p.id !== patientId));
    if (selectedPatientId === patientId) {
      setSelectedPatientId(null);
    }
    removePatientFromFirestore(patientId);
  };

  const addAppointment = (appointment: ChemotherapyAppointment) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        if (pat.id === appointment.patientId) {
          const updatedAppts = [...pat.appointments, appointment];
          return {
            ...pat,
            appointments: updatedAppts,
          };
        }
        return pat;
      })
    );
  };

  const updateAppointment = (appointmentId: string, updates: Partial<ChemotherapyAppointment>) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        const hasAppt = pat.appointments.some((a) => a.id === appointmentId);
        if (!hasAppt) return pat;
        const updatedAppts = pat.appointments.map((a) => {
          if (a.id === appointmentId) {
            const updated = { ...a, ...updates };
            if (updates.scheduledDate) {
              updated.scheduledDate = updates.scheduledDate;
            }
            if (updated.status === 'Administered') {
              const timePart = updated.scheduledTime && updated.scheduledTime.includes(':') ? updated.scheduledTime : '09:00';
              updated.administeredAt = `${updated.scheduledDate}T${timePart}:00.000Z`;
            }
            return updated;
          }
          return a;
        });

        const allAdministered = updatedAppts.filter((a) => a.status === 'Administered');
        const latestAdministered = allAdministered.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))[0];
        const lastChemoDate = latestAdministered ? latestAdministered.scheduledDate : pat.lastChemoDate;
        const lastChemoReceived = latestAdministered ? latestAdministered.regimenName : pat.lastChemoReceived;

        return {
          ...pat,
          appointments: updatedAppts,
          lastChemoDate,
          lastChemoReceived,
        };
      })
    );
  };

  const deleteAppointment = (appointmentId: string) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        const hasAppt = pat.appointments.some((a) => a.id === appointmentId);
        if (!hasAppt) return pat;
        return {
          ...pat,
          appointments: pat.appointments.filter((a) => a.id !== appointmentId),
        };
      })
    );
  };

  const markAppointmentAdministered = (appointmentId: string, administeredBy?: string) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        const appt = pat.appointments.find((a) => a.id === appointmentId);
        if (!appt) return pat;

        // Save with the date it was scheduled as, not the date the mark was made (unless rescheduled, which already updated scheduledDate)
        const administeredDate = appt.scheduledDate;
        const timePart = appt.scheduledTime && appt.scheduledTime.includes(':') ? appt.scheduledTime : '09:00';
        const administeredTimestamp = `${administeredDate}T${timePart}:00.000Z`;

        const updatedAppts = pat.appointments.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status: 'Administered' as ChemotherapyStatus,
                administeredAt: administeredTimestamp,
                administeredBy: administeredBy || 'Dr. Mansour, MD',
              }
            : a
        );

        // Advance cycle number if administered cycle equals current cycle
        const curCycle = pat.currentCycle || 1;
        const totCycle = pat.totalPlannedCycles || 6;
        const newCurrentCycle =
          appt.cycleNumber >= curCycle && appt.cycleNumber < totCycle
            ? appt.cycleNumber
            : pat.currentCycle;

        // Ensure lastChemoDate is set to the scheduled date of the latest administered chemo
        const allAdministered = updatedAppts.filter((a) => a.status === 'Administered');
        const latestAdministered = allAdministered.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))[0];
        const lastChemoDate = latestAdministered ? latestAdministered.scheduledDate : administeredDate;
        const lastChemoReceived = latestAdministered ? latestAdministered.regimenName : appt.regimenName;

        return {
          ...pat,
          currentCycle: newCurrentCycle,
          lastChemoReceived,
          lastChemoDate,
          appointments: updatedAppts,
          colleagueNotes: [
            {
              id: `note-${Date.now()}`,
              patientId: pat.id,
              timestamp: `${administeredDate} 12:00`,
              author: administeredBy || 'Dr. Mansour',
              role: 'Pediatric Oncologist',
              tag: 'Medication',
              text: `Chemotherapy cycle ${appt.cycleNumber} (${appt.regimenName}) scheduled for ${administeredDate} administered without acute toxicity.`,
            },
            ...pat.colleagueNotes,
          ],
        };
      })
    );
  };

  const markAppointmentMissed = (appointmentId: string, reason: string) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        const hasAppt = pat.appointments.some((a) => a.id === appointmentId);
        if (!hasAppt) return pat;
        const updatedAppts = pat.appointments.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status: 'Missed' as ChemotherapyStatus,
                missedReason: reason || 'Patient absent; session missed.',
              }
            : a
        );
        return {
          ...pat,
          appointments: updatedAppts,
          events: [
            {
              id: `evt-missed-${Date.now()}`,
              patientId: pat.id,
              date: CLINICAL_TODAY,
              category: 'Dose Modification / Delay',
              title: 'Missed Chemotherapy Session Alert',
              description: `Missed scheduled chemotherapy: ${reason || 'Patient absent'}. Requires clinical review for rescheduling.`,
              severity: 'Severe / Grade 3-4',
              recordedBy: 'Dr. Mansour, MD',
            },
            ...pat.events,
          ],
        };
      })
    );
  };

  const markAppointmentDelayed = (appointmentId: string, reason: string, newDate?: string) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        const hasAppt = pat.appointments.some((a) => a.id === appointmentId);
        if (!hasAppt) return pat;
        const updatedAppts = pat.appointments.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status: 'Delayed' as ChemotherapyStatus,
                delayReason: reason || 'Clinical hold',
                scheduledDate: newDate || a.scheduledDate,
              }
            : a
        );
        return {
          ...pat,
          appointments: updatedAppts,
          events: [
            {
              id: `evt-delayed-${Date.now()}`,
              patientId: pat.id,
              date: CLINICAL_TODAY,
              category: 'Dose Modification / Delay',
              title: 'Chemotherapy Cycle Delayed',
              description: `Cycle delayed: ${reason}. Rescheduled to ${newDate || 'TBD'}.`,
              severity: 'Moderate',
              recordedBy: 'Dr. Mansour, MD',
            },
            ...pat.events,
          ],
        };
      })
    );
  };

  const rescheduleAppointment = (appointmentId: string, newDate: string, newTime?: string) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        const hasAppt = pat.appointments.some((a) => a.id === appointmentId);
        if (!hasAppt) return pat;
        const updatedAppts = pat.appointments.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status: 'Scheduled' as ChemotherapyStatus,
                scheduledDate: newDate,
                administeredAt: undefined,
                scheduledTime: newTime || a.scheduledTime,
                missedReason: undefined,
                delayReason: undefined,
              }
            : a
        );
        return {
          ...pat,
          appointments: updatedAppts,
        };
      })
    );
  };

  const addMajorEvent = (event: MajorClinicalEvent) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        if (pat.id === event.patientId) {
          return {
            ...pat,
            events: [event, ...pat.events],
          };
        }
        return pat;
      })
    );
  };

  const updateMajorEvent = (patientId: string, updatedEvent: MajorClinicalEvent) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        const hasEvent = pat.events.some((e) => e.id === updatedEvent.id);
        const matchesPatient = pat.id === patientId || pat.id === updatedEvent.patientId || hasEvent;
        if (!matchesPatient) return pat;
        return {
          ...pat,
          events: pat.events.map((e) =>
            e.id === updatedEvent.id ? { ...e, ...updatedEvent, date: updatedEvent.date } : e
          ),
        };
      })
    );
  };

  const deleteMajorEvent = (patientId: string, eventId: string) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        const hasEvent = pat.events.some((e) => e.id === eventId);
        const matchesPatient = pat.id === patientId || hasEvent;
        if (!matchesPatient) return pat;
        return {
          ...pat,
          events: pat.events.filter((e) => e.id !== eventId),
        };
      })
    );
  };

  const addColleagueNote = (note: ColleagueNote) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        if (pat.id === note.patientId) {
          return {
            ...pat,
            colleagueNotes: [note, ...pat.colleagueNotes],
          };
        }
        return pat;
      })
    );
  };

  const resetToDemoData = () => {
    if (window.confirm('Reset all patients and chemotherapy schedules to standard pediatric oncology clinical demo data?')) {
      const normalized = INITIAL_PATIENTS.map(normalizePatientData);
      setPatients(normalized);
      normalized.forEach((p) => savePatientToFirestore(p));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      setSelectedPatientId(null);
    }
  };

  const switchPatientCohort = (
    patientId: string,
    targetStatus: TreatmentStatus,
    details?: {
      followUpStartDate?: string;
      followUpStatus?: FollowUpStatus;
      relapseReason?: string;
      lastChemoReceived?: string;
      lastChemoDate?: string;
    }
  ) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        if (pat.id !== patientId) return pat;
        if (targetStatus === 'Under Follow up') {
          const fDate = details?.followUpStartDate || CLINICAL_TODAY;
          const fStatus: FollowUpStatus = details?.followUpStatus || 'Regular Follow-up';
          const newEvent: MajorClinicalEvent = {
            id: `evt-${Date.now()}`,
            patientId: pat.id,
            date: fDate,
            category: 'Milestone & Remission',
            title: 'Completion of Chemotherapy: Transitioned to Off-Therapy Follow-up',
            description: `Protocol therapy concluded. Initiated surveillance follow-up (${fStatus}).`,
            severity: 'Routine / Favorable',
            recordedBy: 'Dr. Mansour, MD',
          };
          return {
            ...pat,
            status: 'Under Follow up' as TreatmentStatus,
            followUpStartDate: fDate,
            lastVisitDate: details?.followUpStartDate || pat.lastVisitDate || CLINICAL_TODAY,
            followUpStatus: fStatus,
            lastChemoReceived: details?.lastChemoReceived || pat.lastChemoReceived,
            lastChemoDate: details?.lastChemoDate || pat.lastChemoDate,
            summaryProgress: `Chemotherapy protocol completed on ${formatClinicalDate(fDate)}. Transferred to Off-Therapy Surveillance cohort (${fStatus}).`,
            events: [newEvent, ...pat.events],
          };
        } else {
          // Relapse / Resumption of active treatment
          const relapseDate = CLINICAL_TODAY;
          const relapseDesc = details?.relapseReason || 'Relapse / progressive disease identified. Active chemotherapy protocol resumed.';
          const newEvent: MajorClinicalEvent = {
            id: `evt-${Date.now()}`,
            patientId: pat.id,
            date: relapseDate,
            category: 'Dose Modification / Delay',
            title: 'Relapse: Resumed Active Chemotherapy Protocol',
            description: relapseDesc,
            severity: 'Severe / Grade 3-4',
            recordedBy: 'Dr. Mansour, MD',
          };
          return {
            ...pat,
            status: 'On Treatment' as TreatmentStatus,
            followUpStatus: undefined,
            summaryProgress: `Relapse / active chemotherapy restarted on ${formatClinicalDate(relapseDate)}. ${relapseDesc}`,
            events: [newEvent, ...pat.events],
          };
        }
      })
    );
  };

  const updateFollowUpStatus = (patientId: string, status: FollowUpStatus, lastVisitDate?: string) => {
    setPatientsAndSync((prev) =>
      prev.map((pat) => {
        if (pat.id !== patientId) return pat;
        return {
          ...pat,
          followUpStatus: status,
          lastVisitDate: lastVisitDate || pat.lastVisitDate || CLINICAL_TODAY,
        };
      })
    );
  };

  return (
    <OncologyContext.Provider
      value={{
        patients,
        activeTab,
        setActiveTab,
        selectedPatientId,
        setSelectedPatientId,
        selectedPatient,
        isSearchOpen,
        setIsSearchOpen,
        searchQuery,
        setSearchQuery,
        diagnosisFilter,
        setDiagnosisFilter,
        treatmentStatusFilter,
        setTreatmentStatusFilter,
        scheduleStartDate,
        setScheduleStartDate,
        scheduleEndDate,
        setScheduleEndDate,
        scheduleStatusFilter,
        setScheduleStatusFilter,
        missedAppointments,
        addPatient,
        updatePatient,
        deletePatient,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        markAppointmentAdministered,
        markAppointmentMissed,
        markAppointmentDelayed,
        rescheduleAppointment,
        addMajorEvent,
        updateMajorEvent,
        deleteMajorEvent,
        addColleagueNote,
        resetToDemoData,
        switchPatientCohort,
        updateFollowUpStatus,
        isNewPatientOpen,
        setIsNewPatientOpen,
        isNewAppointmentOpen,
        setIsNewAppointmentOpen,
        newAppointmentPatientId,
        setNewAppointmentPatientId,
        isAddEventOpen,
        setIsAddEventOpen,
        addEventPatientId,
        setAddEventPatientId,
        isEditPatientOpen,
        setIsEditPatientOpen,
        editPatientId,
        setEditPatientId,
        isAddInvestigationOpen,
        setIsAddInvestigationOpen,
        investigationPatientId,
        setInvestigationPatientId,
        isPrintModalOpen,
        setIsPrintModalOpen,
      }}
    >
      {children}
    </OncologyContext.Provider>
  );
};

export function useOncology() {
  const context = useContext(OncologyContext);
  if (!context) {
    throw new Error('useOncology must be used within an OncologyProvider');
  }
  return context;
}
