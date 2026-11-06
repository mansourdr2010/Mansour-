import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, Trash2, CheckCircle2, Upload } from 'lucide-react';
import { MajorClinicalEvent } from '../types/oncology';
import { useOncology } from '../context/OncologyContext';
import { ClinicalDateInput } from './ClinicalDateInput';

interface EditEventModalProps {
  event: MajorClinicalEvent | null;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: MajorClinicalEvent['category'][] = [
  'Infection',
  'Toxicity',
  'Labs',
  'Surgery/access',
  'Imaging/response',
  'Evaluation milestone',
];

const SEVERITIES: MajorClinicalEvent['severity'][] = [
  'Routine / Favorable',
  'Mild',
  'Moderate',
  'Severe / Grade 3-4',
  'Life-threatening',
];

export const EditEventModal: React.FC<EditEventModalProps> = ({
  event,
  patientName,
  isOpen,
  onClose,
}) => {
  const { updateMajorEvent, deleteMajorEvent } = useOncology();

  const [date, setDate] = useState('');
  const [category, setCategory] = useState<MajorClinicalEvent['category']>('Infection');
  const [severity, setSeverity] = useState<MajorClinicalEvent['severity']>('Moderate');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordedBy, setRecordedBy] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageName, setImageName] = useState<string | undefined>(undefined);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  useEffect(() => {
    if (event) {
      setDate(event.date || '');
      setCategory(event.category || 'Infection');
      setSeverity(event.severity || 'Moderate');
      setTitle(event.title || '');
      setDescription(event.description || '');
      setRecordedBy(event.recordedBy || 'Dr. Mansour, MD');
      setImageUrl(event.imageUrl);
      setImageName(event.imageName);
      setIsConfirmDelete(false);
    }
  }, [event, isOpen]);

  if (!isOpen || !event) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    updateMajorEvent(event.patientId, {
      ...event,
      date,
      category,
      severity,
      title: title.trim(),
      description: description.trim(),
      recordedBy: recordedBy.trim() || 'Dr. Mansour, MD',
      imageUrl,
      imageName,
    });

    onClose();
  };

  const handleDelete = () => {
    deleteMajorEvent(event.patientId, event.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 text-slate-900">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 text-slate-900">
              <span>Edit Clinical Event</span>
            </h3>
            <p className="text-xs text-slate-500">
              Patient: <strong className="text-slate-900 font-semibold">{patientName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Event Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Febrile Neutropenia (Absolute Neutrophils 120)"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  Event Date <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">DD/MM/YYYY</span>
              </label>
              <ClinicalDateInput
                required
                value={date}
                onChange={(d) => setDate(d)}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Event Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MajorClinicalEvent['category'])}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:border-teal-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-white text-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Severity & Recorded By */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Severity / Grade</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as MajorClinicalEvent['severity'])}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900 focus:outline-none"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s} className="bg-white text-slate-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recorded By</label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                placeholder="e.g. Dr. Mansour, MD"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Clinical Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Clinical Details & Interventions
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe presentation, vital signs, interventions, dose delays, and clinical outcome..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Image / Scan Attachment */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block font-semibold text-slate-800">Attach Scan, Lab Slip, or Clinical Photo</label>
            {imageUrl ? (
              <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <img
                    src={imageUrl}
                    alt={imageName || 'Scan'}
                    className="w-10 h-10 object-cover rounded border border-slate-200"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                      {imageName || 'Attached Image'}
                    </span>
                    <span className="text-[10px] text-teal-600 font-bold">Image loaded</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(undefined);
                    setImageName(undefined);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-teal-500 cursor-pointer transition-colors bg-white">
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs text-slate-600 font-medium">Click to upload scan or image file</span>
                <span className="text-[10px] text-slate-400">PNG, JPG, WebP supported</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Delete Confirmation Box */}
          {isConfirmDelete && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Are you sure you want to delete this clinical event?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsConfirmDelete(false)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Yes, Delete Event
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            {!isConfirmDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmDelete(true)}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Event
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
