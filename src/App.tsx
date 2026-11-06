/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { OncologyProvider, useOncology } from './context/OncologyContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { PatientListView } from './components/PatientListView';
import { ErrorBoundary } from './components/ErrorBoundary';

// Code-split secondary views & heavy modals for instant load & lighter memory footprint
const DateRangeChemoSchedule = lazy(() => import('./components/DateRangeChemoSchedule').then(m => ({ default: m.DateRangeChemoSchedule })));
const AlertsView = lazy(() => import('./components/AlertsView').then(m => ({ default: m.AlertsView })));
const BsaCalculatorView = lazy(() => import('./components/BsaCalculatorView').then(m => ({ default: m.BsaCalculatorView })));
const PatientDetailModal = lazy(() => import('./components/PatientDetailModal').then(m => ({ default: m.PatientDetailModal })));
const NewPatientModal = lazy(() => import('./components/NewPatientModal').then(m => ({ default: m.NewPatientModal })));
const NewAppointmentModal = lazy(() => import('./components/NewAppointmentModal').then(m => ({ default: m.NewAppointmentModal })));
const AddEventModal = lazy(() => import('./components/AddEventModal').then(m => ({ default: m.AddEventModal })));
const PrintScheduleModal = lazy(() => import('./components/PrintScheduleModal').then(m => ({ default: m.PrintScheduleModal })));
const EditPatientModal = lazy(() => import('./components/EditPatientModal').then(m => ({ default: m.EditPatientModal })));
const AddInvestigationModal = lazy(() => import('./components/AddInvestigationModal').then(m => ({ default: m.AddInvestigationModal })));

const AppContent: React.FC = () => {
  const { activeTab } = useOncology();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f8fafc] text-slate-900 transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ErrorBoundary fallbackTitle="View Error">
          <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading view...</div>}>
            {activeTab === 'dashboard' && <PatientListView />}
            {activeTab === 'schedule' && <DateRangeChemoSchedule />}
            {activeTab === 'alerts' && <AlertsView />}
            {activeTab === 'bsa-calc' && <BsaCalculatorView />}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Lazily loaded modals - only fetched when opened */}
      <ErrorBoundary fallbackTitle="Modal Window Error">
        <Suspense fallback={null}>
          <PatientDetailModal />
          <NewPatientModal />
          <NewAppointmentModal />
          <AddEventModal />
          <PrintScheduleModal />
          <EditPatientModal />
          <AddInvestigationModal />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OncologyProvider>
          <AppContent />
        </OncologyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
