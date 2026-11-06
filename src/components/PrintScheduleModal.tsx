import React, { useMemo } from 'react';
import { useOncology } from '../context/OncologyContext';
import { useAuth } from '../context/AuthContext';
import { X, Printer, FileDown, FileText } from 'lucide-react';
import {
  formatClinicalDate,
  filterAppointmentsByDateRange,
  getTodayDateString,
  getDiagnosisAbbreviation,
  abbreviateChemoDrugNames,
  formatAppointmentScheduleLabel,
  getDayOfWeekName,
} from '../utils/oncologyUtils';
import { generateFollowingWeekChemoPdf } from '../utils/pdfGenerator';
import { Patient } from '../types/oncology';

export const PrintScheduleModal: React.FC = () => {
  const {
    isPrintModalOpen,
    setIsPrintModalOpen,
    patients,
    scheduleStartDate,
    scheduleEndDate,
  } = useOncology();

  const { currentUser } = useAuth();

  // Active treatment appointments in the date range
  const scheduledItems = useMemo(() => {
    return filterAppointmentsByDateRange(
      patients,
      scheduleStartDate,
      scheduleEndDate,
      'All',
      'All',
      'On Treatment'
    );
  }, [patients, scheduleStartDate, scheduleEndDate]);

  // Follow-up patients scheduled in the date range (at bottom of the table)
  const followUpItems = useMemo(() => {
    const list: Array<{
      id: string;
      patient: Patient;
      scheduledDate: string;
      status: string;
      title: string;
      remarks: string;
    }> = [];

    for (const patient of patients) {
      if (patient.status === 'Under Follow up') {
        let addedFromAppt = false;
        for (const appt of patient.appointments) {
          if (
            appt.scheduledDate >= scheduleStartDate &&
            appt.scheduledDate <= scheduleEndDate &&
            appt.status !== 'Administered'
          ) {
            list.push({
              id: `fu-appt-${appt.id}`,
              patient,
              scheduledDate: appt.scheduledDate,
              status: patient.followUpStatus || 'Regular Follow-up',
              title: appt.regimenName || 'Outpatient Surveillance Assessment',
              remarks: appt.remarks || 'Routine follow-up evaluation & surveillance',
            });
            addedFromAppt = true;
          }
        }
        if (
          !addedFromAppt &&
          patient.nextVisitDate &&
          patient.nextVisitDate >= scheduleStartDate &&
          patient.nextVisitDate <= scheduleEndDate
        ) {
          list.push({
            id: `fu-visit-${patient.id}`,
            patient,
            scheduledDate: patient.nextVisitDate,
            status: patient.followUpStatus || 'Regular Follow-up',
            title: 'Outpatient Follow-up Review',
            remarks: 'Scheduled surveillance clinic visit',
          });
        }
      }
    }

    return list.sort((a, b) => {
      const cmp = a.scheduledDate.localeCompare(b.scheduledDate);
      if (cmp !== 0) return cmp;
      return a.patient.name.localeCompare(b.patient.name);
    });
  }, [patients, scheduleStartDate, scheduleEndDate]);

  if (!isPrintModalOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateFollowingWeekChemoPdf(patients, {
      startDate: scheduleStartDate,
      endDate: scheduleEndDate,
      generatedBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Dr. Mansour, MD',
    });
  };

  const todayStr = getTodayDateString();

  const renderStackedDate = (dateStr?: string) => {
    if (!dateStr) return <span className="text-slate-400">—</span>;
    const full = formatClinicalDate(dateStr);
    const dayName = getDayOfWeekName(dateStr);
    const parts = full.split('/');
    if (parts.length === 3) {
      return (
        <div className="leading-tight text-center">
          {dayName && (
            <div className="text-[8.5px] sm:text-[9px] font-bold text-teal-850 tracking-tight leading-tight">
              {dayName}
            </div>
          )}
          <div className="font-bold text-slate-900 font-mono text-[10px] sm:text-[10.5px]">
            {parts[0]}/{parts[1]}
          </div>
          <div className="text-[8.5px] sm:text-[9px] text-slate-600 font-normal font-mono">
            {parts[2]}
          </div>
        </div>
      );
    }
    return (
      <div className="leading-tight text-center">
        {dayName && (
          <div className="text-[8.5px] sm:text-[9px] font-bold text-teal-850 tracking-tight leading-tight">
            {dayName}
          </div>
        )}
        <span className="font-bold text-slate-900 font-mono text-[10px]">{full}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-1 sm:p-2 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Top Bar (Hidden in print) */}
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 no-print shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              CTH schedule
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold">
                {scheduledItems.length} Chemo
              </span>
              {followUpItems.length > 0 && (
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  {followUpItems.length} Follow-up
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Download PDF file to device"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer ml-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable & Screenshot-Ready Document Area - Default Zoomed Out to Fit Entire Screen */}
        <div
          id="screenshot-printable-area"
          className="overflow-auto flex-1 text-slate-900 bg-white p-2 sm:p-2.5 text-[9px] sm:text-[9.5px] leading-tight"
        >
          <div className="w-full">
            {/* Clinical Header Banner */}
            <div className="border-b-2 border-slate-900 pb-1.5 mb-1.5 flex flex-wrap justify-between items-center gap-2">
              <div className="text-sm font-black uppercase tracking-tight text-slate-900">
                CTH schedule
              </div>
              <div className="text-right text-[10px] font-mono leading-tight">
                <div className="text-teal-800 font-semibold">
                  Period: {formatClinicalDate(scheduleStartDate)} – {formatClinicalDate(scheduleEndDate)}
                </div>
              </div>
            </div>

            {/* 5-Column Clean Table that Fits Screen */}
            <div className="border border-slate-300 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[9.5px] sm:text-[10px]">
                    <th className="py-1 px-1 border-r border-slate-300 w-[13%] min-w-[70px] text-center">Date</th>
                    <th className="py-1 px-1.5 border-r border-slate-300 w-[23%]">Name & MRN & ID</th>
                    <th className="py-1 px-1.5 border-r border-slate-300 w-[15%]">Diagnosis</th>
                    <th className="py-1 px-1.5 border-r border-slate-300 w-[24%]">CTH Regimen</th>
                    <th className="py-1 px-1.5 w-[25%]">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {scheduledItems.length === 0 && followUpItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 font-medium text-xs">
                        No chemotherapy sessions or follow-up visits scheduled for this period ({formatClinicalDate(scheduleStartDate)} – {formatClinicalDate(scheduleEndDate)}).
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Active Chemotherapy Patients */}
                      {scheduledItems.map(({ patient, appointment }) => (
                        <tr key={appointment.id} className="hover:bg-slate-50/60 print-break-inside-avoid">
                          {/* Column 1: Date (Day name with stacked year below day and month) */}
                          <td className="py-1 px-1 border-r border-slate-200 align-top text-center w-[13%] min-w-[70px]">
                            {renderStackedDate(appointment.scheduledDate)}
                          </td>

                          {/* Column 2: Name & MRN & ID */}
                          <td className="py-1 px-1.5 border-r border-slate-200 align-top">
                            <div className="font-bold text-slate-900 text-[9.5px] sm:text-[10px] leading-tight">
                              {patient.name}
                            </div>
                            <div className="font-mono text-[8.5px] text-teal-800 font-semibold">
                              MRN: {patient.mrn || 'N/A'}
                            </div>
                            <div className="font-mono text-[8px] text-slate-500">
                              ID: {patient.nationalId || patient.id}
                            </div>
                          </td>

                          {/* Column 3: Diagnosis (Abbreviation only + Risk Stratification) */}
                          <td className="py-1 px-1.5 border-r border-slate-200 align-top leading-tight">
                            <div className="font-extrabold text-slate-900 text-[10px] sm:text-[10.5px]">
                              {getDiagnosisAbbreviation(patient.diagnosis)}
                            </div>
                            {patient.riskStratification && patient.riskStratification !== 'N/A' && (
                              <div className="text-[8px] sm:text-[8.5px] text-slate-600 font-semibold tracking-tight">
                                {patient.riskStratification}
                              </div>
                            )}
                          </td>

                          {/* Column 4: CTH Regimen (Medications as abbreviations, simple text, no box) */}
                          <td className="py-1 px-1.5 border-r border-slate-200 align-top">
                            <div className="font-bold text-slate-900 text-[9px] sm:text-[9.5px] leading-tight mb-0.5">
                              {formatAppointmentScheduleLabel(appointment, patient.diagnosis) || (appointment.phaseName ? appointment.phaseName : `Cycle ${appointment.cycleNumber}`)}
                            </div>
                            {appointment.drugs && appointment.drugs.length > 0 ? (
                              <div className="text-[8.5px] sm:text-[9px] text-slate-700 leading-tight">
                                {appointment.drugs.map((d, i) => (
                                  <span key={i} className="inline-block mr-1">
                                    <span className="text-slate-400">• </span>
                                    <span>{abbreviateChemoDrugNames(d.name)}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[8.5px] sm:text-[9px] text-slate-700 leading-tight">
                                {abbreviateChemoDrugNames(appointment.regimenName)}
                              </div>
                            )}
                            {appointment.doseType === 'With Reduction' && (
                              <div className="mt-0.5 text-[8px] sm:text-[8.5px] font-semibold text-amber-700">
                                [{appointment.reductionPercentage || 'Reduced'} - {appointment.reductionReason || 'Hold'}]
                              </div>
                            )}
                          </td>

                          {/* Column 5: Remarks */}
                          <td className="py-1 px-1.5 align-top text-slate-800 text-[8.5px] sm:text-[9px] leading-tight">
                            <div>{appointment.remarks || 'Standard supportive care & hydration.'}</div>
                            {appointment.missedReason && (
                              <div className="text-rose-700 font-bold mt-0.5">
                                Missed: {appointment.missedReason}
                              </div>
                            )}
                            {appointment.delayReason && (
                              <div className="text-amber-700 font-semibold mt-0.5">
                                Delay: {appointment.delayReason}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* Follow-up Patients Schedules at the bottom of the table */}
                      {followUpItems.length > 0 && (
                        <>
                          <tr className="bg-emerald-50/90 border-y-2 border-emerald-300 print-break-inside-avoid">
                            <td colSpan={5} className="py-1 px-2 font-bold text-emerald-900 text-[9.5px] sm:text-[10px] uppercase tracking-wider">
                              Follow-up Patients Scheduled ({followUpItems.length})
                            </td>
                          </tr>
                          {followUpItems.map((fu) => (
                            <tr key={fu.id} className="hover:bg-emerald-50/30 bg-emerald-50/10 print-break-inside-avoid">
                              {/* Column 1: Date */}
                              <td className="py-1 px-1 border-r border-slate-200 align-top text-center w-[13%] min-w-[70px]">
                                {renderStackedDate(fu.scheduledDate)}
                              </td>

                              {/* Column 2: Name & MRN & ID */}
                              <td className="py-1 px-1.5 border-r border-slate-200 align-top">
                                <div className="font-bold text-slate-900 text-[9.5px] sm:text-[10px] leading-tight">
                                  {fu.patient.name}
                                </div>
                                <div className="font-mono text-[8.5px] text-emerald-800 font-semibold">
                                  MRN: {fu.patient.mrn || 'N/A'}
                                </div>
                                <div className="font-mono text-[8px] text-slate-500">
                                  ID: {fu.patient.nationalId || fu.patient.id}
                                </div>
                              </td>

                              {/* Column 3: Diagnosis (Abbreviation only + Risk Stratification) */}
                              <td className="py-1 px-1.5 border-r border-slate-200 align-top leading-tight">
                                <div className="font-extrabold text-slate-900 text-[10px] sm:text-[10.5px]">
                                  {getDiagnosisAbbreviation(fu.patient.diagnosis)}
                                </div>
                                {fu.patient.riskStratification && fu.patient.riskStratification !== 'N/A' && (
                                  <div className="text-[8px] sm:text-[8.5px] text-slate-600 font-semibold tracking-tight">
                                    {fu.patient.riskStratification}
                                  </div>
                                )}
                              </td>

                              {/* Column 4: CTH Regimen / Follow-up */}
                              <td className="py-1 px-1.5 border-r border-slate-200 align-top">
                                <div className="font-bold text-slate-900 text-[9px] sm:text-[9.5px] leading-tight mb-0.5">
                                  Follow-up: {fu.status}
                                </div>
                                <div className="text-[8.5px] sm:text-[9px] text-slate-700 leading-tight">
                                  {fu.title}
                                </div>
                              </td>

                              {/* Column 5: Remarks */}
                              <td className="py-1 px-1.5 align-top text-slate-800 text-[8.5px] sm:text-[9px] leading-tight">
                                <div>{fu.remarks}</div>
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
