import { Patient, ChemotherapyAppointment, AppUser } from '../types/oncology';
import { CLINICAL_TODAY, formatClinicalDate } from './oncologyUtils';

export interface ChemoScheduleItem {
  patient: Patient;
  appointment: ChemotherapyAppointment;
  isToday: boolean;
  scheduledDate: string;
}

export interface BroadcastNotificationLog {
  id: string;
  timestamp: string;
  senderName: string;
  senderEmpNumber?: string;
  todayCount: number;
  tomorrowCount: number;
  recipientsCount: number;
  recipientNames: string[];
  message: string;
}

const NOTIFICATIONS_STORAGE_KEY = 'poct_broadcast_chemo_notifications_v1';
const ACKNOWLEDGED_STORAGE_KEY = 'poct_acknowledged_notifications_v1';

/**
 * Calculates tomorrow's ISO date string based on a reference date
 */
export function getTomorrowDate(dateStr: string = CLINICAL_TODAY): string {
  try {
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return '2026-10-21';
  }
}

/**
 * Retrieves all chemotherapy appointments scheduled for Today and Tomorrow
 */
export function getTodayAndTomorrowChemo(
  patients: Patient[],
  refDate: string = CLINICAL_TODAY
): {
  todayDate: string;
  tomorrowDate: string;
  todaySchedules: ChemoScheduleItem[];
  tomorrowSchedules: ChemoScheduleItem[];
  allSchedules: ChemoScheduleItem[];
  totalCount: number;
} {
  const todayDate = refDate;
  const tomorrowDate = getTomorrowDate(refDate);

  const todaySchedules: ChemoScheduleItem[] = [];
  const tomorrowSchedules: ChemoScheduleItem[] = [];

  for (const patient of patients) {
    if (patient.status !== 'On Treatment') continue;

    for (const appt of patient.appointments) {
      if (appt.scheduledDate === todayDate && appt.status !== 'Missed') {
        todaySchedules.push({
          patient,
          appointment: appt,
          isToday: true,
          scheduledDate: todayDate,
        });
      } else if (appt.scheduledDate === tomorrowDate && appt.status !== 'Missed') {
        tomorrowSchedules.push({
          patient,
          appointment: appt,
          isToday: false,
          scheduledDate: tomorrowDate,
        });
      }
    }
  }

  // Sort by time
  const sortByTime = (a: ChemoScheduleItem, b: ChemoScheduleItem) =>
    (a.appointment.scheduledTime || '').localeCompare(b.appointment.scheduledTime || '');

  todaySchedules.sort(sortByTime);
  tomorrowSchedules.sort(sortByTime);

  const allSchedules = [...todaySchedules, ...tomorrowSchedules];

  return {
    todayDate,
    tomorrowDate,
    todaySchedules,
    tomorrowSchedules,
    allSchedules,
    totalCount: allSchedules.length,
  };
}

/**
 * Request browser desktop notifications permission
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    } catch (e) {
      console.warn('Browser Notification request failed:', e);
    }
  }
  return false;
}

/**
 * Trigger native browser desktop notification if permission granted
 */
export function triggerDesktopNotification(title: string, options?: NotificationOptions): void {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (e) {
      console.warn('Native notification trigger failed:', e);
    }
  }
}

/**
 * Saves broadcast notification logs for all users
 */
export function saveBroadcastNotificationLog(log: BroadcastNotificationLog): void {
  try {
    const existing = getBroadcastNotificationLogs();
    const updated = [log, ...existing].slice(0, 50); // keep last 50 logs
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save notification log:', e);
  }
}

/**
 * Retrieves broadcast notification logs
 */
export function getBroadcastNotificationLogs(): BroadcastNotificationLog[] {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse notification logs:', e);
  }
  return [];
}

/**
 * Broadcasts chemotherapy schedule notification to all users
 */
export function broadcastChemoNotification(
  patients: Patient[],
  users: AppUser[],
  senderUser: AppUser | null,
  refDate: string = CLINICAL_TODAY
): BroadcastNotificationLog {
  const { todaySchedules, tomorrowSchedules, todayDate, tomorrowDate } = getTodayAndTomorrowChemo(patients, refDate);
  const activeUsers = users.filter((u) => u.status === 'approved');

  const senderName = senderUser ? `${senderUser.firstName} ${senderUser.lastName}` : 'Dr. Mansour, MD';
  const senderEmp = senderUser?.employeeNumber || '1001';

  const recipientNames = activeUsers.map((u) => `${u.firstName} ${u.lastName} (#${u.employeeNumber})`);

  const message = `Chemotherapy schedule alert: ${todaySchedules.length} patient(s) scheduled Today (${formatClinicalDate(todayDate)}) and ${tomorrowSchedules.length} patient(s) scheduled Tomorrow (${formatClinicalDate(tomorrowDate)}).`;

  const log: BroadcastNotificationLog = {
    id: `notif-${Date.now()}`,
    timestamp: new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    senderName,
    senderEmpNumber: senderEmp,
    todayCount: todaySchedules.length,
    tomorrowCount: tomorrowSchedules.length,
    recipientsCount: activeUsers.length,
    recipientNames,
    message,
  };

  saveBroadcastNotificationLog(log);

  // Trigger desktop browser alert
  triggerDesktopNotification('Pediatric Oncology Tracker: Scheduled Chemotherapy', {
    body: `${message}\nDispatched by ${senderName} to all staff members.`,
    tag: 'chemo-schedule-alert',
  });

  return log;
}
