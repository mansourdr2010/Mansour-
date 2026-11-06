import React, { useState } from 'react';
import {
  X,
  Bell,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  Check,
  AlertTriangle,
  User,
  Users,
  ChevronRight,
  Pill,
  ShieldCheck,
  BellRing,
} from 'lucide-react';
import { useOncology } from '../context/OncologyContext';
import { useAuth } from '../context/AuthContext';
import {
  getTodayAndTomorrowChemo,
  broadcastChemoNotification,
  requestBrowserNotificationPermission,
  getBroadcastNotificationLogs,
  BroadcastNotificationLog,
} from '../utils/notificationUtils';
import {
  CLINICAL_TODAY,
  formatClinicalDate,
  formatAppointmentScheduleLabel,
  formatRegimenNameWithoutDuplicate,
  normalizeDiagnosisDisplay,
} from '../utils/oncologyUtils';

interface ChemoNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChemoNotificationModal: React.FC<ChemoNotificationModalProps> = ({ isOpen, onClose }) => {
  const {
    patients,
    setSelectedPatientId,
    markAppointmentAdministered,
    missedAppointments,
    setActiveTab: setGlobalActiveTab,
    rescheduleAppointment,
  } = useOncology();
  const { users, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'alerts' | 'history'>('today');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(CLINICAL_TODAY);
  const [lastBroadcast, setLastBroadcast] = useState<BroadcastNotificationLog | null>(null);
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);
  const [browserPermissionGranted, setBrowserPermissionGranted] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  if (!isOpen) return null;

  const { todaySchedules, tomorrowSchedules, todayDate, tomorrowDate } = getTodayAndTomorrowChemo(
    patients,
    CLINICAL_TODAY
  );

  const logs = getBroadcastNotificationLogs();

  const handleSendNotificationToAll = () => {
    const log = broadcastChemoNotification(patients, users, currentUser, CLINICAL_TODAY);
    setLastBroadcast(log);
    setBroadcastFeedback(
      `Notification sent to all ${log.recipientsCount} users! Alerted for ${log.todayCount} patient(s) today and ${log.tomorrowCount} patient(s) tomorrow.`
    );
    setTimeout(() => {
      setBroadcastFeedback(null);
    }, 6000);
  };

