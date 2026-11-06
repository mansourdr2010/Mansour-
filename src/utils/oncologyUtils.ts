import { ChemotherapyAppointment, Patient } from '../types/oncology';

// Clinical reference baseline date (Current local applet date is 2026-10-20)
export const CLINICAL_TODAY = '2026-10-20';

/**
 * Calculate pediatric Body Surface Area (BSA) using the Mosteller Formula:
 * BSA (m²) = sqrt((height (cm) * weight (kg)) / 3600)
 */
export function calculateBSA(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return 0;
  const bsa = Math.sqrt((heightCm * weightKg) / 3600);
  return Math.round(bsa * 100) / 100;
}

/**
 * Alternative Gehan & George pediatric formula for infants/children:
 * BSA = 0.0235 * (height^0.42246) * (weight^0.51456)
 */
export function calculateGehanBSA(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return 0;
  const bsa = 0.0235 * Math.pow(heightCm, 0.42246) * Math.pow(weightKg, 0.51456);
  return Math.round(bsa * 100) / 100;
}

/**
 * Calculate pediatric age by days and months (and years if >= 1) from Date of Birth (DOB)
 */
export function calculateAgeFromDob(
  dobString: string,
  refDateString: string = CLINICAL_TODAY
): { years: number; months: number; days: number; displayText: string } {
  if (!dobString) return { years: 0, months: 0, days: 0, displayText: '0 days' };
  const dobParts = dobString.split('-');
  const refParts = refDateString.split('-');
  if (dobParts.length !== 3 || refParts.length !== 3) {
    return { years: 0, months: 0, days: 0, displayText: '0 days' };
  }

  const dobDate = new Date(parseInt(dobParts[0], 10), parseInt(dobParts[1], 10) - 1, parseInt(dobParts[2], 10));
  const refDate = new Date(parseInt(refParts[0], 10), parseInt(refParts[1], 10) - 1, parseInt(refParts[2], 10));

  let years = refDate.getFullYear() - dobDate.getFullYear();
  let months = refDate.getMonth() - dobDate.getMonth();
  let days = refDate.getDate() - dobDate.getDate();

  if (days < 0) {
    // Borrow days from previous month
    const prevMonthLastDay = new Date(refDate.getFullYear(), refDate.getMonth(), 0).getDate();
    days += prevMonthLastDay;
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) {
    years = 0;
    months = 0;
    days = 0;
  }

  let displayText = '';
  if (years > 0) {
    displayText = months > 0 ? `${years} yrs, ${months} mos` : `${years} yrs, 0 mos`;
  } else {
    displayText = `${months} mos`;
  }

  return { years, months, days, displayText };
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToIso(dateStr: string, days: number): string {
  try {
    const parts = (dateStr || getTodayDateString()).slice(0, 10).split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}

/**
 * Get date range for 'This Week' and 'Following Week' starting on Sunday
 * Calculates from the current date of the day by default
 */
export function getSundayWeekRanges(refDateStr?: string) {
  const base = refDateStr || getTodayDateString();
  const [y, m, d] = base.split('-').map(Number);
  const current = new Date(y, m - 1, d);
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...

  const thisWeekSunday = new Date(current);
  thisWeekSunday.setDate(current.getDate() - dayOfWeek);

  const thisWeekSaturday = new Date(thisWeekSunday);
  thisWeekSaturday.setDate(thisWeekSunday.getDate() + 6);

  const nextWeekSunday = new Date(thisWeekSunday);
  nextWeekSunday.setDate(thisWeekSunday.getDate() + 7);

  const nextWeekSaturday = new Date(nextWeekSunday);
  nextWeekSaturday.setDate(nextWeekSunday.getDate() + 6);

  const toIso = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    thisWeek: {
      start: toIso(thisWeekSunday),
      end: toIso(thisWeekSaturday),
    },
    nextWeek: {
      start: toIso(nextWeekSunday),
      end: toIso(nextWeekSaturday),
    },
  };
}

/**
 * Format ISO date string into strictly day/month/year all numbers: "DD/MM/YYYY"
 */
export function formatClinicalDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const clean = dateStr.slice(0, 10);
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && month >= 1 && month <= 12 && !isNaN(year)) {
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(month).padStart(2, '0');
        return `${dayStr}/${monthStr}/${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dayStr = String(d.getDate()).padStart(2, '0');
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      return `${dayStr}/${monthStr}/${d.getFullYear()}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Get full day name (e.g. "Sunday", "Monday", "Tuesday") from date string
 */
export function getDayOfWeekName(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const clean = dateStr.slice(0, 10);
    if (clean.includes('-')) {
      const parts = clean.split('-').map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] || '';
      }
    }
    if (clean.includes('/')) {
      const parts = clean.split('/').map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const d = new Date(parts[2], parts[1] - 1, parts[0]);
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] || '';
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] || '';
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Determine if an appointment is considered "missed":
 * Either explicitly status === 'Missed', or status is 'Scheduled' but the date is strictly in the past (< CLINICAL_TODAY).
 */
