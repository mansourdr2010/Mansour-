import React, { useState, useEffect, useRef } from 'react';
import { useOncology } from '../context/OncologyContext';
import { MajorClinicalEvent, EventCategory } from '../types/oncology';
import { X, Activity, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';
import { getTodayDateString } from '../utils/oncologyUtils';
import { ClinicalDateInput } from './ClinicalDateInput';

const EVENT_CATEGORIES: EventCategory[] = [
  'Infection',
  'Toxicity',
  'Labs',
  'Surgery/access',
  'Imaging/response',
  'Evaluation milestone',
];

export const AddEventModal: React.FC = () => {
  const {
    isAddEventOpen,
    setIsAddEventOpen,
    addEventPatientId,
    setAddEventPatientId,
    patients,
    addMajorEvent,
  } = useOncology();

  const [selectedPatId, setSelectedPatId] = useState<string>(
    addEventPatientId || (patients.length > 0 ? patients[0].id : '')
  );

  useEffect(() => {
    if (addEventPatientId) {
      setSelectedPatId(addEventPatientId);
    } else if (patients.length > 0 && !selectedPatId) {
      setSelectedPatId(patients[0].id);
    }
  }, [addEventPatientId, patients]);

  const targetPatient = patients.find((p) => p.id === selectedPatId);

  const [date, setDate] = useState(getTodayDateString());
  const [category, setCategory] = useState<EventCategory>('Infection');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAddEventOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImageName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatId) return;

    const newEvent: MajorClinicalEvent = {
      id: `evt-${Date.now()}`,
      patientId: selectedPatId,
      date,
      category,
      title: category,
      description: description.trim(),
      imageUrl: imageUrl || undefined,
      imageName: imageName || undefined,
    };

    addMajorEvent(newEvent);
    // Reset state
    setDescription('');
    setImageUrl(null);
    setImageName('');
    setIsAddEventOpen(false);
    setAddEventPatientId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto text-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 border border-teal-300 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Log Major Clinical Event</h2>
              <p className="text-xs text-slate-500">
                Patient: <strong className="text-teal-800 font-semibold">{targetPatient?.name || 'Selected Patient'}</strong> {targetPatient?.mrn ? `(MRN: ${targetPatient.mrn})` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsAddEventOpen(false);
              setAddEventPatientId(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-900">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Event Date *</span>
              <span className="text-[10px] text-slate-500 font-mono">DD/MM/YYYY</span>
            </label>
            <ClinicalDateInput
              required
              value={date}
              onChange={(d) => setDate(d)}
            />
          </div>

          {/* Category Choice Pills with High Contrast */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-teal-600 text-white border-teal-500 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Narrative / Interventions */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Clinical Narrative / Findings & Interventions
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of clinical course, lab values, interventions (e.g. IV antibiotics, dose adjustments), and clinical resolution."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Image Upload for Clinical Event */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Event Image / Clinical Scan / Photo (Optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {!imageUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-slate-600 hover:text-teal-700 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Upload Image / Scan (JPG, PNG, WebP)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-teal-300">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={imageUrl}
                    alt={imageName || 'Event attachment'}
                    className="w-12 h-12 object-cover rounded-lg border border-teal-500 shrink-0 bg-slate-100 shadow-2xs"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{imageName || 'Uploaded Image'}</p>
                    <span className="text-[11px] text-teal-700">Image attached to event</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-[11px] font-semibold text-teal-800 bg-white hover:bg-teal-50 border border-teal-300 rounded-md transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsAddEventOpen(false);
                setAddEventPatientId(null);
              }}
              className="px-4 py-2 text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Log Major Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
