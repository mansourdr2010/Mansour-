import React, { useState, useRef } from 'react';
import { Patient, ProtocolDocument } from '../types/oncology';
import { useOncology } from '../context/OncologyContext';
import {
  X,
  FileText,
  Upload,
  Download,
  Trash2,
  ShieldAlert,
  Info,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  BookOpen,
} from 'lucide-react';
import { PEDIATRIC_STANDARD_PROTOCOLS } from '../utils/protocolRoadmaps';

interface ProtocolViewerModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

export const ProtocolViewerModal: React.FC<ProtocolViewerModalProps> = ({
  patient,
  isOpen,
  onClose,
}) => {
  const { updatePatient } = useOncology();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeDocIndex, setActiveDocIndex] = useState<number>(0);
  const [activeView, setActiveView] = useState<'document' | 'standard'>('document');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const standardProtocol =
    PEDIATRIC_STANDARD_PROTOCOLS[patient.diagnosis] ||
    PEDIATRIC_STANDARD_PROTOCOLS['B-Cell Acute Lymphoblastic Leukemia (B-ALL)'];

  // Normalize all documents
  const allDocs: ProtocolDocument[] =
    patient.protocolDocuments && patient.protocolDocuments.length > 0
      ? patient.protocolDocuments
      : patient.protocolDocumentUrl
      ? [
          {
            id: 'doc-legacy',
            name: patient.protocolDocumentName || 'Protocol Roadmap Document',
            type: (patient.protocolDocumentType as any) || 'pdf',
            url: patient.protocolDocumentUrl,
            size: patient.protocolDocumentSize || 'Standard',
            uploadedAt: patient.protocolDocumentUploadedAt || 'Attached',
          },
        ]
      : [];

  const hasDocs = allDocs.length > 0;
  const currentDocIndex = Math.min(activeDocIndex, Math.max(0, allDocs.length - 1));
  const currentDoc = allDocs[currentDocIndex];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    const newDocsToAdd: ProtocolDocument[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let docType: ProtocolDocument['type'] = 'other';
      if (file.type === 'application/pdf' || ext === 'pdf') docType = 'pdf';
      else if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext))
        docType = 'image';
      else if (ext === 'docx') docType = 'docx';
      else if (ext === 'doc') docType = 'doc';

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const sizeKb = Math.round(file.size / 1024);
        const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

        newDocsToAdd.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: docType,
          url: result,
          size: sizeStr,
          uploadedAt: new Date().toISOString().split('T')[0],
        });

        processedCount++;
        if (processedCount === files.length) {
          const updatedList = [...allDocs, ...newDocsToAdd];
          const updatedPatient: Patient = {
            ...patient,
            protocolDocuments: updatedList,
            protocolDocumentUrl: updatedList[0]?.url,
            protocolDocumentName: updatedList[0]?.name,
            protocolDocumentType: updatedList[0]?.type,
            protocolDocumentUploadedAt: updatedList[0]?.uploadedAt,
            protocolDocumentSize: updatedList[0]?.size,
          };
          updatePatient(updatedPatient);
          setIsUploading(false);
          setActiveView('document');
          setActiveDocIndex(updatedList.length - 1);
        }
      };

      reader.onerror = () => {
        processedCount++;
        if (processedCount === files.length) {
          setIsUploading(false);
        }
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveCurrentDocument = (docId: string) => {
    if (window.confirm('Are you sure you want to remove this attached protocol document?')) {
      const remaining = allDocs.filter((d) => d.id !== docId);
      const updatedPatient: Patient = {
        ...patient,
        protocolDocuments: remaining,
        protocolDocumentUrl: remaining[0]?.url,
        protocolDocumentName: remaining[0]?.name,
        protocolDocumentType: remaining[0]?.type,
        protocolDocumentUploadedAt: remaining[0]?.uploadedAt,
        protocolDocumentSize: remaining[0]?.size,
      };
      updatePatient(updatedPatient);
      if (remaining.length === 0) {
        setActiveView('standard');
      } else {
        setActiveDocIndex((idx) => Math.max(0, idx - 1));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-full flex flex-col overflow-hidden my-auto transition-all ${
          isFullScreen ? 'fixed inset-2 z-50 max-w-none max-h-none h-[calc(100vh-16px)]' : 'max-w-5xl max-h-[92vh] h-[86vh]'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Protocol Roadmap & Treatment Documentation</h2>
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold">
                  {patient.mrn}
                </span>
                <span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded font-medium">
                  {patient.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Protocol: <strong className="text-slate-800">{patient.protocol || standardProtocol.protocolName}</strong>
                {patient.treatmentStageOrPhase && (
                  <span className="ml-2 text-teal-700 font-semibold font-mono">
                    • Current: {patient.treatmentStageOrPhase}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher if documents are present */}
            {hasDocs && (
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs mr-2">
                <button
                  onClick={() => setActiveView('document')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    activeView === 'document' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Attached Files ({allDocs.length})
                </button>
                <button
                  onClick={() => setActiveView('standard')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    activeView === 'standard' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Clinical Schema
                </button>
              </div>
            )}

            {/* Upload/Add More Files Button */}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-2.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              title="Upload PDF, Image, or DOCX documentation"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{hasDocs ? '+ Add Protocol File(s)' : 'Upload Protocol Files'}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
              title={isFullScreen ? 'Exit full screen' : 'Full screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-slate-100 flex flex-col p-4">
          {/* VIEW A: UPLOADED DOCUMENTS */}
          {hasDocs && activeView === 'document' && currentDoc ? (
            <div className="flex flex-col h-full bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              {/* Document Switcher Toolbar if multiple files */}
              {allDocs.length > 1 && (
                <div className="p-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs">
                  <span className="font-bold text-slate-500 shrink-0 mr-1">Switch File:</span>
                  {allDocs.map((doc, idx) => {
                    const isSelected = idx === currentDocIndex;
                    const badgeColor =
                      doc.type === 'pdf'
                        ? 'text-rose-700'
                        : doc.type === 'image'
                        ? 'text-purple-700'
                        : doc.type === 'docx' || doc.type === 'doc'
                        ? 'text-blue-700'
                        : 'text-slate-700';

                    return (
                      <button
                        key={doc.id || idx}
                        type="button"
                        onClick={() => {
                          setActiveDocIndex(idx);
                          setZoomLevel(100);
                        }}
                        className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-[10px] font-mono uppercase px-1 py-0.2 rounded font-bold ${
                          isSelected ? 'bg-white/20 text-white' : `bg-slate-100 ${badgeColor}`
                        }`}>
                          {doc.type}
                        </span>
                        <span className="truncate max-w-[170px]">{doc.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Subheader / Toolbar for Current Document */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] border ${
                    currentDoc.type === 'pdf'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : currentDoc.type === 'image'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : currentDoc.type === 'docx' || currentDoc.type === 'doc'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    {currentDoc.type}
                  </span>
                  <span className="font-bold text-slate-800">{currentDoc.name}</span>
                  {currentDoc.size && (
                    <span className="text-slate-400 text-[11px]">({currentDoc.size})</span>
                  )}
                  {currentDoc.uploadedAt && (
                    <span className="text-slate-400 text-[11px] font-mono">
                      • Uploaded {currentDoc.uploadedAt}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {currentDoc.type === 'image' && (
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                        className="p-1 hover:text-teal-700"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono px-1 font-semibold">{zoomLevel}%</span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
                        className="p-1 hover:text-teal-700"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <a
                    href={currentDoc.url}
                    download={currentDoc.name || 'protocol_file'}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    Download File
                  </a>

                  <button
                    onClick={() => handleRemoveCurrentDocument(currentDoc.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                    title="Remove this document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Document Rendering */}
              <div className="flex-1 overflow-auto bg-slate-900/5 p-4 flex items-center justify-center min-h-[450px]">
                {currentDoc.type === 'pdf' ? (
                  <iframe
                    src={currentDoc.url}
                    title={currentDoc.name || 'Protocol Document'}
                    className="w-full h-full min-h-[550px] rounded-lg border border-slate-300 bg-white"
                  />
                ) : currentDoc.type === 'image' ? (
                  <div className="overflow-auto max-h-full max-w-full flex justify-center items-center">
                    <img
                      src={currentDoc.url}
                      alt={currentDoc.name || 'Protocol Roadmap'}
                      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                      className="max-w-full h-auto rounded-lg shadow-md transition-transform duration-150"
                    />
                  </div>
                ) : (
                  /* Word / DOCX / Other Format Preview Card */
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center max-w-md w-full space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900">
                        Microsoft Word / Document
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-2 truncate">
                        {currentDoc.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Size: {currentDoc.size || 'Standard'} • Uploaded {currentDoc.uploadedAt}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      This protocol document is stored with the patient clinical record. Download to open in Microsoft Word, LibreOffice, or Google Docs.
                    </p>
                    <a
                      href={currentDoc.url}
                      download={currentDoc.name}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download {currentDoc.name}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VIEW B: CLINICAL PROTOCOL ROADMAP SCHEMA + UPLOAD PROMPT */
            <div className="space-y-4 max-w-4xl mx-auto w-full">
              {/* If no document uploaded, prompt to upload */}
              {!hasDocs && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 sm:p-5 bg-teal-50/70 border-2 border-dashed border-teal-300 rounded-2xl text-center cursor-pointer hover:bg-teal-50 transition-colors group"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Upload Patient Protocol Files (PDF, JPG, DOCX)</h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                    Attach hospital study roadmaps, COG flowsheets, or chemotherapy protocols in multiple formats. Supported: PDF, JPG, PNG, DOCX, DOC.
                  </p>
                  <span className="mt-3 inline-block px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs">
                    Choose Protocol Files
                  </span>
                </div>
              )}

              {/* Standard Pediatric Protocol Roadmap Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        {standardProtocol.treatmentType} Protocol
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Total Expected Duration: {standardProtocol.totalDuration}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{standardProtocol.protocolName}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{standardProtocol.description}</p>
                  </div>
                </div>

                {/* Treatment Phases / Weeks Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    Protocol Phases & Chemotherapy Blocks
                  </h4>

                  <div className="space-y-3">
                    {standardProtocol.phases.map((phase, idx) => {
                      const isCurrentPhase = patient.treatmentStageOrPhase
                        ? patient.treatmentStageOrPhase.toLowerCase().includes(phase.phaseName.toLowerCase().split(' ')[0])
                        : idx === 0;

                      return (
                        <div
                          key={phase.phaseName}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isCurrentPhase
                              ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-200'
                              : 'bg-slate-50/70 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isCurrentPhase ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">{phase.phaseName}</span>
                              {isCurrentPhase && (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-600 text-white rounded-full">
                                  Current Stage
                                </span>
                              )}
                            </div>
                            {phase.durationWeeks && (
                              <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                ~{phase.durationWeeks} weeks
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 mt-1.5 ml-8">{phase.description}</p>

                          <div className="mt-2.5 ml-8 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                            <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                              <span className="font-semibold text-slate-700 block mb-1">Key Chemotherapy Agents:</span>
                              <div className="flex flex-wrap gap-1">
                                {phase.keyDrugs.map((drug) => (
                                  <span
                                    key={drug}
                                    className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-medium text-[11px]"
                                  >
                                    {drug}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                              <span className="font-semibold text-slate-700 block mb-1">Surveillance Milestones:</span>
                              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                                {phase.monitoringPoints.map((pt) => (
                                  <li key={pt}>{pt}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dose Modification Guidelines */}
                <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-xs">
                  <h4 className="font-bold text-amber-950 flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    Protocol Dose Modification & Toxicity Hold Rules
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-amber-900">
                    {standardProtocol.doseModificationGuidelines.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>

                {/* Emergency Precautions */}
                <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-xs">
                  <h4 className="font-bold text-rose-950 flex items-center gap-1.5 mb-1.5">
                    <Info className="w-4 h-4 text-rose-700" />
                    Critical Emergency Precautions & Prophylaxis
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-rose-900">
                    {standardProtocol.emergencyPrecautions.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs px-5">
          <span className="text-slate-500">
            {hasDocs ? `Viewing: ${currentDoc?.name || 'Protocol File'}` : 'Viewing Standard Clinical Roadmap'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
