import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, Trash2, CheckCircle2, Layers, Pill, Plus, Syringe, Check } from 'lucide-react';
import { ChemotherapyAppointment, ChemotherapyStatus, ChemotherapyDrug, STANDARD_CHEMOTHERAPY_DRUGS } from '../types/oncology';
import { useOncology } from '../context/OncologyContext';
import { isALLDiagnosis, isIntrathecalDrug } from '../utils/oncologyUtils';
import { ClinicalDateInput } from './ClinicalDateInput';
import { NumberStepper } from './NumberStepper';

interface EditAppointmentModalProps {
  appointment: ChemotherapyAppointment | null;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
  appointment,
  patientName,
  isOpen,
  onClose,
}) => {
  const { updateAppointment, deleteAppointment } = useOncology();

  const isALL = isALLDiagnosis(appointment?.diagnosis) || appointment?.scheduleType === 'Phase' || !!appointment?.phaseName;

  const [regimenName, setRegimenName] = useState('');
  const [phaseName, setPhaseName] = useState('Induction');
  const isALLMaintenance = isALL && phaseName.toLowerCase().includes('maintenance') && !phaseName.toLowerCase().includes('interim');
  const [cycleNumber, setCycleNumber] = useState<number>(1);
  const [dayInCycle, setDayInCycle] = useState<number>(1);
  const [scheduledDate, setScheduledDate] = useState('');
  const [status, setStatus] = useState<ChemotherapyStatus>('Scheduled');
  const [doseType, setDoseType] = useState<'Full Dose' | 'With Reduction'>('Full Dose');
  const [reductionPercentage, setReductionPercentage] = useState('25% Reduction');
  const [reductionReason, setReductionReason] = useState('Grade 4 Neutropenia');
  const [remarks, setRemarks] = useState('');
  const [drugs, setDrugs] = useState<ChemotherapyDrug[]>([]);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  useEffect(() => {
    if (appointment) {
      setRegimenName(appointment.regimenName || '');
      setPhaseName(appointment.phaseName || 'Induction');
      setCycleNumber(appointment.cycleNumber || 1);
      setDayInCycle(appointment.dayInCycle || 1);
      setScheduledDate(appointment.scheduledDate || '');
      setStatus(appointment.status || 'Scheduled');
      setDoseType(appointment.doseType || 'Full Dose');
      setReductionPercentage(appointment.reductionPercentage || '25% Reduction');
      setReductionReason(appointment.reductionReason || 'Grade 4 Neutropenia');
      setRemarks(appointment.remarks || '');
      setDrugs(appointment.drugs && appointment.drugs.length > 0 ? [...appointment.drugs] : [{ name: '' }]);
      setIsConfirmDelete(false);
    }
  }, [appointment, isOpen]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate) return;

    const validDrugs = drugs.filter((d) => d.name.trim() !== '').map((d) => ({ name: d.name.trim() }));
    const finalRegimenName = regimenName.trim() || (validDrugs.length > 0 ? validDrugs.map((d) => d.name).join(' + ') : (isALL ? phaseName.trim() : `Cycle ${cycleNumber}`));

    updateAppointment(appointment.id, {
      regimenName: finalRegimenName,
      scheduleType: isALL ? 'Phase' : appointment.scheduleType,
      phaseName: isALL ? phaseName.trim() : undefined,
      cycleNumber: isALL ? (isALLMaintenance ? (Number(cycleNumber) || 1) : 1) : Number(cycleNumber),
      dayInCycle: Number(dayInCycle),
      scheduledDate,
      status,
      doseType,
      reductionPercentage: doseType === 'With Reduction' ? reductionPercentage : undefined,
      reductionReason: doseType === 'With Reduction' ? reductionReason : undefined,
      remarks: remarks.trim(),
      drugs: validDrugs,
    });

    onClose();
  };

  const handleDelete = () => {
    deleteAppointment(appointment.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 text-slate-900">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 text-slate-900">
              <span>Edit Chemotherapy Schedule</span>
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
          {/* Regimen Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              CTH Regimen <span className="text-slate-400 font-normal">(Optional - auto-generated from drugs)</span>
            </label>
            <input
              type="text"
              value={regimenName}
              onChange={(e) => setRegimenName(e.target.value)}
              placeholder="e.g. Vincristine + Doxorubicin or leave blank to auto-generate"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Cycle & Day OR Treatment Phase & Day (For ALL patients) */}
          {isALL ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/60 p-3 rounded-lg border border-blue-200">
              <div>
                <label className="block font-bold text-blue-900 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Treatment Phase (ALL)
                </label>
                <input
                  type="text"
                  required
                  value={phaseName}
                  onChange={(e) => setPhaseName(e.target.value)}
                  placeholder="e.g. Induction, Interim Maintenance 1"
                  className="w-full p-2 border border-blue-300 rounded-lg text-xs font-semibold bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-blue-900 mb-1">Day in Phase</label>
                <NumberStepper
                  min={1}
                  max={120}
                  value={dayInCycle}
                  onChange={(val) => setDayInCycle(val)}
                  className="w-full border-blue-300"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cycle Number</label>
                <NumberStepper
                  min={1}
                  max={50}
                  value={cycleNumber}
                  onChange={(val) => setCycleNumber(val)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Day in Cycle</label>
                <NumberStepper
                  min={1}
                  max={90}
                  value={dayInCycle}
                  onChange={(val) => setDayInCycle(val)}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Date only (No time field anywhere in app) */}
          <div className={`grid gap-3 ${isALLMaintenance ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Scheduled Date <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">DD/MM/YYYY</span>
              </label>
              <ClinicalDateInput
                required
                value={scheduledDate}
                onChange={(d) => setScheduledDate(d)}
              />
            </div>

            {isALLMaintenance && (
              <div>
                <label className="block font-bold text-blue-900 mb-1 flex items-center justify-between">
                  <span>Maintenance Cycle *</span>
                  <span className="text-[10px] text-blue-600 font-normal">e.g. 1, 2...</span>
                </label>
                <NumberStepper
                  min={1}
                  max={50}
                  required
                  value={cycleNumber}
                  onChange={(val) => setCycleNumber(val)}
                  className="w-full border-blue-300"
                />
              </div>
            )}
          </div>

          {/* Schedule Status */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Schedule Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ChemotherapyStatus)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="Scheduled" className="bg-white text-slate-900">Scheduled</option>
              <option value="Administered" className="bg-white text-slate-900">Administered</option>
              <option value="Delayed" className="bg-white text-slate-900">Delayed</option>
              <option value="Missed" className="bg-white text-slate-900">Missed</option>
              <option value="Rescheduled" className="bg-white text-slate-900">Rescheduled</option>
            </select>
          </div>

          {/* Dose Protocol: Full Dose or With Reduction */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-semibold text-slate-700">Dose Protocol</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDoseType('Full Dose')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  doseType === 'Full Dose'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                Full Dose (100%)
              </button>
              <button
                type="button"
                onClick={() => setDoseType('With Reduction')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  doseType === 'With Reduction'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                With Reduction
              </button>
            </div>

            {doseType === 'With Reduction' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Reduction Amount</label>
                  <select
                    value={reductionPercentage}
                    onChange={(e) => setReductionPercentage(e.target.value)}
                    className="w-full p-2 border border-amber-300 bg-white rounded text-xs font-semibold text-amber-900"
                  >
                    <option value="25% Reduction">25% Reduction (75% Dose)</option>
                    <option value="50% Reduction">50% Reduction (50% Dose)</option>
                    <option value="75% Reduction">75% Reduction (25% Dose)</option>
                    <option value="33% Reduction">33% Reduction (67% Dose)</option>
                    <option value="20% Reduction">20% Reduction (80% Dose)</option>
                    <option value="Custom Reduction">Custom Reduction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Clinical Reason</label>
                  <input
                    type="text"
                    value={reductionReason}
                    onChange={(e) => setReductionReason(e.target.value)}
                    placeholder="e.g. Neutropenia, Mucositis"
                    className="w-full p-2 border border-amber-300 bg-white text-slate-900 placeholder-slate-400 rounded text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Prescribed Chemotherapy Drugs (Names Only) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chemotherapy Drugs (Drug Names Only)</span>
                </label>
                <span className="block text-[11px] text-slate-500">
                  Drug names only (no doses or route required)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDrugs([...drugs, { name: '' }])}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-300 px-2.5 py-1 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Drug
              </button>
            </div>

            {/* Quick Add Presets: Arranged alphabetically */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Quick Add Drug (Alphabetical A–Z):
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {STANDARD_CHEMOTHERAPY_DRUGS.map((drugName) => {
                  const isIT = isIntrathecalDrug(drugName);
                  const isChosen = drugs.some(
                    (d) => d.name.toLowerCase().trim() === drugName.toLowerCase().trim()
                  );
                  return (
                    <button
                      key={drugName}
                      type="button"
                      onClick={() => {
                        if (isChosen) {
                          setDrugs(
                            drugs.filter(
                              (d) => d.name.toLowerCase().trim() !== drugName.toLowerCase().trim()
                            )
                          );
                        } else {
                          if (drugs.length === 1 && !drugs[0].name.trim()) {
                            setDrugs([{ name: drugName }]);
                          } else {
                            setDrugs([...drugs, { name: drugName }]);
                          }
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                        isChosen
                          ? 'bg-blue-600 text-white font-bold shadow-xs ring-2 ring-blue-500/50 border border-blue-700'
                          : isIT
                          ? 'bg-indigo-50 text-indigo-900 border border-indigo-300 hover:bg-indigo-100 shadow-2xs font-extrabold'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 font-semibold'
                      }`}
                    >
                      {isChosen ? (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3] shrink-0" />
                      ) : isIT ? (
                        <Syringe className="w-3 h-3 text-indigo-600 shrink-0" />
                      ) : (
                        <span className="text-slate-400 font-normal">+</span>
                      )}
                      <span>{drugName}</span>
                      {isIT && !isChosen && (
                        <span className="text-[9px] px-1 py-0.2 bg-indigo-200 text-indigo-900 rounded font-bold uppercase tracking-wider">
                          IT
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Datalist for autocomplete */}
            <datalist id="edit-appt-chemo-drugs-list">
              {STANDARD_CHEMOTHERAPY_DRUGS.map((drug) => (
                <option key={drug} value={drug} />
              ))}
            </datalist>

            {/* Drug Name Input Rows */}
            <div className="space-y-2">
              {drugs.map((drug, index) => {
                const isIT = isIntrathecalDrug(drug.name);
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                      isIT
                        ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200 shadow-2xs'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="text"
                      list="edit-appt-chemo-drugs-list"
                      placeholder="Drug Name (e.g. Vincristine, Methotrexate (HD), Intrathecal (IT))"
                      value={drug.name}
                      onChange={(e) =>
                        setDrugs(
                          drugs.map((d, i) => (i === index ? { name: e.target.value } : d))
                        )
                      }
                      className={`flex-1 p-2 border rounded-lg text-xs placeholder-slate-400 focus:outline-none ${
                        isIT
                          ? 'border-indigo-400 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500'
                          : 'border-slate-300 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500'
                      }`}
                    />
                    {isIT && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-900 bg-indigo-100 border border-indigo-200 px-2 py-1 rounded shrink-0">
                        <Syringe className="w-3 h-3 text-indigo-600" />
                        <span>Intrathecal (IT)</span>
                      </span>
                    )}
                    {drugs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDrugs(drugs.filter((_, i) => i !== index))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
                        title="Remove drug"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remarks & Precautions */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Remarks, Supportive Care & Precautions
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Vigorous hydration 3000ml/m2, Mesna uroprotection, Ondansetron. Ensure ANC > 750."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Delete Confirmation Box */}
          {isConfirmDelete && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Are you sure you want to remove this scheduled chemotherapy session?
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
                  Yes, Remove Schedule
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
                Delete Schedule
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
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
