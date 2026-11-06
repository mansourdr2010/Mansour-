import React, { useState, useEffect } from 'react';
import { useOncology } from '../context/OncologyContext';
import { useAuth } from '../context/AuthContext';
import {
  Patient,
  PediatricDiagnosis,
  TreatmentStatus,
  PediatricStage,
  RiskStratification,
  FollowUpStatus,
  ProtocolDocument,
  STANDARD_PEDIATRIC_DIAGNOSES,
} from '../types/oncology';
import {
  X,
  Pencil,
  ArrowRightLeft,
  ShieldCheck,
  Pill,
  AlertTriangle,
  Calendar,
  FileText,
  Upload,
  Trash2,
  Paperclip,
  CheckCircle2,
  Layers,
  Clock,
  BookOpen,
} from 'lucide-react';
import { calculateAgeFromDob, CLINICAL_TODAY, formatClinicalDate, normalizeDiagnosisDisplay } from '../utils/oncologyUtils';
import { ClinicalDateInput } from './ClinicalDateInput';
import { ProtocolStageSelector } from './ProtocolStageSelector';

const ALL_STAGES: PediatricStage[] = [
  'Stage I',
  'Stage II',
  'Stage III',
  'Stage IV',
  'Non-metastatic',
  'Metastatic',
  'CNS-1',
  'CNS-2',
  'CNS-3',
  'N/A',
];

const FOLLOW_UP_OPTIONS: FollowUpStatus[] = [
  'Regular Follow-up',
  'Lost to Follow-up',
  'Scheduled for Discharge',
  'Palliative',
  'Died',
];