  const handleEnableBrowserNotifications = async () => {
    const granted = await requestBrowserNotificationPermission();
    setBrowserPermissionGranted(granted);
    if (granted) {
      setBroadcastFeedback('Desktop push notifications enabled for chemotherapy schedule alerts.');
      setTimeout(() => setBroadcastFeedback(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center border border-blue-400/40 text-cyan-300">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Alerts & Notifications</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-700/80 text-cyan-200 border border-blue-500 font-mono">
                  Day Unit Command Hub
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Chemotherapy schedule alerts, today & tomorrow infusions, and protocol safety tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-300 hover:text-white hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Broadcast Action Strip */}
        <div className="p-3.5 bg-blue-50/90 border-b border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-950 font-medium">
            <Users className="w-4 h-4 text-blue-700" />
            <span>
              Target Audience: <strong>All {users.filter((u) => u.status === 'approved').length} Active Users</strong> (Physicians & Staff)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!browserPermissionGranted && (
              <button
                type="button"
                onClick={handleEnableBrowserNotifications}
                className="px-2.5 py-1 text-xs text-blue-800 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors font-semibold flex items-center gap-1 cursor-pointer"
                title="Enable browser push notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Desktop Alerts</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSendNotificationToAll}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Broadcast notification to all users right now"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Notification to All Users</span>
            </button>
          </div>
        </div>

        {/* Toast / Feedback Banner */}
        {broadcastFeedback && (
          <div className="mx-5 mt-3 p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1 font-semibold">{broadcastFeedback}</div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 text-xs font-bold gap-3 sm:gap-4 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'today'
                ? 'border-blue-700 text-blue-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Today ({todaySchedules.length})</span>
            <span className="font-mono text-[10px] text-slate-500 font-normal hidden sm:inline">
              {formatClinicalDate(todayDate)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tomorrow')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'tomorrow'
                ? 'border-blue-700 text-blue-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Tomorrow ({tomorrowSchedules.length})</span>
            <span className="font-mono text-[10px] text-slate-500 font-normal hidden sm:inline">
              {formatClinicalDate(tomorrowDate)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'alerts'
                ? 'border-amber-600 text-amber-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${missedAppointments.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Safety Alerts</span>
            {missedAppointments.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-mono font-bold">
                {missedAppointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ml-auto ${
              activeTab === 'history'
                ? 'border-blue-700 text-blue-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Sent Log ({logs.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-3.5 text-xs flex-1 bg-slate-50/50">
          {/* TAB 1: TODAY'S SCHEDULED PATIENTS */}
          {activeTab === 'today' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-slate-700">
                  Chemotherapy sessions scheduled for <strong>Today ({formatClinicalDate(todayDate)})</strong>:
                </span>
                <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {todaySchedules.length} Session(s)
                </span>
              </div>

              {todaySchedules.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No Chemotherapy Scheduled for Today</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No active on-treatment patients have appointments on {formatClinicalDate(todayDate)}.
                  </p>
                </div>
              ) : (
                todaySchedules.map(({ patient, appointment }) => {
                  const isAdministered = appointment.status === 'Administered';
                  return (
                    <div
                      key={appointment.id}
                      className="p-4 bg-white rounded-xl border-2 border-blue-300/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-500 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            onClick={() => {
                              setSelectedPatientId(patient.id);
                              onClose();
                            }}
                            className="font-black text-sm text-blue-950 hover:text-blue-700 cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            <span>{patient.name}</span>
                          </h3>
                          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                            MRN: {patient.mrn}
                          </span>
                          <span className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {patient.ageYears} yrs ({patient.gender})
                          </span>
                          <span className="font-mono text-xs bg-blue-50 text-blue-900 px-2 py-0.5 rounded font-bold border border-blue-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            {appointment.scheduledTime || '09:00 AM'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-slate-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {normalizeDiagnosisDisplay(patient.diagnosis)}
                          </span>
                          <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {formatAppointmentScheduleLabel(appointment) || `Cycle ${appointment.cycleNumber}`}
                          </span>
                          <strong className="text-teal-900 font-bold">
                            {formatRegimenNameWithoutDuplicate(
                              appointment.regimenName,
                              appointment.cycleNumber,
                              appointment.dayInCycle
                            )}
                          </strong>
                        </div>

                        {appointment.remarks && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/80 leading-relaxed">
                            <strong className="text-slate-800">Supportive Care & Orders:</strong> {appointment.remarks}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex sm:flex-col items-end gap-2 shrink-0">
                        {!isAdministered ? (
                          <button
                            type="button"
                            onClick={() => {
                              markAppointmentAdministered(
                                appointment.id,
                                currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Dr. Mansour, MD'
                              );
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Received</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            Administered
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            onClose();
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Open Chart</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: TOMORROW'S SCHEDULED PATIENTS */}
          {activeTab === 'tomorrow' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-slate-700">
                  Chemotherapy sessions scheduled for <strong>Tomorrow ({formatClinicalDate(tomorrowDate)})</strong>:
                </span>
                <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {tomorrowSchedules.length} Session(s)
                </span>
              </div>

              {tomorrowSchedules.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No Chemotherapy Scheduled for Tomorrow</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No active on-treatment patients have appointments on {formatClinicalDate(tomorrowDate)}.
                  </p>
                </div>
              ) : (
                tomorrowSchedules.map(({ patient, appointment }) => (
                  <div
                    key={appointment.id}
                    className="p-4 bg-white rounded-xl border-2 border-teal-300/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-500 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            onClose();
                          }}
                          className="font-black text-sm text-teal-950 hover:text-teal-700 cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                          <span>{patient.name}</span>
                        </h3>
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                          MRN: {patient.mrn}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {patient.ageYears} yrs ({patient.gender})
                        </span>
                        <span className="font-mono text-xs bg-teal-50 text-teal-900 px-2 py-0.5 rounded font-bold border border-teal-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-teal-700" />
                          {appointment.scheduledTime || '09:30 AM'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-slate-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {normalizeDiagnosisDisplay(patient.diagnosis)}
                        </span>
                        <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {formatAppointmentScheduleLabel(appointment) || `Cycle ${appointment.cycleNumber}`}
                        </span>
                        <strong className="text-teal-900 font-bold">
                          {formatRegimenNameWithoutDuplicate(
                            appointment.regimenName,
                            appointment.cycleNumber,
                            appointment.dayInCycle
                          )}
                        </strong>
                      </div>

                      {appointment.remarks && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/80 leading-relaxed">
                          <strong className="text-slate-800">Supportive Care & Orders:</strong> {appointment.remarks}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>Open Patient Chart</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: CLINICAL SAFETY & MISSED SESSIONS ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-950 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>{missedAppointments.length} missed or overdue session(s)</strong> requiring protocol adherence review.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGlobalActiveTab('alerts');
                    onClose();
                  }}
                  className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                >
                  Open Full Safety Board →
                </button>
              </div>

              {missedAppointments.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="font-semibold text-slate-700">No Overdue Sessions</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All chemotherapy cycles are currently up to date with zero delayed protocols.
                  </p>
                </div>
              ) : (
                missedAppointments.map(({ patient: pat, appointment: appt }) => {
                  return (
                    <div
                      key={appt.id}
                      className="p-4 bg-white rounded-xl border border-amber-300 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-slate-900 text-sm">{appt.patientName || pat?.name}</strong>
                          <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                            MRN: {appt.mrn || pat?.mrn}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {normalizeDiagnosisDisplay(appt.diagnosis || pat?.diagnosis || '')}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            {appt.status === 'Delayed' ? 'Delayed' : 'Missed / Overdue'}
                          </span>
                        </div>

                        <div className="text-slate-800 font-semibold flex flex-wrap items-center gap-2">
                          <span>{appt.regimenName}</span>
                          <span className="font-mono text-amber-700 font-bold">
                            Scheduled: {formatClinicalDate(appt.scheduledDate)}
                          </span>
                        </div>

                        {(appt.missedReason || appt.delayReason) && (
                          <div className="text-[11px] text-amber-900 bg-amber-50/80 px-2 py-1 rounded border border-amber-200/60">
                            <strong>Reason:</strong> {appt.missedReason || appt.delayReason}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {rescheduleId === appt.id ? (
                          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <input
                              type="date"
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                              className="p-1 border border-slate-300 rounded text-xs font-mono bg-white text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                rescheduleAppointment(appt.id, rescheduleDate);
                                setRescheduleId(null);
                              }}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setRescheduleId(null)}
                              className="p-1 text-slate-500 hover:text-slate-700"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                markAppointmentAdministered(
                                  appt.id,
                                  currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Dr. Mansour, MD'
                                );
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                              title="Mark as received and shift schedule"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Received</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleId(appt.id);
                                setRescheduleDate(appt.scheduledDate);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                            >
                              Reschedule
                            </button>

                            {pat && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPatientId(pat.id);
                                  onClose();
                                }}
                                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                                title="Open Patient Chart"
                              >
                                Chart
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: BROADCAST HISTORY / AUDIT LOG */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Audit history of schedule notifications dispatched to clinical staff:
              </p>

              {logs.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                  <Send className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No Dispatches Recorded Yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click "Send Notification to All Users" above to broadcast schedule alerts to all registered colleagues.
                  </p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900">{log.senderName}</strong>
                        {log.senderEmpNumber && (
                          <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            #{log.senderEmpNumber}
                          </span>
                        )}
                        <span className="px-2 py-0.2 bg-blue-100 text-blue-900 font-bold rounded-full text-[10px]">
                          {log.recipientsCount} Users Notified
                        </span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                    </div>

                    <p className="text-slate-700 text-xs font-medium leading-relaxed">{log.message}</p>

                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong>Delivered to:</strong> {log.recipientNames.join(', ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Active schedule sync for pediatric Day Unit chemotherapy</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
