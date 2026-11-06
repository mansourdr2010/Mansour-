import React from 'react';
import { useOncology } from '../context/OncologyContext';
import { 
  HeartPulse, 
  Calendar, 
  Plus, 
  Search, 
  Bell, 
  Users,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setIsNewPatientOpen,
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    missedAppointments,
  } = useOncology();

  const missedCount = missedAppointments?.length || 0;

  const inactiveBtnClass = 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 bg-slate-50 border border-slate-300';

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 shadow-2xs sticky top-0 z-30 no-print transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* LINE 1: App Name ONLY */}
        <div className="py-2.5 sm:py-3 flex items-center justify-start border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            title="Pediatric Oncology Tracker"
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs group-hover:bg-teal-500 transition-colors shrink-0">
              <HeartPulse className="w-4 h-4" />
            </div>
            <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
              Pediatric Oncology Tracker
            </span>
          </button>
        </div>

        {/* LINE 2: Buttons for patient list, schedule, search, add, notification, and profile */}
        <div className="py-2 sm:py-2.5 flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2.5 w-full">
          {/* Patient List & Schedule (Text + Icon) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1. List */}
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              title="View Patient List"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : inactiveBtnClass
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeTab === 'dashboard' ? 'text-white' : 'text-teal-500'}`} />
              <span>List</span>
            </button>

            {/* 2. Schedule */}
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              title="Chemotherapy Schedule"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : inactiveBtnClass
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${activeTab === 'schedule' ? 'text-white' : 'text-teal-500'}`} />
              <span>Schedule</span>
            </button>
          </div>

          {/* Search, Add, Notification, and Profile: Just Icons to fit line without extra space */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto sm:ml-auto">
            {/* 3. Search (Icon only) */}
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (activeTab !== 'dashboard') {
                  setActiveTab('dashboard');
                }
              }}
              title={isSearchOpen ? 'Hide Search Input' : 'Search Patients (Name, ID, MRN)'}
              className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                isSearchOpen || searchQuery.trim()
                  ? 'bg-teal-600 text-white shadow-xs ring-1 ring-teal-400/50'
                  : inactiveBtnClass
              }`}
            >
              <Search className={`w-4 h-4 ${isSearchOpen || searchQuery.trim() ? 'text-white' : 'text-teal-500'}`} />
            </button>

            {/* 4. Add (Icon only) */}
            <button
              type="button"
              onClick={() => setIsNewPatientOpen(true)}
              title="Add New Patient"
              className="w-8 h-8 rounded-lg text-white bg-teal-600 hover:bg-teal-500 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-xs cursor-pointer border border-teal-500/50"
            >
              <Plus className="w-4 h-4 stroke-[2.75]" />
            </button>

            {/* 5. Notification (Icon only with Badge) */}
            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              title="Protocol Adherence & Missed Session Alerts"
              className={`relative w-8 h-8 rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-teal-600 text-white font-bold shadow-xs ring-1 ring-teal-400/50'
                  : inactiveBtnClass
              }`}
            >
              <Bell className={`w-4 h-4 ${activeTab === 'alerts' ? 'text-white' : 'text-teal-600'}`} />
              {missedCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-0.5 bg-rose-600 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                  {missedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