export const EditPatientModal: React.FC = () => {
  const {
    isEditPatientOpen,
    setIsEditPatientOpen,
    editPatientId,
    setEditPatientId,
    patients,
    updatePatient,
    deletePatient,
  } = useOncology();

  const { isAdmin } = useAuth();

  const targetPatient = patients.find((p) => p.id === editPatientId);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isRelapseConfirmOpen, setIsRelapseConfirmOpen] = useState(false);
  const [isEndChemoConfirmOpen, setIsEndChemoConfirmOpen] = useState(false);
  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [mrn, setMrn] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [diagnosis, setDiagnosis] = useState<PediatricDiagnosis>('Acute Lymphoblastic Leukemia (ALL)');
  const [isCustomDiagnosis, setIsCustomDiagnosis] = useState(false);
  const [customDiagnosisText, setCustomDiagnosisText] = useState('');
  const [stage, setStage] = useState<PediatricStage>('CNS-1');
  const [riskStratification, setRiskStratification] = useState<RiskStratification>('Standard Risk');
  const [dateOfDiagnosis, setDateOfDiagnosis] = useState('');
  const [lastChemoReceived, setLastChemoReceived] = useState('');
  const [lastChemoDate, setLastChemoDate] = useState('');
  const [majorComorbidity, setMajorComorbidity] = useState('');
  const [status, setStatus] = useState<TreatmentStatus>('On Treatment');
  
  // Off-Therapy Specific Fields
  const [followUpStartDate, setFollowUpStartDate] = useState('');
  const [lastVisitDate, setLastVisitDate] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>('Regular Follow-up');
  // Treatment Details & Protocol
  const [protocol, setProtocol] = useState('');
  const [treatmentStageOrPhase, setTreatmentStageOrPhase] = useState('');
  const [protocolTrackingMode, setProtocolTrackingMode] = useState<'phase' | 'week' | 'cycle' | 'custom'>('phase');
  const [protocolDocuments, setProtocolDocuments] = useState<ProtocolDocument[]>([]);
  const [protocolDocumentUrl, setProtocolDocumentUrl] = useState<string | undefined>(undefined);
  const [protocolDocumentName, setProtocolDocumentName] = useState<string | undefined>(undefined);
  const [protocolDocumentType, setProtocolDocumentType] = useState<ProtocolDocument['type'] | undefined>(undefined);
  const [protocolDocumentUploadedAt, setProtocolDocumentUploadedAt] = useState<string | undefined>(undefined);
  const [protocolDocumentSize, setProtocolDocumentSize] = useState<string | undefined>(undefined);
  const [summaryProgress, setSummaryProgress] = useState('');
  const [lineAccess, setLineAccess] = useState<Patient['lineAccess']>('Port-a-Cath (Right subclavian)');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state whenever target patient changes or modal opens
  useEffect(() => {
    if (targetPatient) {
      setName(targetPatient.name || '');
      setNationalId(targetPatient.nationalId || '');
      setMrn(targetPatient.mrn || '');
      setDateOfBirth(targetPatient.dateOfBirth || '2021-01-01');
      setGender(targetPatient.gender || 'Male');
      
      const normalized = normalizeDiagnosisDisplay(targetPatient.diagnosis);
      const isStandard = (STANDARD_PEDIATRIC_DIAGNOSES as readonly string[]).includes(normalized);
      if (isStandard) {
        setIsCustomDiagnosis(false);
        setDiagnosis(normalized as PediatricDiagnosis);
        setCustomDiagnosisText('');
      } else {
        setIsCustomDiagnosis(true);
        setDiagnosis(targetPatient.diagnosis);
        setCustomDiagnosisText(targetPatient.diagnosis);
      }

      setStage(targetPatient.stage || 'CNS-1');
      setRiskStratification(targetPatient.riskStratification || 'Standard Risk');
      setDateOfDiagnosis(targetPatient.dateOfDiagnosis || CLINICAL_TODAY);
      setLastChemoReceived(targetPatient.lastChemoReceived || '');
      setLastChemoDate(targetPatient.lastChemoDate || '');
      setMajorComorbidity(targetPatient.majorComorbidity || 'None');
      setStatus(targetPatient.status || 'On Treatment');
      setFollowUpStartDate(targetPatient.followUpStartDate || targetPatient.lastChemoDate || CLINICAL_TODAY);
      setLastVisitDate(targetPatient.lastVisitDate || CLINICAL_TODAY);
      setFollowUpStatus(targetPatient.followUpStatus || 'Regular Follow-up');
      setProtocol(targetPatient.protocol || '');
      
      // Stage or Phase: default to existing treatmentStageOrPhase, or fallback from cycle
      const stageOrPhase = targetPatient.treatmentStageOrPhase || 
        (targetPatient.currentCycle ? `Cycle ${targetPatient.currentCycle} of ${targetPatient.totalPlannedCycles || 6}` : 'Induction Phase');
      setTreatmentStageOrPhase(stageOrPhase);

      if (stageOrPhase.toLowerCase().includes('week')) {
        setProtocolTrackingMode('week');
      } else if (stageOrPhase.toLowerCase().includes('cycle')) {
        setProtocolTrackingMode('cycle');
      } else if (stageOrPhase.toLowerCase().includes('phase') || stageOrPhase.toLowerCase().includes('induction') || stageOrPhase.toLowerCase().includes('maintenance')) {
        setProtocolTrackingMode('phase');
      } else {
        setProtocolTrackingMode('custom');
      }

      // Initialize documents: use protocolDocuments array, or migrate legacy single document
      if (targetPatient.protocolDocuments && targetPatient.protocolDocuments.length > 0) {
        setProtocolDocuments([...targetPatient.protocolDocuments]);
      } else if (targetPatient.protocolDocumentUrl) {
        setProtocolDocuments([
          {
            id: 'doc-legacy',
            name: targetPatient.protocolDocumentName || 'Protocol Roadmap Document',
            type: (targetPatient.protocolDocumentType as any) || 'pdf',
            url: targetPatient.protocolDocumentUrl,
            size: targetPatient.protocolDocumentSize || 'Standard',
            uploadedAt: targetPatient.protocolDocumentUploadedAt || CLINICAL_TODAY,
          },
        ]);
      } else {
        setProtocolDocuments([]);
      }

      setProtocolDocumentUrl(targetPatient.protocolDocumentUrl);
      setProtocolDocumentName(targetPatient.protocolDocumentName);
      setProtocolDocumentType(targetPatient.protocolDocumentType as any);
      setProtocolDocumentUploadedAt(targetPatient.protocolDocumentUploadedAt);
      setProtocolDocumentSize(targetPatient.protocolDocumentSize);

      setSummaryProgress(targetPatient.summaryProgress || '');
      setLineAccess(targetPatient.lineAccess || 'Port-a-cath');
    }
  }, [targetPatient, isEditPatientOpen]);

  if (!isEditPatientOpen || !targetPatient) return null;

  const ageCalculation = calculateAgeFromDob(dateOfBirth, CLINICAL_TODAY);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let docType: ProtocolDocument['type'] = 'other';
      if (file.type === 'application/pdf' || ext === 'pdf') docType = 'pdf';
      else if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) docType = 'image';
      else if (ext === 'docx') docType = 'docx';
      else if (ext === 'doc') docType = 'doc';

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const sizeKb = Math.round(file.size / 1024);
        const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

        const newDoc: ProtocolDocument = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: docType,
          url: result,
          size: sizeStr,
          uploadedAt: new Date().toISOString().split('T')[0],
        };

        setProtocolDocuments((prev) => [...prev, newDoc]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveDocument = (docId: string) => {
    setProtocolDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleEndChemoClick = () => {
    setIsEndChemoConfirmOpen(true);
  };

  const handleConfirmEndChemo = () => {
    setStatus('Under Follow up');
    setFollowUpStartDate(CLINICAL_TODAY);
    setLastVisitDate(CLINICAL_TODAY);
    setFollowUpStatus('Regular Follow-up');
    setSummaryProgress(`Chemotherapy ended on ${formatClinicalDate(CLINICAL_TODAY)}. Transitioned to off-therapy follow-up surveillance.`);
    setIsEndChemoConfirmOpen(false);
  };

  const handleRelapseClick = () => {
    setIsRelapseConfirmOpen(true);
  };

  const handleConfirmRelapse = () => {
    setStatus('On Treatment');
    setSummaryProgress(`Relapse documented on ${formatClinicalDate(CLINICAL_TODAY)}. Resumed active chemotherapy protocol.`);
    setIsRelapseConfirmOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter patient name.');
      return;
    }
    if (!mrn.trim()) {
      alert('Please enter MRN.');
      return;
    }

    const finalDiagnosis = isCustomDiagnosis
      ? (customDiagnosisText.trim() || 'Other Pediatric Malignancy')
      : diagnosis;

    const updatedPatient: Patient = {
      ...targetPatient,
      name: name.trim(),
      nationalId: nationalId.trim(),
      mrn: mrn.trim(),
      dateOfBirth,
      ageYears: ageCalculation.years,
      gender,
      diagnosis: finalDiagnosis,
      stage,
      riskStratification,
      dateOfDiagnosis,
      lastChemoReceived: lastChemoReceived.trim(),
      lastChemoDate,
      majorComorbidity: majorComorbidity.trim() || 'None',
      status,
      followUpStartDate: status === 'Under Follow up' ? (followUpStartDate || CLINICAL_TODAY) : undefined,
      lastVisitDate: status === 'Under Follow up' ? (lastVisitDate || CLINICAL_TODAY) : undefined,
      followUpStatus: status === 'Under Follow up' ? followUpStatus : undefined,
      protocol: protocol.trim(),
      treatmentStageOrPhase: treatmentStageOrPhase.trim() || undefined,
      protocolDocuments,
      protocolDocumentUrl: protocolDocuments[0]?.url,
      protocolDocumentName: protocolDocuments[0]?.name,
      protocolDocumentType: protocolDocuments[0]?.type,
      protocolDocumentUploadedAt: protocolDocuments[0]?.uploadedAt,
      protocolDocumentSize: protocolDocuments[0]?.size,
      summaryProgress: summaryProgress.trim(),
      lineAccess,
    };

    updatePatient(updatedPatient);
    setIsEditPatientOpen(false);
    setEditPatientId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit Patient Clinical Profile</h2>
              <p className="text-xs text-slate-500">
                Updating {targetPatient.name} ({targetPatient.mrn})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsEditPatientOpen(false);
              setEditPatientId(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Cohort Switcher Banner */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Current Cohort Group
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                    status === 'On Treatment'
                      ? 'bg-teal-100 text-teal-800 border border-teal-200'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {status === 'On Treatment' ? (
                    <>
                      <Pill className="w-3.5 h-3.5 text-teal-600" />
                      On Treatment (Active Chemotherapy)
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      Ended Treatment & Under Follow up
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Quick Cohort Transition Buttons */}
            <div className="flex items-center gap-2">
              {status === 'On Treatment' ? (
                <button
                  type="button"
                  onClick={handleEndChemoClick}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  End CTH
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRelapseClick}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Relapse
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Core Identification */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>Patient Identification</span>
              <span className="text-[11px] font-normal text-slate-500">Name, DOB, MRN, ID</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-900"
                >
                  <option className="text-slate-900 bg-white" value="Male">Male</option>
                  <option className="text-slate-900 bg-white" value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Date of Birth * (Calculates Age)</span>
                  <span className="text-[10px] text-slate-500 font-mono">DD/MM/YYYY</span>
                </label>
                <ClinicalDateInput
                  required
                  value={dateOfBirth}
                  onChange={(d) => setDateOfBirth(d)}
                />
                <div className="mt-1 text-[11px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Calculated Age: {ageCalculation.displayText}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">MRN</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 61042"
                  value={mrn}
                  onChange={(e) => setMrn(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">National ID / Civil ID</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Diagnosis & Staging */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>Diagnosis & Staging</span>
              <span className="text-[11px] font-normal text-slate-500">Diagnosis list & Clinical Stage</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Diagnosis</label>
                <select
                  value={isCustomDiagnosis ? 'Other' : diagnosis}
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      setIsCustomDiagnosis(true);
                    } else {
                      setIsCustomDiagnosis(false);
                      setDiagnosis(e.target.value as PediatricDiagnosis);
                    }
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium text-slate-900"
                >
                  {STANDARD_PEDIATRIC_DIAGNOSES.map((diag) => (
                    <option className="text-slate-900 bg-white" key={diag} value={diag}>
                      {diag}
                    </option>
                  ))}
                  <option className="text-slate-900 bg-white" value="Other">Other (Free text custom diagnosis)...</option>
                </select>

                {isCustomDiagnosis && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      placeholder="Enter custom diagnosis (e.g. Hepatoblastoma, Retinoblastoma)"
                      value={customDiagnosisText}
                      onChange={(e) => setCustomDiagnosisText(e.target.value)}
                      className="w-full p-2 border border-teal-500 ring-1 ring-teal-500 rounded-lg text-xs font-medium bg-teal-50/20 text-slate-900"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stage *</label>
                <select
                  value={stage}
                  onChange={(e: any) => setStage(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono text-xs font-semibold text-slate-900"
                >
                  {ALL_STAGES.map((stg) => (
                    <option className="text-slate-900 bg-white" key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Risk Stratification</label>
                <select
                  value={riskStratification}
                  onChange={(e: any) => setRiskStratification(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-900"
                >
                  <option className="text-slate-900 bg-white" value="Low Risk">Low Risk</option>
                  <option className="text-slate-900 bg-white" value="Standard Risk">Standard Risk</option>
                  <option className="text-slate-900 bg-white" value="Intermediate Risk">Intermediate Risk</option>
                  <option className="text-slate-900 bg-white" value="High Risk">High Risk</option>
                  <option className="text-slate-900 bg-white" value="Very High Risk">Very High Risk</option>
                  <option className="text-slate-900 bg-white" value="N/A">N/A</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Venous access</label>
                <select
                  value={lineAccess}
                  onChange={(e: any) => setLineAccess(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-900"
                >
                  <option className="text-slate-900 bg-white" value="Port-a-cath">Port-a-cath</option>
                  <option className="text-slate-900 bg-white" value="Peripheral IV">Peripheral IV</option>
                  <option className="text-slate-900 bg-white" value="PICC">PICC</option>
                  <option className="text-slate-900 bg-white" value="Hickman">Hickman</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Date of Diagnosis *</span>
                  <span className="text-[10px] text-slate-500 font-mono">DD/MM/YYYY</span>
                </label>
                <ClinicalDateInput
                  required
                  value={dateOfDiagnosis}
                  onChange={(d) => setDateOfDiagnosis(d)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Cohort-Specific Fields */}
          {status === 'Under Follow up' ? (
            <div className="space-y-3 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200">
              <h3 className="font-bold text-indigo-950 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Off-Therapy Follow-Up Details
                </span>
                <span className="text-[11px] font-semibold text-indigo-800">Surveillance Cohort</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>End of Therapy Date *</span>
                    <span className="text-[10px] text-slate-500 font-mono">DD/MM/YYYY</span>
                  </label>
                  <ClinicalDateInput
                    required
                    value={followUpStartDate}
                    onChange={(d) => setFollowUpStartDate(d)}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Date of Last Visit *</span>
                    <span className="text-[10px] text-slate-500 font-mono">DD/MM/YYYY</span>
                  </label>
                  <ClinicalDateInput
                    required
                    value={lastVisitDate}
                    onChange={(d) => setLastVisitDate(d)}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Follow-Up Status Option *
                  </label>
                  <select
                    value={followUpStatus}
                    onChange={(e: any) => setFollowUpStatus(e.target.value)}
                    className="w-full p-2 border border-indigo-300 rounded-lg bg-white font-bold text-indigo-900 text-xs"
                  >
                    {FOLLOW_UP_OPTIONS.map((opt) => (
                      <option className="text-slate-900 bg-white" key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-teal-50/50 rounded-xl border border-teal-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-teal-950 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-teal-600" />
                  Active Treatment & Chemotherapy Details
                </h3>
                <span className="text-[11px] font-semibold text-teal-800">On Treatment Cohort</span>
              </div>

              {/* Protocol Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Protocol Name
                </label>
                <input
                  type="text"
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  placeholder="e.g. COG AALL0932, EURAMOS-1, SIOP-RTSG, COG ANBL0032"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                />
              </div>

              {/* Flexible Protocol Stage / Treatment Phase / Week Tracker */}
              <ProtocolStageSelector
                value={treatmentStageOrPhase}
                onChange={(val) => setTreatmentStageOrPhase(val)}
                label="Protocol Stage / Treatment Phase"
              />

              {/* Protocol Document Upload / Management (Multiple Files: PDF, JPG, DOCX, etc.) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">
                        Attach Protocol
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Upload protocol roadmaps, consent forms, and study arms (PDF, JPG/PNG, DOCX, etc.)
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ Upload Protocol File(s)</span>
                  </button>
                </div>

                {protocolDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {protocolDocuments.map((doc) => {
                      const typeBadgeColor =
                        doc.type === 'pdf'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : doc.type === 'image'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : doc.type === 'docx' || doc.type === 'doc'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200';

                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span
                              className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] border ${typeBadgeColor}`}
                            >
                              {doc.type}
                            </span>
                            <div className="truncate">
                              <span className="font-bold text-slate-900 block truncate">
                                {doc.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {doc.size || 'Attached'} • Uploaded {doc.uploadedAt}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <a
                              href={doc.url}
                              download={doc.name}
                              className="px-2 py-0.5 text-[11px] bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium"
                            >
                              Download
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(doc.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center">
                    <p className="text-[11px] text-slate-500">
                      No protocol files uploaded yet. You can upload multiple files (PDFs, roadmaps, images, DOCX guidelines) to cross-reference while reviewing this patient.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Last Chemotherapy Received & Date */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5">
              Last Chemotherapy Administered
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Last Chemotherapy Regimen Received
                </label>
                <input
                  type="text"
                  value={lastChemoReceived}
                  onChange={(e) => setLastChemoReceived(e.target.value)}
                  placeholder="e.g. Consolidation: HD-MTX + 6-MP"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Date of Last Chemo</span>
                  <span className="text-[10px] text-slate-500 font-mono">DD/MM/YYYY</span>
                </label>
                <ClinicalDateInput
                  value={lastChemoDate}
                  onChange={(d) => setLastChemoDate(d)}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Comorbidity & Clinical Summary */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1.5">
              Comorbidity & Clinical Remarks
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Comorbidity</label>
              <input
                type="text"
                value={majorComorbidity}
                onChange={(e) => setMajorComorbidity(e.target.value)}
                placeholder="e.g. Down Syndrome, G6PD Deficiency, Sensorineural hearing loss, None"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Summary</label>
              <textarea
                rows={2}
                value={summaryProgress}
                onChange={(e) => setSummaryProgress(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
            {/* Delete Patient File button (Only accessible to Admin users) */}
            {isAdmin && targetPatient ? (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Permanently delete this entire patient file (Admin only)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Entire Patient File</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditPatientOpen(false);
                  setEditPatientId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </form>

        {/* Delete Patient Confirmation Dialog Modal */}
        {isConfirmDeleteOpen && targetPatient && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-rose-300">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Delete Entire Patient File?</h4>
                  <p className="text-xs text-rose-600 font-semibold">Admin Authorization Required</p>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 mb-4 space-y-2">
                <p>
                  Are you sure you want to permanently delete the patient file for{' '}
                  <strong className="text-rose-900 font-black">{targetPatient.name}</strong>
                  {targetPatient.mrn ? ` (MRN: ${targetPatient.mrn})` : ''}?
                </p>
                <p className="font-semibold text-rose-800">
                  This action will permanently remove all chemotherapy schedules, clinical events, colleague notes, and records. It cannot be recovered.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deletePatient(targetPatient.id);
                    setIsConfirmDeleteOpen(false);
                    setIsEditPatientOpen(false);
                    setEditPatientId(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Patient File</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Relapse Confirmation Dialog */}
        {isRelapseConfirmOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-5 space-y-4 bg-white text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">Relapse Confirmation</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRelapseConfirmOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Are you sure patient is relapse?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRelapseConfirmOpen(false)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRelapse}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirm Relapse</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* End Chemo Confirmation Dialog */}
        {isEndChemoConfirmOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-5 space-y-4 bg-white text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">End Chemotherapy Confirmation</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEndChemoConfirmOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Are you sure patient has finished chemotherapy?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEndChemoConfirmOpen(false)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEndChemo}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirm End CTH</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