export function isAppointmentMissed(apt: ChemotherapyAppointment): boolean {
  if (apt.status === 'Missed') return true;
  if (apt.status === 'Scheduled' && apt.scheduledDate < CLINICAL_TODAY) return true;
  return false;
}

/**
 * Get all missed or overdue appointments across patients
 */
export function getMissedAppointments(patients: Patient[]): Array<{
  patient: Patient;
  appointment: ChemotherapyAppointment;
}> {
  const result: Array<{ patient: Patient; appointment: ChemotherapyAppointment }> = [];
  for (const patient of patients) {
    for (const apt of patient.appointments) {
      if (isAppointmentMissed(apt)) {
        result.push({ patient, appointment: apt });
      }
    }
  }
  // Sort with most overdue first
  result.sort((a, b) => a.appointment.scheduledDate.localeCompare(b.appointment.scheduledDate));
  return result;
}

/**
 * Get the next upcoming scheduled appointment for a patient
 */
export function getNextAppointment(patient: Patient): ChemotherapyAppointment | undefined {
  const upcoming = patient.appointments
    .filter((a) => a.status === 'Scheduled' && a.scheduledDate >= CLINICAL_TODAY)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  return upcoming[0];
}

/**
 * Filter appointments within a date range (inclusive)
 */
export function filterAppointmentsByDateRange(
  patients: Patient[],
  startDate: string,
  endDate: string,
  diagnosisFilter: string = 'All',
  statusFilter: string = 'All',
  treatmentStatusFilter: string = 'All'
): Array<{ patient: Patient; appointment: ChemotherapyAppointment }> {
  const results: Array<{ patient: Patient; appointment: ChemotherapyAppointment }> = [];

  for (const patient of patients) {
    if (diagnosisFilter !== 'All' && patient.diagnosis !== diagnosisFilter) continue;
    if (treatmentStatusFilter !== 'All' && patient.status !== treatmentStatusFilter) continue;

    for (const apt of patient.appointments) {
      if (apt.scheduledDate >= startDate && apt.scheduledDate <= endDate) {
        if (statusFilter !== 'All' && apt.status !== statusFilter) {
          // If filtering for "Missed", also check if overdue scheduled
          if (statusFilter === 'Missed' && isAppointmentMissed(apt)) {
            results.push({ patient, appointment: apt });
          }
          continue;
        }
        results.push({ patient, appointment: apt });
      }
    }
  }

  // Sort chronologically by date and time
  results.sort((a, b) => {
    const cmp = a.appointment.scheduledDate.localeCompare(b.appointment.scheduledDate);
    if (cmp !== 0) return cmp;
    return (a.appointment.scheduledTime || '').localeCompare(b.appointment.scheduledTime || '');
  });

  return results;
}

/**
 * Export data as clean JSON for backup/collaboration
 */
