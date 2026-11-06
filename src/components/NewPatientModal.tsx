import React, { useState, useEffect } from 'react';
import { useOncology } from '../context/OncologyContext';
import { Patient, PediatricDiagnosis, TreatmentStatus, RiskStratification, PediatricStage, ProtocolDocument, STANDARD_PEDIATRIC_DIAGNOSES } from '../types/oncology';
import { X, UserPlus, FileText, Upload, Trash2, BookOpen, Layers } from 'lucide-react';
import { calculateAgeFromDob, CLINICAL_TODAY } from '../utils/oncologyUtils';
import { ClinicalDateInput } from './ClinicalDateInput';

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

export const NewPatientModal: React.FC = () => {
  const { isNewPatientOpen, setIsNewPatientOpen, addPatient, setSelectedPatientId } = useOncology();

  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [mrn, setMrn] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('2021-04-12');
  const [ageYears, setAgeYears] = useState(5);
  const [ageDisplayText, setAgeDisplayText] = useState('5 yrs');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [diagnosis, setDiagnosis] = useState<PediatricDiagnosis>('Acute Lymphoblastic Leukemia (ALL)');
  const [isCustomDiagnosis, setIsCustomDiagnosis] = useState(false);
  const [customDiagnosisText, setCustomDiagnosisText] = useState('');
  const [stage, setStage] = useState<PediatricStage>('CNS-1');
  const [dateOfDiagnosis, setDateOfDiagnosis] = useState(CLINICAL_TODAY);
  const [lastChemoReceived, setLastChemoReceived] = useState('');
  const [lastChemoDate, setLastChemoDate] = useState('');
  const [majorComorbidity, setMajorComorbidity] = useState('');
  const [status, setStatus] = useState<TreatmentStatus>('On Treatment');
  const [riskStratification, setRiskStratification] = useState<RiskStratification>('Standard Risk');
  const [protocol, setProtocol] = useState('');
  const [treatmentStageOrPhase, setTreatmentStageOrPhase] = useState('Induction Phase');
  const [protocolDocuments, setProtocolDocuments] = useState<ProtocolDocument[]>([]);
  const [attendingOncologist, setAttendingOncologist] = useState('Dr. Mansour, MD');
  const [fellowOrColleague, setFellowOrColleague] = useState('Dr. Elena Rostova, MD');
  const [summaryProgress, setSummaryProgress] = useState('');
  const [lineAccess, setLineAccess] = useState<Patient['lineAccess']>('Port-a-cath');
  const [allergies, setAllergies] = useState('No known drug allergies');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  // Automatically update age when Date of Birth changes
  useEffect(() => {
    if (dateOfBirth) {
      const calc = calculateAgeFromDob(dateOfBirth, CLINICAL_TODAY);
      setAgeYears(calc.years);
      setAgeDisplayText(calc.displayText);
    }
  }, [dateOfBirth]);

  if (!isNewPatientOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalDiagnosis = isCustomDiagnosis
      ? (customDiagnosisText.trim() || 'Other Pediatric Malignancy')
      : diagnosis;

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      nationalId: nationalId.trim(),
      mrn: mrn.trim(),
      name: name.trim(),
      dateOfBirth,
      ageYears,
      gender,
      diagnosis: finalDiagnosis,
      stage,
      dateOfDiagnosis,
      lastChemoReceived: lastChemoReceived.trim() || 'None',
      lastChemoDate: lastChemoDate || '',
      majorComorbidity: majorComorbidity.trim() || 'None',
      status,
      riskStratification,
      protocol: protocol.trim() || 'Pediatric Oncology Standard Protocol',
      treatmentStageOrPhase: treatmentStageOrPhase.trim() || 'Induction Phase',
      protocolDocuments,
      protocolDocumentUrl: protocolDocuments[0]?.url,
      protocolDocumentName: protocolDocuments[0]?.name,
      protocolDocumentType: protocolDocuments[0]?.type,
      protocolDocumentUploadedAt: protocolDocuments[0]?.uploadedAt,
      protocolDocumentSize: protocolDocuments[0]?.size,
      treatmentStartDate: CLINICAL_TODAY,
      estimatedCompletionDate: '2028-10-20',
      attendingOncologist: attendingOncologist.trim() || 'Dr. Mansour, MD',
      fellowOrColleague: fellowOrColleague.trim() || 'Dr. Elena Rostova, MD',
      summaryProgress: summaryProgress.trim(),
      lineAccess,
      allergies: allergies.split(',').map((s) => s.trim()).filter(Boolean),
      events: [
        {
          id: `evt-diag-${Date.now()}`,
          patientId: `pat-${Date.now()}`,
          date: dateOfDiagnosis || CLINICAL_TODAY,
          category: 'Bone Marrow & Labs',
          title: `Diagnostic Baseline Established: ${diagnosis} (${stage})`,
          description: `Initial diagnosis confirmed on ${dateOfDiagnosis}. Stage: ${stage}. Protocol ${protocol} initiated. Comorbidity: ${majorComorbidity}.`,
          severity: 'Routine / Favorable',
          recordedBy: attendingOncologist,
        },
      ],
      appointments: [],
      colleagueNotes: [],
    };

    addPatient(newPatient);
    setIsNewPatientOpen(false);
    setSelectedPatientId(newPatient.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto text-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Enroll New Pediatric Oncology Patient</h2>
          </div>
          <button
            onClick={() => setIsNewPatientOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-900">
          {/* Section 1: Core Demographics & Age by DOB */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200">
              1. Patient Identification & Demographics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leo Montgomery"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 font-medium bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">National ID / Civil ID</label>
                <input
                  type="text"
                  placeholder="Leave empty or enter National ID"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-medium bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">MRN</label>
                <input
                  type="text"
                  placeholder="e.g. 61042 or 84920"
                  value={mrn}
                  onChange={(e) => setMrn(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-medium bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Date of Birth (DOB) *</span>
                  <span className="text-[10px] text-slate-500 font-mono">DD/MM/YYYY</span>
                </label>
                <ClinicalDateInput
                  required
                  value={dateOfBirth}
                  onChange={(d) => setDateOfBirth(d)}
                />
              </div>

              {/* Automatic Age Calculated From DOB */}
              <div>
                <label className="block font-semibold text-teal-900 mb-1 flex items-center justify-between">
                  <span>Calculated Age</span>
                  <span className="text-[10px] text-teal-600 font-normal">Auto from DOB</span>
                </label>
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-lg font-mono font-bold text-teal-950 flex items-center justify-between">
                  <span>{ageDisplayText}</span>
                  <span className="text-[11px] text-teal-700 font-normal">({ageYears} yrs)</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  <option className="text-slate-900 bg-white" value="Male">Male</option>
                  <option className="text-slate-900 bg-white" value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Diagnosis, Stage & Dates */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200">
              2. Diagnosis, Staging & Clinical Baseline
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Diagnosis
                </label>
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Oncological Stage *
                </label>
                <select
                  value={stage}
                  onChange={(e: any) => setStage(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900"
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Treatment Status
                </label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-900"
                >
                  <option className="text-slate-900 bg-white" value="On Treatment">Active On Treatment</option>
                  <option className="text-slate-900 bg-white" value="Under Follow up">Ended Treatment & Under Follow up</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Risk Stratification</label>
                <select
                  value={riskStratification}
                  onChange={(e: any) => setRiskStratification(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  <option className="text-slate-900 bg-white" value="Low Risk">Low Risk</option>
                  <option className="text-slate-900 bg-white" value="Standard Risk">Standard Risk</option>
                  <option className="text-slate-900 bg-white" value="Intermediate Risk">Intermediate Risk</option>
                  <option className="text-slate-900 bg-white" value="High Risk">High Risk</option>
                  <option className="text-slate-900 bg-white" value="Very High Risk">Very High Risk</option>
                  <option className="text-slate-900 bg-white" value="N/A">N/A</option>
                </select>
              </div>
            </div>



            {/* Comorbidity */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Comorbidity
              </label>
              <input
                type="text"
                placeholder="Leave empty or enter e.g. Down Syndrome, G6PD Deficiency, Solitary Kidney"
                value={majorComorbidity}
                onChange={(e) => setMajorComorbidity(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5 text-[11px]">
                <span className="text-slate-400">Quick suggestions:</span>
                {['Down Syndrome', 'G6PD Deficiency', 'Solitary Kidney', 'Bronchial Asthma', 'None'].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setMajorComorbidity(sug)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Protocol & Treatment Plan */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200">
              3. Protocol & Treatment Plan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Protocol Name</label>
                <input
                  type="text"
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  placeholder="Leave empty or enter e.g. COG AALL0932, EURAMOS-1, SIOP-RTSG"
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Venous access</label>
                <select
                  value={lineAccess}
                  onChange={(e: any) => setLineAccess(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  <option className="text-slate-900 bg-white" value="Port-a-cath">Port-a-cath</option>
                  <option className="text-slate-900 bg-white" value="Peripheral IV">Peripheral IV</option>
                  <option className="text-slate-900 bg-white" value="PICC">PICC</option>
                  <option className="text-slate-900 bg-white" value="Hickman">Hickman</option>
                </select>
              </div>


              {/* Protocol Document Upload / Roadmap Attachment (Multiple Files: PDF, JPG, DOCX, etc.) */}
              <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">
                        Attach Protocol
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
                    className="px-2.5 py-1.5 text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ Upload File(s)</span>
                  </button>
                </div>

                {protocolDocuments.length > 0 && (
                  <div className="space-y-1.5">
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
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
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
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded ml-2 cursor-pointer"
                            title="Remove document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Summary</label>
                <textarea
                  rows={2}
                  value={summaryProgress}
                  onChange={(e) => setSummaryProgress(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewPatientOpen(false)}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
            >
              Enroll Patient & Initialize Chart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
