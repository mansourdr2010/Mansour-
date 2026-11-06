import React, { useState, useEffect } from 'react';
import { useOncology } from '../context/OncologyContext';
import { MajorClinicalEvent } from '../types/oncology';
import { X, Search, CheckCircle2, PlusCircle } from 'lucide-react';
import { getTodayDateString } from '../utils/oncologyUtils';

const COMMON_INVESTIGATIONS = [
  {
    name: 'CBC (Complete Blood Count)',
    defaultDesc: 'CBC with differential: WBC, ANC, Hemoglobin, and Platelet count.',
  },
  {
    name: 'Tumor Markers',
    defaultDesc: 'Oncological tumor markers surveillance (e.g. AFP, beta-hCG, Ferritin, LDH).',
  },
  {
    name: 'Thyroid Function Panel',
    defaultDesc: 'Thyroid function screening (TSH, Free T4, Free T3) post-therapy.',
  },
  {
    name: 'Hormonal Profile',
    defaultDesc: 'Hormonal evaluation (Growth Hormone, Cortisol, LH/FSH, ACTH, IGF-1).',
  },
  {
    name: 'Abdominal / Pelvic Ultrasound',
    defaultDesc: 'Sonographic surveillance of organomegaly, abdominal masses, and lymphadenopathy.',
  },
  {
    name: 'Chest CT Scan',
    defaultDesc: 'Surveillance chest CT scan to evaluate for pulmonary metastatic nodules.',
  },
  {
    name: 'Contrast-Enhanced MRI',
    defaultDesc: 'High-resolution MRI surveillance of brain, spine, or primary tumor bed.',
  },
  {
    name: 'PET-CT Surveillance Scan',
    defaultDesc: 'Whole-body FDG-PET/CT scan to assess metabolic remission.',
  },
  {
    name: 'Bone Marrow Aspirate & MRD',
    defaultDesc: 'Surveillance bone marrow examination with minimal residual disease (MRD) flow cytometry.',
  },
  {
    name: 'Echocardiogram (Cardiac Function)',
    defaultDesc: 'Transthoracic echocardiogram to monitor left ventricular ejection fraction (LVEF).',
  },
  {
    name: 'Audiometry / Hearing Evaluation',
    defaultDesc: 'High-frequency pure-tone audiometry to monitor sensorineural ototoxicity thresholds.',
  },
];

type InvestigationStatusChoice = 'Normal/in remission' | 'Pending' | 'Abnormal' | 'Suspected relapse';