export function exportPatientsToJson(patients: Patient[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(patients, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `pedonco_patients_export_${CLINICAL_TODAY}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Export Chemotherapy Schedule as CSV
 */
export function exportScheduleToCsv(
  items: Array<{ patient: Patient; appointment: ChemotherapyAppointment }>,
  rangeLabel: string
): void {
  const headers = [
    'Date',
    'Time',
    'Patient Name',
    'MRN',
    'National ID',
    'Age',
    'Diagnosis',
    'Stage',
    'Date of Diagnosis',
    'Last Chemo Received',
    'Last Chemo Date',
    'Major Comorbidity',
    'Protocol',
    'Cycle',
    'Day',
    'Regimen Name',
    'Drugs & Doses',
    'Clinical Remarks & Precautions',
    'Status',
    'Attending Oncologist',
  ];

  const rows = items.map(({ patient, appointment }) => [
    appointment.scheduledDate,
    appointment.scheduledTime || '',
    `"${patient.name}"`,
    patient.mrn,
    patient.nationalId || '',
    `${patient.ageYears} yrs`,
    `"${patient.diagnosis}"`,
    `"${patient.stage || ''}"`,
    patient.dateOfDiagnosis || '',
    `"${patient.lastChemoReceived || ''}"`,
    patient.lastChemoDate || '',
    `"${patient.majorComorbidity || ''}"`,
    `"${patient.protocol}"`,
    `Cycle ${appointment.cycleNumber}`,
    `Day ${appointment.dayInCycle}`,
    `"${appointment.regimenName}"`,
    `"${appointment.drugs.map((d) => `${d.name}: ${d.dose} (${d.route})`).join('; ')}"`,
    `"${appointment.remarks.replace(/"/g, '""')}"`,
    appointment.status,
    `"${patient.attendingOncologist}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `chemo_schedule_${rangeLabel.replace(/\s+/g, '_')}_${CLINICAL_TODAY}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Remove duplicate Cycle and Day mentions from regimen name when already displayed in a dedicated badge
 * (e.g. "Interim Maintenance: MTX Cycle 3 Day 15" -> "Interim Maintenance: MTX")
 */
export function formatRegimenNameWithoutDuplicate(
  regimenName: string,
  cycleNumber?: number,
  dayInCycle?: number,
  phaseName?: string
): string {
  if (!regimenName) return '';
  let cleaned = regimenName;

  // If phaseName is provided, strip redundant leading phase name (e.g. "Interim Maintenance: MTX" -> "MTX")
  if (phaseName) {
    const basePhase = phaseName.replace(/\s*\d+$/, '').trim();
    cleaned = cleaned.replace(new RegExp(`^${phaseName}\\s*[:\\-]?\\s*`, 'gi'), '');
    if (basePhase) {
      cleaned = cleaned.replace(new RegExp(`^${basePhase}\\s*[:\\-]?\\s*`, 'gi'), '');
    }
  }

  // Also strip any generic "Interim Maintenance:" or "Consolidation:" prefix if present
  cleaned = cleaned
    .replace(/^(?:Induction|Consolidation|Interim Maintenance|Delayed Intensification|Maintenance)\s*(?:\d+)?\s*[:\-]\s*/gi, '')
    .replace(/\bCycle\s*\d+\s*(?:·|-)?\s*Day\s*\d+\b/gi, '')
    .replace(/^Cycle\s*\d+\s*[:\-]?\s*/gi, '');

  if (cycleNumber !== undefined && dayInCycle !== undefined) {
    cleaned = cleaned.replace(
      new RegExp(`\\bCycle\\s*${cycleNumber}\\s*(?:·|-)?\\s*Day\\s*${dayInCycle}\\b`, 'gi'),
      ''
    );
  }

  if (cycleNumber !== undefined) {
    cleaned = cleaned.replace(new RegExp(`^Cycle\\s*${cycleNumber}\\s*[:\\-]?\\s*`, 'gi'), '');
    cleaned = cleaned.replace(new RegExp(`\\bCycle\\s*${cycleNumber}\\b`, 'gi'), '');
  }

  if (dayInCycle !== undefined) {
    cleaned = cleaned.replace(new RegExp(`\\(?Day\\s*${dayInCycle}\\)?`, 'gi'), '');
  }

  cleaned = cleaned
    .replace(/\s*:\s*$/, '')
    .replace(/^\s*:\s*/, '')
    .replace(/\s*-\s*$/, '')
    .replace(/^\s*-\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned || regimenName;
}

/**
 * Check if diagnosis is Acute Lymphoblastic Leukemia (ALL, B-ALL, T-ALL)
 */
export function isALLDiagnosis(diag?: string): boolean {
  if (!diag) return false;
  const lower = diag.toLowerCase();
  return (
    lower.includes('acute lymphoblastic') ||
    lower.includes('(all)') ||
    lower.includes('b-all') ||
    lower.includes('t-all') ||
    lower === 'all'
  );
}

/**
 * Get previously entered treatment phases for a patient along with standard ALL phases
 */
export function getPatientTreatmentPhases(patient?: Patient): string[] {
  const phasesSet = new Set<string>();

  // 1. Standard treatment phases (Induction, Interim Maintenance, Delayed Intensification 1 & 2, Maintenance)
  const standardPhases = [
    'Induction',
    'Consolidation',
    'Interim Maintenance 1',
    'Delayed Intensification 1',
    'Interim Maintenance 2',
    'Delayed Intensification 2',
    'Maintenance',
  ];
  for (const sp of standardPhases) {
    phasesSet.add(sp);
  }

  // 2. Previously entered phase in patient's clinical profile (strictly phases, never cycles or weeks)
  if (patient?.treatmentStageOrPhase) {
    const cleaned = patient.treatmentStageOrPhase.replace(/\s*\(.*?\)/, '').trim();
    if (cleaned && !cleaned.toLowerCase().includes('cycle') && !cleaned.toLowerCase().includes('week')) {
      phasesSet.add(cleaned);
    }
  }

  // 3. Previously entered phases from all appointments for this patient
  if (patient?.appointments) {
    for (const a of patient.appointments) {
      if (a.phaseName && a.phaseName.trim()) {
        const ph = a.phaseName.trim();
        if (!ph.toLowerCase().includes('cycle') && !ph.toLowerCase().includes('week')) {
          phasesSet.add(ph);
        }
      }
    }
  }

  // Ensure 'cycle' and 'week' strings (e.g. 'cycle 2 of 4') are strictly excluded
  return Array.from(phasesSet).filter(
    (p) => !p.toLowerCase().includes('cycle') && !p.toLowerCase().includes('week')
  );
}

/**
 * Format chemotherapy appointment label according to schedule type.
 * For Acute Lymphoblastic Leukemia (ALL) patients, shows treatment phases (Induction, Interim Maintenance, etc.) NOT cycles.
 */
export function formatAppointmentScheduleLabel(
  appt: {
    scheduleType?: 'Cycle' | 'Week' | 'Phase';
    phaseName?: string;
    weekNumber?: number;
    cycleNumber?: number;
    dayInCycle?: number;
    diagnosis?: string;
  },
  patientDiagnosis?: string
): string {
  const diagnosis = patientDiagnosis || appt.diagnosis;
  const isALL = isALLDiagnosis(diagnosis);

  // If ALL or explicit Phase tracking:
  // Non-maintenance phases (Induction, Consolidation, etc.) do not use cycles.
  // BUT when choosing Maintenance in ALL, add cycle with its number!
  if (isALL || appt.scheduleType === 'Phase' || appt.phaseName) {
    const phase = appt.phaseName || 'Phase';
    const isMaintenance =
      phase.toLowerCase().includes('maintenance') &&
      !phase.toLowerCase().includes('interim');
    if (isMaintenance && appt.cycleNumber) {
      return `${phase} · Cycle ${appt.cycleNumber}${appt.dayInCycle ? ` · Day ${appt.dayInCycle}` : ''}`;
    }
    return appt.dayInCycle ? `${phase} · Day ${appt.dayInCycle}` : phase;
  }

  // For Week tracking: Clean week label without Day
  if (appt.scheduleType === 'Week' || (appt.weekNumber && !appt.phaseName)) {
    const wk = appt.weekNumber || appt.cycleNumber || 1;
    return `Week ${wk}`;
  }

  if (appt.cycleNumber !== undefined) {
    return `Cycle ${appt.cycleNumber}${appt.dayInCycle ? ` · Day ${appt.dayInCycle}` : ''}`;
  }

  return '';
}

/**
 * Normalize diagnosis string to clean standard format with abbreviation in brackets
 */
export function normalizeDiagnosisDisplay(diag: string): string {
  if (!diag) return '';
  if (diag.includes('High-Risk Neuroblastoma') || diag === 'Neuroblastoma') {
    return 'Neuroblastoma (NB)';
  }
  if (
    diag.includes('Acute Lymphoblastic Leukemia') ||
    diag === 'B-ALL' ||
    diag === 'T-ALL' ||
    diag.includes('(B-ALL)') ||
    diag.includes('(T-ALL)')
  ) {
    return 'Acute Lymphoblastic Leukemia (ALL)';
  }
  if (
    diag.toLowerCase().includes('wilm') ||
    diag.toLowerCase().includes('nephroblastoma')
  ) {
    return "Wilm's Tumor (WT)";
  }
  if (
    diag.toLowerCase().includes('clear cell sarcoma') ||
    diag.includes('CCSK')
  ) {
    return 'Clear Cell Sarcoma of the Kidney (CCSK)';
  }
  if (
    (diag.toLowerCase().includes('rhabdoid') && diag.toLowerCase().includes('kidney')) ||
    diag.includes('RTK')
  ) {
    return 'Rhabdoid Tumor of the Kidney (RTK)';
  }
  if (diag.includes('Chronic Myeloid') || diag === 'CML') {
    return 'Chronic Myeloid Leukemia (CML)';
  }
  if (diag.includes('Juvenile Myelomonocytic') || diag === 'JMML') {
    return 'Juvenile Myelomonocytic Leukemia (JMML)';
  }
  if (diag.includes('Myelodysplastic') || diag === 'MDS') {
    return 'Myelodysplastic Syndrome/Neoplasm (MDS)';
  }
  if (diag.includes('Hemophagocytic') || diag === 'HLH') {
    return 'Hemophagocytic Lymphohistiocytosis (HLH)';
  }
  if (diag === 'Medulloblastoma' || diag.includes('Medulloblastoma (CNS)')) {
    return 'Medulloblastoma (MB)';
  }
  if (diag === 'Osteosarcoma') return 'Osteosarcoma (OS)';
  if (diag === 'Ewing Sarcoma') return 'Ewing Sarcoma (ES)';
  if (diag === 'Hodgkin Lymphoma') return 'Hodgkin Lymphoma (HL)';
  if (diag === 'Burkitt Lymphoma' || diag === 'Non-Hodgkin Lymphoma') {
    return 'Non-Hodgkin Lymphoma (NHL)';
  }
  if (diag === 'Rhabdomyosarcoma') return 'Rhabdomyosarcoma (RMS)';
  if (diag === 'Acute Myeloid Leukemia') return 'Acute Myeloid Leukemia (AML)';
  return diag;
}

/**
 * Check if a chemotherapy drug is an Intrathecal (IT) formulation or central nervous system route
 */
export function isIntrathecalDrug(drugNameOrRoute?: string): boolean {
  if (!drugNameOrRoute) return false;
  const s = drugNameOrRoute.toLowerCase();
  return (
    s.includes('intrathecal') ||
    s.includes('(it)') ||
    s.includes('it-mtx') ||
    s.includes('it mtx') ||
    s.includes('it triple') ||
    s.startsWith('it ')
  );
}

/**
 * Extract clean clinical abbreviation for diagnosis (e.g. ALL, NB, WT, MB, AML, OS, ES, HL, RMS, CCSK, RTK, CML, JMML, MDS, HLH)
 */
export function getDiagnosisAbbreviation(diag: string): string {
  if (!diag) return '';
  const d = diag.trim();
  const bracketMatch = d.match(/\(([^)]+)\)/);
  if (bracketMatch && bracketMatch[1]) {
    return bracketMatch[1].trim();
  }
  if (d.includes('Acute Lymphoblastic') || d === 'B-ALL' || d === 'T-ALL') return 'ALL';
  if (d.includes('Acute Myeloid') || d === 'AML') return 'AML';
  if (d.includes('Chronic Myeloid') || d === 'CML') return 'CML';
  if (d.includes('Juvenile Myelomonocytic') || d === 'JMML') return 'JMML';
  if (d.includes('Myelodysplastic') || d === 'MDS') return 'MDS';
  if (d.includes('Hemophagocytic') || d === 'HLH') return 'HLH';
  if (d.includes('Neuroblastoma')) return 'NB';
  if (d.toLowerCase().includes('wilm') || d.toLowerCase().includes('nephroblastoma')) return 'WT';
  if (d.toLowerCase().includes('clear cell sarcoma') || d.includes('CCSK')) return 'CCSK';
  if ((d.toLowerCase().includes('rhabdoid') && d.toLowerCase().includes('kidney')) || d.includes('RTK')) return 'RTK';
  if (d.includes('Medulloblastoma')) return 'MB';
  if (d.includes('Osteosarcoma')) return 'OS';
  if (d.includes('Ewing')) return 'ES';
  if (d.includes('Hodgkin') && !d.includes('Non-Hodgkin')) return 'HL';
  if (d.includes('Non-Hodgkin') || d.includes('Burkitt')) return 'NHL';
  if (d.includes('Rhabdomyosarcoma')) return 'RMS';
  if (d.includes('Retinoblastoma')) return 'RB';
  if (d.includes('Hepatoblastoma')) return 'HB';
  if (d.includes('Langerhans')) return 'LCH';
  return d;
}

export interface PatientColorTheme {
  cardBg: string;
  headerBg: string;
  border: string;
  badgeBg: string;
  accentText: string;
  statusText: string;
  outlineBorder: string;
  label: string;
}

/**
 * Returns patient card/header color theme across Home List and Patient Detail Chart.
 * - Background: Lighter grey all over (bg-[#1c2438])
 * - Outlines: Blue for On Treatment, Green for Under Follow-up
 */
export function getPatientColorTheme(
  patient: {
    status: 'On Treatment' | 'Under Follow up' | string;
    followUpStatus?: string;
  },
  themeMode: 'light' | 'dark' = 'light'
): PatientColorTheme {
  const isLight = true;

  if (patient.status === 'On Treatment') {
    return {
      cardBg: isLight
        ? 'bg-white border-2 border-blue-500 text-slate-900 hover:bg-blue-50/30 shadow-xs'
        : 'bg-[#1c2438] border-2 border-blue-500/90 text-slate-100 hover:bg-[#212b42] shadow-sm',
      headerBg: isLight
        ? 'bg-white border-b-2 border-blue-500 text-slate-900'
        : 'bg-[#1c2438] border-b-2 border-blue-500/90 text-white',
      border: 'border-blue-500',
      badgeBg: isLight
        ? 'bg-blue-100 text-blue-800 border border-blue-300'
        : 'bg-blue-950/70 text-blue-300 border border-blue-500/60',
      accentText: isLight ? 'text-blue-700' : 'text-blue-300',
      statusText: isLight ? 'text-blue-700' : 'text-blue-300',
      outlineBorder: isLight
        ? 'border border-blue-300 bg-blue-50/40 text-slate-800'
        : 'border border-blue-500/60 bg-[#131a29]/70 text-slate-200',
      label: 'On Treatment',
    };
  }

  // Follow-up patients: Green outline maintained in both light and dark mode!
  return {
    cardBg: isLight
      ? 'bg-white border-2 border-emerald-500 text-slate-900 hover:bg-emerald-50/30 shadow-xs'
      : 'bg-[#1c2438] border-2 border-emerald-500/90 text-slate-100 hover:bg-[#212b42] shadow-sm',
    headerBg: isLight
      ? 'bg-white border-b-2 border-emerald-500 text-slate-900'
      : 'bg-[#1c2438] border-b-2 border-emerald-500/90 text-white',
    border: 'border-emerald-500',
    badgeBg: isLight
      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
      : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/60',
    accentText: isLight ? 'text-emerald-700' : 'text-emerald-300',
    statusText: isLight ? 'text-emerald-700' : 'text-emerald-300',
    outlineBorder: isLight
      ? 'border border-emerald-300 bg-emerald-50/40 text-slate-800'
      : 'border border-emerald-500/60 bg-[#131a29]/70 text-slate-200',
    label: 'Under Follow-up',
  };
}

export type FollowUpBoxCategory = 'Regular Follow-up' | 'Lost Follow-up' | 'Discharged' | 'Palliative' | 'Died';

export const FOLLOW_UP_BOX_CATEGORIES: FollowUpBoxCategory[] = [
  'Regular Follow-up',
  'Lost Follow-up',
  'Discharged',
  'Palliative',
  'Died',
];

/**
 * Normalizes any followUpStatus string into one of the 5 dedicated category boxes
 */
export function normalizeFollowUpBox(status?: string): FollowUpBoxCategory {
  if (!status) return 'Regular Follow-up';
  const s = status.toLowerCase().trim();
  if (s.includes('lost')) return 'Lost Follow-up';
  if (s.includes('discharg')) return 'Discharged';
  if (s.includes('palliat')) return 'Palliative';
  if (s.includes('die') || s.includes('deceased')) return 'Died';
  return 'Regular Follow-up';
}

export const FOLLOW_UP_TYPE_OPTIONS = [
  { value: 'Regular Follow-up', label: 'regular fu' },
  { value: 'Lost Follow-up', label: 'lost fu' },
  { value: 'Discharged', label: 'discharge' },
  { value: 'Palliative', label: 'Palliative' },
  { value: 'Died', label: 'died' },
] as const;

export function getFollowUpTypeLabel(status?: string): string {
  const norm = normalizeFollowUpBox(status);
  const found = FOLLOW_UP_TYPE_OPTIONS.find((opt) => opt.value === norm);
  return found ? found.label : 'regular fu';
}

/**
 * Normalizes venous access to strictly:
 * 'Port-a-cath' | 'Peripheral IV' | 'PICC' | 'Hickman'
 */
export function normalizeVenousAccess(access?: string): string {
  if (!access) return 'Port-a-cath';
  const lower = access.toLowerCase();
  if (lower.includes('port')) return 'Port-a-cath';
  if (lower.includes('picc')) return 'PICC';
  if (lower.includes('broviac') || lower.includes('hickman')) return 'Hickman';
  if (lower.includes('peripheral') || lower.includes('iv')) return 'Peripheral IV';
  return 'Port-a-cath';
}

/**
 * Standard clinical abbreviations for pediatric oncology chemotherapy drugs:
 * - Methotrexate (MTX)
 * - Mercaptopurine (6MP)
 * - Intrathecal (IT)
 * - Cytarabine (Ara-C)
 * - Cyclophosphamide (Cyclo)
 * - Ifosfamide (Ifo)
 * - Etoposide (VP16)
 * - Doxorubicin (Doxo)
 * - Cisplatin (Cis)
 * - Carboplatin (Carbo)
 * - Dactinomycin (Dact)
 * - Asparaginase (Asp)
 * - Dexamethasone (Dexa)
 * - Prednisone (Preds)
 * - Vincristine (VCR)
 */
export function abbreviateChemoDrugNames(text?: string): string {
  if (!text) return '';
  let res = text;

  // Multi-word & formulation combinations
  res = res.replace(/High-Dose\s+Methotrexate\s*\(HD\)/gi, 'HD-MTX');
  res = res.replace(/High-Dose\s+Methotrexate/gi, 'HD-MTX');
  res = res.replace(/High-Dose\s+MTX/gi, 'HD-MTX');
  res = res.replace(/Methotrexate\s*\(HD\)/gi, 'HD-MTX');
  res = res.replace(/Methotrexate\s*\(IV\)/gi, 'IV-MTX');
  res = res.replace(/Methotrexate\s*\(Oral\)/gi, 'Oral MTX');

  // Intrathecal combinations
  res = res.replace(/Intrathecal\s*\(IT\)\s*Methotrexate/gi, 'IT-MTX');
  res = res.replace(/Intrathecal\s+Methotrexate/gi, 'IT-MTX');
  res = res.replace(/Methotrexate\s*\(IT\)/gi, 'IT-MTX');
  res = res.replace(/Intrathecal\s*\(IT\)/gi, 'IT');
  res = res.replace(/Intrathecal/gi, 'IT');

  // Asparaginase combinations
  res = res.replace(/PEG-Asparaginase/gi, 'PEG-Asp');
  res = res.replace(/Erwinia-Asparaginase/gi, 'Erwinia-Asp');
  res = res.replace(/Asparaginase/gi, 'Asp');

  // Mercaptopurine combinations
  res = res.replace(/6-Mercaptopurine/gi, '6MP');
  res = res.replace(/Mercaptopurine\s*\(6-MP\)/gi, '6MP');
  res = res.replace(/Mercaptopurine\s*\(6MP\)/gi, '6MP');
  res = res.replace(/Mercaptopurine/gi, '6MP');
  res = res.replace(/6-MP/gi, '6MP');

  // Cytarabine combinations
  res = res.replace(/Cytarabine\s*\(Ara-C\)/gi, 'Ara-C');
  res = res.replace(/Cytarabine/gi, 'Ara-C');

  // Specific single-word drug names
  res = res.replace(/\bMethotrexate\b/gi, 'MTX');
  res = res.replace(/\bCyclophosphamide\b/gi, 'Cyclo');
  res = res.replace(/\bIfosfamide\b/gi, 'Ifo');
  res = res.replace(/\bEtoposide\b/gi, 'VP16');
  res = res.replace(/\bDoxorubicin\b/gi, 'Doxo');
  res = res.replace(/\bCisplatin\b/gi, 'Cis');
  res = res.replace(/\bCarboplatin\b/gi, 'Carbo');
  res = res.replace(/\bDactinomycin\b/gi, 'Dact');
  res = res.replace(/\bDexamethasone\b/gi, 'Dexa');
  res = res.replace(/\bPrednisone\b/gi, 'Preds');
  res = res.replace(/\bVincristine\b/gi, 'VCR');

  // Clean extra spaces
  res = res.replace(/\s+/g, ' ').trim();
  return res;
}

/**
 * Recursively removes undefined values from an object or array so it can be safely saved to Firestore.
 */
export function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = sanitizeForFirestore(val);
    }
  }
  return cleaned;
}



