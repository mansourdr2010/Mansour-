export type TreatmentStatus = 'On Treatment' | 'Under Follow up';

export type RiskStratification = 
  | 'Low Risk'
  | 'Standard Risk'
  | 'Intermediate Risk'
  | 'High Risk'
  | 'Very High Risk'
  | 'N/A';

export const STANDARD_PEDIATRIC_DIAGNOSES = [
  'Acute Lymphoblastic Leukemia (ALL)',
  'Acute Myeloid Leukemia (AML)',
  'Atypical Teratoid Rhabdoid Tumor (ATRT)',
  'Choroid Plexus Carcinoma (CPC)',
  'Choroid Plexus Papilloma (CPP)',
  'Chronic Myeloid Leukemia (CML)',
  'Clear Cell Sarcoma of the Kidney (CCSK)',
  'Craniopharyngioma (CPH)',
  'Embryonal Tumor with Multilayered Rosettes (ETMR)',
  'Ependymoma (Epnd)',
  'Ewing Sarcoma (ES)',
  'Germ Cell Tumor (GCT)',
  'Hemophagocytic Lymphohistiocytosis (HLH)',
  'High-Grade Glioma (HGG)',
  'Hodgkin Lymphoma (HL)',
  'Juvenile Myelomonocytic Leukemia (JMML)',
  'Langerhans Cell Histiocytosis (LCH)',
  'Low-Grade Glioma (LGG)',
  'Medulloblastoma (MB)',
  'Myelodysplastic Syndrome/Neoplasm (MDS)',
  'Neuroblastoma (NB)',
  'Neuroectodermal Tumor (NET)',
  'Non-Hodgkin Lymphoma (NHL)',
  'Non-LCH',
  'Non-Rhabdomyosarcoma Soft Tissue Sarcoma (NRSTS)',
  'Osteosarcoma (OS)',
  'Rhabdoid Tumor of the Kidney (RTK)',
  'Rhabdomyosarcoma (RMS)',
  'Thyroid Carcinoma',
  "Wilm's Tumor (WT)",
] as const;

export const STANDARD_CHEMOTHERAPY_DRUGS = [
  'ATRA',
  'Carboplatin',
  'Cisplatin',
  'Cyclophosphamide',
  'Cytarabine',
  'Dactinomycin',
  'Dexamethasone',
  'Doxorubicin',
  'Erwinia-Asparaginase',
  'Etoposide',
  'Ifosfamide',
  'Intrathecal (IT)',
  'Mercaptopurine (6-MP)',
  'Methotrexate (HD)',
  'Methotrexate (IV)',
  'Methotrexate (Oral)',
  'PEG-Asparaginase',
  'Prednisone',
  'Ruxolitinib',
  'Vincristine',
] as const;

export type StandardChemotherapyDrug = (typeof STANDARD_CHEMOTHERAPY_DRUGS)[number];

export type StandardPediatricDiagnosis = (typeof STANDARD_PEDIATRIC_DIAGNOSES)[number];

export type PediatricDiagnosis =
  | StandardPediatricDiagnosis
  | "Wilms' Tumor (WT)"
  | "Wilm's Tumor (WT)"
  | 'Wilms Tumor (WT)'
  | 'Wilms Tumor'
  | 'Wilms Tumor (Nephroblastoma)'
  | 'Nephroblastoma'
  | 'B-Cell Acute Lymphoblastic Leukemia (B-ALL)'
  | 'T-Cell Acute Lymphoblastic Leukemia (T-ALL)'
  | 'Neuroblastoma'
  | 'High-Risk Neuroblastoma'
  | 'Medulloblastoma'
  | 'Medulloblastoma (CNS)'
  | 'Burkitt Lymphoma'
  | 'Retinoblastoma'
  | 'Hepatoblastoma'
  | (string & {});

export type ChemotherapyStatus = 'Scheduled' | 'Administered' | 'Delayed' | 'Missed' | 'Rescheduled';

export interface ChemotherapyDrug {
  name: string;
  dose?: string;
  route?: 'IV Infusion' | 'IV Push' | 'Intrathecal (IT)' | 'Oral' | 'Subcutaneous' | 'Intramuscular' | string;
}

export type ScheduleTrackingType = 'Cycle' | 'Week' | 'Phase';

export interface ChemotherapyAppointment {
  id: string;
  patientId: string;
  patientName?: string;
  mrn?: string;
  diagnosis?: PediatricDiagnosis;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // Optional (no need to enter time)
  regimenName: string; // e.g., "Consolidation - High Dose Methotrexate"
  drugs: ChemotherapyDrug[];
  cycleNumber: number;
  totalCyclesPlanned?: number;
  dayInCycle: number;
  scheduleType?: ScheduleTrackingType;
  phaseName?: string; // e.g. "Induction", "Consolidation", "Interim Maintenance 1", "Interim Maintenance 2", "Delayed Intensification 1", "Delayed Intensification 2", "Maintenance Cycles"
  weekNumber?: number; // e.g. 1, 4, 12...
  remarks: string; // Special clinical remarks & precautions
  status: ChemotherapyStatus;
  administeredAt?: string;
  administeredBy?: string;
  delayReason?: string;
  missedReason?: string;
  isUrgent?: boolean;
  doseType?: 'Full Dose' | 'With Reduction';
  reductionPercentage?: string; // e.g. "25% Reduction", "50% Reduction"
  reductionReason?: string; // e.g. "Grade 4 neutropenia", "Ototoxicity", etc.
}

