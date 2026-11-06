import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, ChemotherapyAppointment } from '../types/oncology';
import {
  CLINICAL_TODAY,
  formatClinicalDate,
  formatAppointmentScheduleLabel,
  normalizeDiagnosisDisplay,
  getDiagnosisAbbreviation,
  abbreviateChemoDrugNames,
  getDayOfWeekName,
} from './oncologyUtils';

export interface GeneratePdfOptions {
  startDate?: string;
  endDate?: string;
  generatedBy?: string;
  filename?: string;
}

/**
 * Calculates the Following Week date range (7-day window starting today)
 */
export function getFollowingWeekRange(baseDateStr: string = CLINICAL_TODAY): { startDate: string; endDate: string } {
  try {
    const parts = baseDateStr.split('-').map(Number);
    const start = new Date(parts[0], parts[1] - 1, parts[2]);
    const end = new Date(parts[0], parts[1] - 1, parts[2] + 7);

    const toIso = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: baseDateStr,
      endDate: toIso(end),
    };
  } catch {
    return {
      startDate: baseDateStr,
      endDate: '2026-10-27',
    };
  }
}

/**
 * Automatically generates and downloads a PDF of the following week's chemotherapy schedule
 */
export function generateFollowingWeekChemoPdf(
  patients: Patient[],
  options?: GeneratePdfOptions
): { success: boolean; count: number; filename: string; startDate: string; endDate: string } {
  const range = getFollowingWeekRange(options?.startDate || CLINICAL_TODAY);
  const startDate = options?.startDate || range.startDate;
  const endDate = options?.endDate || range.endDate;
  const generatedBy = options?.generatedBy || 'Dr. Mansour, MD';

  // Extract all scheduled appointments for patients on active treatment within the schedule window
  const scheduledItems: Array<{ patient: Patient; appointment: ChemotherapyAppointment }> = [];

  for (const patient of patients) {
    if (patient.status === 'On Treatment') {
      for (const apt of patient.appointments) {
        if (apt.scheduledDate >= startDate && apt.scheduledDate <= endDate) {
          scheduledItems.push({ patient, appointment: apt });
        }
      }
    }
  }

  // Follow-up scheduled visits
  const followUpItems: Array<{
    patient: Patient;
    date: string;
    time?: string;
    type: string;
    title: string;
    remarks: string;
  }> = [];

  for (const patient of patients) {
    if (patient.status === 'Under Follow up') {
      let addedFromAppts = false;
      for (const apt of patient.appointments) {
        if (apt.scheduledDate >= startDate && apt.scheduledDate <= endDate && apt.status !== 'Administered') {
          followUpItems.push({
            patient,
            date: apt.scheduledDate,
            time: apt.scheduledTime,
            type: patient.followUpStatus || 'Regular Follow-up',
            title: apt.regimenName || 'Outpatient Surveillance Assessment',
            remarks: apt.remarks || 'Routine follow-up evaluation & surveillance',
          });
          addedFromAppts = true;
        }
      }
      if (!addedFromAppts && patient.nextVisitDate && patient.nextVisitDate >= startDate && patient.nextVisitDate <= endDate) {
        followUpItems.push({
          patient,
          date: patient.nextVisitDate,
          type: patient.followUpStatus || 'Regular Follow-up',
          title: 'Outpatient Follow-up Review',
          remarks: 'Scheduled surveillance clinic visit',
        });
      }
    }
  }

  followUpItems.sort((a, b) => a.date.localeCompare(b.date));

  // If none strictly in the exact window, fall back to next upcoming active schedules
  if (scheduledItems.length === 0 && followUpItems.length === 0) {
    for (const patient of patients) {
      if (patient.status === 'On Treatment') {
        const upcoming = patient.appointments.filter(
          (a) => a.status !== 'Administered' && a.scheduledDate >= startDate
        );
        for (const apt of upcoming) {
          scheduledItems.push({ patient, appointment: apt });
        }
      }
    }
  }

  // Sort chronologically by date and scheduled time
  scheduledItems.sort((a, b) => {
    const cmp = a.appointment.scheduledDate.localeCompare(b.appointment.scheduledDate);
    if (cmp !== 0) return cmp;
    return (a.appointment.scheduledTime || '').localeCompare(b.appointment.scheduledTime || '');
  });

  // Create A4 Landscape PDF Document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary Header Banner
  doc.setFillColor(15, 118, 110); // Teal 700
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Hospital / Tracker Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CTH SCHEDULE', 14, 14);

  // Date on Top Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Schedule Period: ${formatClinicalDate(startDate)} – ${formatClinicalDate(endDate)}`, pageWidth - 14, 14, {
    align: 'right',
  });

  // Sub-header Summary Bar
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(14, 28, pageWidth - 28, 10, 'F');
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.rect(14, 28, pageWidth - 28, 10, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(
    `Chemotherapy Sessions: ${scheduledItems.length} | Follow-up Visits: ${followUpItems.length}`,
    18,
    34.5
  );

  const uniquePatients = new Set([...scheduledItems.map((i) => i.patient.id), ...followUpItems.map((i) => i.patient.id)]).size;
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Total Patients: ${uniquePatients}`,
    120,
    34.5
  );

  const formatStackedPdfDate = (dateStr: string) => {
    if (!dateStr) return '';
    const dayName = getDayOfWeekName(dateStr);
    const d = formatClinicalDate(dateStr);
    const parts = d.split('/');
    if (parts.length === 3) {
      return dayName ? `${dayName}\n${parts[0]}/${parts[1]}\n${parts[2]}` : `${parts[0]}/${parts[1]}\n${parts[2]}`;
    }
    return dayName ? `${dayName}\n${d}` : d;
  };

  // 1: Date, 2: Name & MRN & ID, 3: Diagnosis (Abbreviation & Risk), 4: Cth Regimen (Abbreviated Meds), 5: Remarks
  const tableData: any[] = scheduledItems.map(({ patient, appointment }) => {
    // Column 1: Date (Stacked year below day and month)
    const dateCol = formatStackedPdfDate(appointment.scheduledDate);

    // Column 2: Name & MRN & ID
    const mrnVal = patient.mrn || 'N/A';
    const idVal = patient.nationalId || patient.id || 'N/A';
    const nameCol = `${patient.name}\nMRN: ${mrnVal}\nID: ${idVal}`;

    // Column 3: Diagnosis (Abbreviation & Risk Stratification)
    const hasRisk = patient.riskStratification && patient.riskStratification !== 'N/A';
    const diagCol = hasRisk
      ? `${getDiagnosisAbbreviation(patient.diagnosis)}\n${patient.riskStratification}`
      : getDiagnosisAbbreviation(patient.diagnosis);

    // Column 4: Cth Regimen (Medications as abbreviations)
    const scheduleLabel =
      formatAppointmentScheduleLabel(appointment, patient.diagnosis) ||
      (appointment.phaseName ? appointment.phaseName : `Cycle ${appointment.cycleNumber}`);
    const drugsList = (appointment.drugs || []).map((d) => `• ${abbreviateChemoDrugNames(d.name)}`).join('\n');
    const doseReduction =
      appointment.doseType === 'With Reduction'
        ? `\n[${appointment.reductionPercentage || 'Reduced'} - ${appointment.reductionReason || 'Clinical Hold'}]`
        : '';
    const regimenCol = `${scheduleLabel}${drugsList ? `\n${drugsList}` : `\n${abbreviateChemoDrugNames(appointment.regimenName)}`}${doseReduction}`;

    // Column 5: Remarks
    const remarksParts: string[] = [];
    if (appointment.remarks && appointment.remarks.trim()) {
      remarksParts.push(appointment.remarks.trim());
    }
    if (appointment.missedReason) {
      remarksParts.push(`[Missed: ${appointment.missedReason}]`);
    }
    if (appointment.delayReason) {
      remarksParts.push(`[Delay: ${appointment.delayReason}]`);
    }
    const remarksCol = remarksParts.join('\n');

    return [dateCol, nameCol, diagCol, regimenCol, remarksCol];
  });

  // Append Follow-up Patients at bottom of the table
  if (followUpItems.length > 0) {
    tableData.push([
      {
        content: `FOLLOW-UP PATIENTS SCHEDULED (${followUpItems.length})`,
        colSpan: 5,
        styles: {
          fillColor: [236, 253, 245], // Emerald 50
          textColor: [6, 95, 70], // Emerald 800
          fontStyle: 'bold',
          halign: 'left',
        },
      },
    ]);

    for (const item of followUpItems) {
      const dateCol = formatStackedPdfDate(item.date);

      const mrnVal = item.patient.mrn || 'N/A';
      const idVal = item.patient.nationalId || item.patient.id || 'N/A';
      const nameCol = `${item.patient.name}\nMRN: ${mrnVal}\nID: ${idVal}`;

      const hasRisk = item.patient.riskStratification && item.patient.riskStratification !== 'N/A';
      const diagCol = hasRisk
        ? `${getDiagnosisAbbreviation(item.patient.diagnosis)}\n${item.patient.riskStratification}`
        : getDiagnosisAbbreviation(item.patient.diagnosis);
      const regimenCol = `Follow-up: ${item.type}\n${item.title}`;
      const remarksCol = item.remarks && item.remarks.trim() ? item.remarks.trim() : '';

      tableData.push([dateCol, nameCol, diagCol, regimenCol, remarksCol]);
    }
  }

  // Generate Table using autoTable with 5 columns
  autoTable(doc, {
    head: [
      [
        'Date',
        'Name & MRN & ID',
        'Diagnosis',
        'CTH Regimen',
        'Remarks',
      ],
    ],
    body: tableData,
    startY: 42,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'top',
    },
    headStyles: {
      fillColor: [15, 118, 110], // Teal 700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold', halign: 'center' }, // Day name with date (DD/MM and YYYY)
      1: { cellWidth: 53 }, // Name & MRN & ID
      2: { cellWidth: 41 }, // Diagnosis & Risk Stratification
      3: { cellWidth: 73 }, // CTH Regimen
      4: { cellWidth: 74 }, // Remarks
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    didDrawPage: (data) => {
      // Footer on every page
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      const pageStr = `Page ${data.pageNumber}`;
      doc.text(
        'CTH Schedule',
        14,
        pageHeight - 6
      );
      doc.text(pageStr, pageWidth - 14, pageHeight - 6, { align: 'right' });
    },
    margin: { top: 42, bottom: 12, left: 14, right: 14 },
  });

  const filename =
    options?.filename ||
    `Following_Week_Chemo_Schedule_${startDate}_to_${endDate}.pdf`;

  // Trigger browser download of PDF
  doc.save(filename);

  return {
    success: true,
    count: scheduledItems.length,
    filename,
    startDate,
    endDate,
  };
}