export const AddInvestigationModal: React.FC = () => {
  const {
    isAddInvestigationOpen,
    setIsAddInvestigationOpen,
    investigationPatientId,
    setInvestigationPatientId,
    patients,
    addMajorEvent,
    updatePatient,
  } = useOncology();

  const [selectedPatId, setSelectedPatId] = useState<string>(
    investigationPatientId || (patients.length > 0 ? patients[0].id : '')
  );

  useEffect(() => {
    if (investigationPatientId) {
      setSelectedPatId(investigationPatientId);
    } else if (patients.length > 0 && !selectedPatId) {
      setSelectedPatId(patients[0].id);
    }
  }, [investigationPatientId, patients]);

  const targetPatient = patients.find((p) => p.id === selectedPatId);

  const [date, setDate] = useState(getTodayDateString());
  const [selectedPreset, setSelectedPreset] = useState<string>(COMMON_INVESTIGATIONS[0].name);
  const [isOther, setIsOther] = useState(false);
  const [otherInvestigationText, setOtherInvestigationText] = useState('');
  const [finding, setFinding] = useState<InvestigationStatusChoice>('Normal/in remission');
  const [description, setDescription] = useState(COMMON_INVESTIGATIONS[0].defaultDesc);

  if (!isAddInvestigationOpen) return null;

  const handleSelectPreset = (preset: typeof COMMON_INVESTIGATIONS[0]) => {
    setSelectedPreset(preset.name);
    setIsOther(false);
    setDescription(preset.defaultDesc);
  };

  const handleSelectOther = () => {
    setIsOther(true);
    setSelectedPreset('');
    setDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatId) return;

    const activeInvestigationName = isOther
      ? otherInvestigationText.trim() || 'Custom Investigation'
      : selectedPreset;

    const severityMap: Record<InvestigationStatusChoice, MajorClinicalEvent['severity']> = {
      'Normal/in remission': 'Routine / Favorable',
      'Pending': 'Routine / Favorable',
      'Abnormal': 'Moderate',
      'Suspected relapse': 'Severe / Grade 3-4',
    };

    const isLab =
      activeInvestigationName.includes('CBC') ||
      activeInvestigationName.includes('Tumor') ||
      activeInvestigationName.includes('Thyroid') ||
      activeInvestigationName.includes('Hormon') ||
      activeInvestigationName.includes('Marrow');

    const newEvent: MajorClinicalEvent = {
      id: `inv-${Date.now()}`,
      patientId: selectedPatId,
      date,
      category: isLab ? 'Bone Marrow & Labs' : 'Imaging & Response',
      title: `Investigation: ${activeInvestigationName} [${finding}]`,
      description: description.trim()
        ? `${description.trim()} — Result: ${finding}.`
        : `Result: ${finding}.`,
      severity: severityMap[finding] || 'Routine / Favorable',
      recordedBy: targetPatient?.attendingOncologist || 'Pediatric Oncology Service',
    };

    addMajorEvent(newEvent);

    // If patient is under follow-up, update their last visit date to this investigation date
    if (targetPatient && targetPatient.status === 'Under Follow up') {
      updatePatient({
        ...targetPatient,
        lastVisitDate: date,
      });
    }

    setIsAddInvestigationOpen(false);
    setInvestigationPatientId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto text-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add Clinical Investigation & Surveillance</h2>
              <p className="text-xs text-slate-500">Record surveillance labs, scans, and clinical monitoring tests</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsAddInvestigationOpen(false);
              setInvestigationPatientId(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-900">
          {/* Patient Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
            <select
              value={selectedPatId}
              onChange={(e) => setSelectedPatId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold text-xs focus:border-emerald-500 focus:outline-none"
            >
              {patients.map((pat) => (
                <option key={pat.id} value={pat.id} className="bg-white text-slate-900">
                  {pat.name} ({pat.mrn}) — {pat.diagnosis} [{pat.status === 'Under Follow up' ? 'Follow-up' : 'Treatment'}]
                </option>
              ))}
            </select>
          </div>

          {/* Investigation Date */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Investigation Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-xs bg-white text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Common Surveillance Investigations Buttons */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Select from Common Surveillance Investigations *
            </label>
            <div className="flex flex-wrap gap-1.5 p-2.5 border border-slate-200 rounded-xl bg-slate-50">
              {COMMON_INVESTIGATIONS.map((preset) => {
                const isSelected = !isOther && selectedPreset === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}

              {/* Other Box Button */}
              <button
                type="button"
                onClick={handleSelectOther}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  isOther
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                    : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Other (Free Text)</span>
              </button>
            </div>
          </div>

          {/* If "Other" selected: Free Text input box */}
          {isOther && (
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-300 space-y-1.5 animate-in fade-in duration-150">
              <label className="block font-bold text-emerald-900">
                Other Investigation Name (Free Text) *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={otherInvestigationText}
                onChange={(e) => setOtherInvestigationText(e.target.value)}
                placeholder="Enter specific investigation name (e.g. Lumbar Puncture, Serum Ferritin, Renal Scintigraphy...)"
                className="w-full p-2.5 border border-emerald-400 rounded-lg text-xs bg-white text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
              />
            </div>
          )}

          {/* Results / Findings Status: ONLY the 4 requested statuses */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Results / Findings Status *
            </label>
            <select
              value={finding}
              onChange={(e) => setFinding(e.target.value as InvestigationStatusChoice)}
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              <option value="Normal/in remission" className="bg-white text-slate-900">Normal/in remission</option>
              <option value="Pending" className="bg-white text-slate-900">Pending</option>
              <option value="Abnormal" className="bg-white text-slate-900">Abnormal</option>
              <option value="Suspected relapse" className="bg-white text-slate-900">Suspected relapse</option>
            </select>
          </div>

          {/* Clinical Findings & Remarks */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Clinical Findings & Remarks
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 placeholder-slate-400 focus:outline-none"
              placeholder="Summary of radiologic, lab, or clinical surveillance findings..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsAddInvestigationOpen(false);
                setInvestigationPatientId(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isOther && !otherInvestigationText.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save Investigation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