export type EventCategory = 
  | 'Infection'
  | 'Toxicity'
  | 'Labs'
  | 'Surgery/access'
  | 'Imaging/response'
  | 'Evaluation milestone'
  | 'Toxicity & Infection'
  | 'Surgical & Access'
  | 'Bone Marrow & Labs'
  | 'Dose Modification / Delay'
  | 'Milestone & Remission'
  | string;

export interface MajorClinicalEvent {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  category: EventCategory;
  title: string;
  description: string;
  severity?: 'Mild' | 'Moderate' | 'Severe / Grade 3-4' | 'Life-threatening' | 'Routine / Favorable';
  recordedBy?: string;
  imageUrl?: string; // Data URL or Image URL
  imageName?: string; // Original uploaded file name
}

export interface ColleagueNote {
  id: string;
  patientId: string;
  timestamp: string; // ISO or readable
  author: string;
  role: string;
  tag: 'General' | 'Lab Warning' | 'Medication' | 'Caregiver Communication' | 'Handoff';
  text: string;
}

export type PediatricStage =
  | 'Stage I'
  | 'Stage II'
  | 'Stage III'
  | 'Stage IV'
  | 'Non-metastatic'
  | 'Metastatic'
  | 'CNS-1'
  | 'CNS-2'
  | 'CNS-3'
  | 'N/A';

export type FollowUpStatus =
  | 'Regular Follow-up'
  | 'Lost to Follow-up'
  | 'Lost Follow-up'
  | 'Scheduled for Discharge'
  | 'Discharged'
  | 'Palliative'
  | 'Died';

export const VENOUS_ACCESS_OPTIONS = [
  'Port-a-cath',
  'Peripheral IV',
  'PICC',
  'Hickman',
] as const;

export type VenousAccessType = (typeof VENOUS_ACCESS_OPTIONS)[number];

export interface Patient {
  id: string;
  mrn: string; // Hospital MRN (any free format e.g. 61042)
  nationalId: string; // National ID / Hospital Patient ID
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  ageYears: number;
  gender: 'Male' | 'Female';
  weightKg?: number;
  heightCm?: number;
  bsaM2?: number;
  diagnosis: PediatricDiagnosis;
  stage: PediatricStage; // Stage I, II, III, IV, CNS-1, CNS-2, CNS-3
  dateOfDiagnosis: string; // YYYY-MM-DD
  lastChemoReceived: string; // Last chemotherapy regimen administered
  lastChemoDate: string; // Date of last chemotherapy received
  majorComorbidity: string; // e.g. "None", "Down Syndrome", "G6PD Deficiency", "Cardiac", etc.
  status: TreatmentStatus;
  // Off-Therapy Follow-up Fields
  followUpStartDate?: string; // End of therapy date
  lastVisitDate?: string; // Date of last visit
  nextVisitDate?: string; // Date of next scheduled surveillance visit
  followUpStatus?: FollowUpStatus; // regular follow up vs lost follow up vs scheduled for discharge vs palliative vs died
  riskStratification: RiskStratification;
  protocol: string; // e.g. "COG AALL0932", "COG ANBL0032"
  treatmentStageOrPhase?: string; // Flexible protocol-specific progress: e.g. "Phase: Consolidation (Week 4)", "Week 24 of 104", "Cycle 3 of 6"
  protocolDocuments?: ProtocolDocument[]; // Multiple uploaded protocol files (PDF, JPG, DOCX, etc.)
  protocolDocumentUrl?: string; // Backwards compatible single URL
  protocolDocumentName?: string; // File name e.g. "COG_AALL0932_Roadmap.pdf"
  protocolDocumentType?: 'pdf' | 'image' | 'docx' | 'doc' | 'link' | 'standard' | 'other';
  protocolDocumentUploadedAt?: string;
  protocolDocumentSize?: string;
  currentCycle?: number;
  totalPlannedCycles?: number;
  treatmentStartDate: string; // YYYY-MM-DD
  estimatedCompletionDate: string; // YYYY-MM-DD
  attendingOncologist: string;
  fellowOrColleague: string;
  summaryProgress: string; // Clinical summary
  lineAccess: VenousAccessType | string;
  allergies: string[];
  events: MajorClinicalEvent[];
  appointments: ChemotherapyAppointment[];
  colleagueNotes: ColleagueNote[];
}

export interface ProtocolDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'docx' | 'doc' | 'other';
  url: string; // Data URL or Web link
  size?: string;
  uploadedAt: string;
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
  label?: string;
}

export type UserRole = 'admin' | 'physician';
export type UserApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserApprovalStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}
