import React, { useState } from 'react';
import { useOncology } from '../context/OncologyContext';
import {
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { CLINICAL_TODAY, formatClinicalDate } from '../utils/oncologyUtils';

export const AlertsView: React.FC = () => {
  const {
    missedAppointments,
    setSelectedPatientId,
    markAppointmentAdministered,
    rescheduleAppointment,
    markAppointmentDelayed,
  } = useOncology();

  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string>(CLINICAL_TODAY);

  const handleReschedule = (apptId: string) => {
    rescheduleAppointment(apptId, newDate);
    setRescheduleId(null);
  };

  return (
    <div className="space-y-6">
      {missedAppointments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Missed Sessions Detected</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            All pediatric chemotherapy sessions are currently up to date or scheduled for future dates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1 hidden">
            <span className="font-semibold text-slate-900">
              {missedAppointments.length} Active {missedAppointments.length === 1 ? 'Alert' : 'Alerts'} Requiring Clinical Action
            </span>
            <span className="font-mono text-slate-500">Current Reference Date: {formatClinicalDate(CLINICAL_TODAY)}</span>
          </div>

          {missedAppointments.map(({ patient, appointment }) => {
            const isRescheduling = rescheduleId === appointment.id;

            return (
              <div
                key={appointment.id}
                className="bg-white rounded-xl border border-amber-300 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Patient & Alert Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-xs font-bold rounded">
                        MISSED SESSION
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        Scheduled Date: {formatClinicalDate(appointment.scheduledDate)}
                      </span>
                    </div>

                    <div>
                      <h3
                        onClick={() => setSelectedPatientId(patient.id)}
                        className="text-base font-bold text-slate-900 hover:text-teal-700 cursor-pointer transition-colors"
                      >
                        {patient.name}
                      </h3>
                      <div className="text-xs text-slate-600 mt-0.5">
                        MRN: <strong className="font-mono text-slate-800">{patient.mrn}</strong> · Diagnosis: <strong className="text-slate-800">{patient.diagnosis}</strong>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      Regimen: <span className="text-teal-900">{appointment.regimenName}</span> (Cycle {appointment.cycleNumber})
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-44">
                    <button
                      type="button"
                      onClick={() => markAppointmentAdministered(appointment.id, 'Dr. Mansour, MD')}
                      className="w-full px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Administered
                    </button>

                    <button
                      type="button"
                      onClick={() => setRescheduleId(isRescheduling ? null : appointment.id)}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                    >
                      Reschedule
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPatientId(patient.id)}
                      className="w-full px-3 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Patient Chart</span>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-700" />
                    </button>
                  </div>
                </div>

                {/* Reschedule Drawer */}
                {isRescheduling && (
                  <div className="pt-3 border-t border-slate-200 bg-slate-50 p-3 rounded-lg space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Select New Date for Rescheduling:</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleReschedule(appointment.id)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Confirm Reschedule
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
