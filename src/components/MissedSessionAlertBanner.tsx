import React from 'react';
import { useOncology } from '../context/OncologyContext';
import { AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { formatClinicalDate } from '../utils/oncologyUtils';

export const MissedSessionAlertBanner: React.FC = () => {
  const { missedAppointments, setSelectedPatientId, setActiveTab } = useOncology();

  if (missedAppointments.length === 0) return null;

  const topMissed = missedAppointments[0];

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6 no-print">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-amber-100 rounded-md text-amber-800 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Clinical Safety Alert:
              </span>
              <span className="text-xs font-semibold text-amber-800">
                {missedAppointments.length} missed or overdue chemotherapy {missedAppointments.length === 1 ? 'session' : 'sessions'} detected
              </span>
            </div>
            <p className="text-xs text-amber-700 mt-0.5">
              <strong className="font-semibold text-amber-900">{topMissed.patient.name}</strong> ({topMissed.patient.mrn}) missed{' '}
              <span className="font-mono">{topMissed.appointment.regimenName}</span> scheduled on{' '}
              <span className="font-medium">{formatClinicalDate(topMissed.appointment.scheduledDate)}</span>.
              {missedAppointments.length > 1 && ` (+${missedAppointments.length - 1} more)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => {
              setSelectedPatientId(topMissed.patient.id);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
          >
            Review {topMissed.patient.name}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {missedAppointments.length > 1 && (
            <button
              onClick={() => setActiveTab('alerts')}
              className="px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors"
            >
              View All Alerts
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
