export interface ProtocolPhaseMilestone {
  phaseName: string;
  durationWeeks?: number;
  description: string;
  keyDrugs: string[];
  monitoringPoints: string[];
}

export interface StandardProtocolRoadmap {
  id: string;
  diagnosis: string;
  protocolName: string;
  shortName: string;
  treatmentType: 'Phases' | 'Weeks' | 'Cycles' | 'Combined';
  totalDuration: string;
  description: string;
  phases: ProtocolPhaseMilestone[];
  doseModificationGuidelines: string[];
  emergencyPrecautions: string[];
}

export const PEDIATRIC_STANDARD_PROTOCOLS: Record<string, StandardProtocolRoadmap> = {
  'B-Cell Acute Lymphoblastic Leukemia (B-ALL)': {
    id: 'cog-aall0932',
    diagnosis: 'B-Cell Acute Lymphoblastic Leukemia (B-ALL)',
    protocolName: 'COG AALL0932 Standard Risk B-ALL Protocol',
    shortName: 'COG AALL0932',
    treatmentType: 'Phases',
    totalDuration: '2 - 3 Years (Girls 2 yrs, Boys 3 yrs)',
    description: 'Gold-standard risk-directed pediatric B-ALL regimen emphasizing bone marrow remission, central nervous system (CNS) prophylaxis, and prolonged maintenance with oral antimetabolites.',
    phases: [
      {
        phaseName: 'Induction Phase (Days 1–29)',
        durationWeeks: 4,
        description: 'Achieve complete morphologic remission and minimal residual disease (MRD) negativity (<0.01%) by Day 29.',
        keyDrugs: ['Vincristine (weekly IV)', 'Dexamethasone (daily oral/IV)', 'PEG-Asparaginase (Day 4/5)', 'Intrathecal (IT) Methotrexate (Day 1, 8, 29)'],
        monitoringPoints: ['Day 8/15 Peripheral blast clearance', 'Day 29 Bone Marrow Aspirate & Flow Cytometry MRD', 'Blood glucose & fungal surveillance']
      },
      {
        phaseName: 'Consolidation Phase',
        durationWeeks: 4,
        description: 'Eradicate submicroscopic leukemic clones and provide continuous CNS sanctuary coverage.',
        keyDrugs: ['Mercaptopurine 6-MP (oral daily)', 'Intrathecal Methotrexate (IT Day 1, 8, 15)', 'Vincristine (Day 1)'],
        monitoringPoints: ['Weekly CBC/diff (ANC > 750, Platelets > 75k)', 'ALT/AST & Total Bilirubin monitoring']
      },
      {
        phaseName: 'Interim Maintenance 1 (IM-1)',
        durationWeeks: 8,
        description: 'Capizzi escalating IV Methotrexate without leucovorin rescue or High-Dose MTX with leucovorin rescue.',
        keyDrugs: ['Escalating IV Methotrexate', 'Vincristine (every 10-14 days)', 'PEG-Asparaginase'],
        monitoringPoints: ['Methotrexate clearance kinetics', 'Oral mucositis grading', 'Renal function tests & urine hydration']
      },
      {
        phaseName: 'Delayed Intensification (DI)',
        durationWeeks: 8,
        description: 'Re-induction and re-consolidation block to prevent early medullary and extramedullary relapses.',
        keyDrugs: ['Dexamethasone', 'Vincristine', 'Doxorubicin', 'PEG-Asparaginase', 'Cyclophosphamide', 'Thioguanine', 'IT Methotrexate'],
        monitoringPoints: ['Profound neutropenia monitoring (PCP prophylaxis mandatory)', 'Cardiotoxicity surveillance', 'Infection surveillance']
      },
      {
        phaseName: 'Interim Maintenance 2 (IM-2)',
        durationWeeks: 8,
        description: 'Pre-maintenance consolidation transition.',
        keyDrugs: ['Escalating Methotrexate', 'Vincristine', 'IT Methotrexate'],
        monitoringPoints: ['Tolerability of IV MTX escalation']
      },
      {
        phaseName: 'Maintenance Therapy (Cycles 1–12+ / Weeks 32–104+)',
        durationWeeks: 84,
        description: 'Prolonged outpatient oral maintenance to suppress dormant leukemic stem cells until immune surveillance matures.',
        keyDrugs: ['Daily Oral Mercaptopurine (6-MP 75 mg/m²)', 'Weekly Oral Methotrexate (20 mg/m²)', 'Monthly Vincristine + 5-day Dexamethasone pulses', 'IT Methotrexate every 12 weeks'],
        monitoringPoints: ['Target ANC 750–1,500/mcL; adjust 6-MP/MTX doses accordingly', 'TPMT / NUDT15 genotype verification']
      }
    ],
    doseModificationGuidelines: [
      'ANC < 500/mcL or Platelets < 50,000/mcL: Hold oral 6-MP and MTX during maintenance until hematologic recovery, then resume at 100% or 75%.',
      'Direct Bilirubin > 3.0 mg/dL: Hold Vincristine and reduce Methotrexate dose by 50%.',
      'Pancreatitis Grade 3-4 (Amylase/Lipase > 3x ULN): Discontinue PEG-Asparaginase permanently.',
      'Symptomatic VTE (Deep Vein Thrombosis / Sinus Thrombosis): Anticoagulate with Enoxaparin (LMWH); continue chemotherapy if clinically stable.'
    ],
    emergencyPrecautions: [
      'Febrile Neutropenia (Temp ≥ 38.3°C or ≥ 38.0°C x 2h with ANC < 500): Immediate IV Cefepime/Meropenem within 60 minutes.',
      'PCP Prophylaxis: TMP-SMX (Bactrim) 5 mg/kg/day trimethoprim component divided BID on 2 or 3 consecutive days/week throughout all phases.'
    ]
  },

  'T-Cell Acute Lymphoblastic Leukemia (T-ALL)': {
    id: 'cog-aall1231',
    diagnosis: 'T-Cell Acute Lymphoblastic Leukemia (T-ALL)',
    protocolName: 'COG AALL1231 Intensive T-ALL Protocol',
    shortName: 'COG AALL1231',
    treatmentType: 'Phases',
    totalDuration: '2.5 - 3 Years',
    description: 'Intensified multi-agent pediatric T-ALL roadmap with augmented systemic and intrathecal therapy, Dex pulses, and High-Dose Methotrexate.',
    phases: [
      {
        phaseName: 'Induction Phase (4-Drug)',
        durationWeeks: 4,
        description: '4-drug induction including Daunorubicin, Vincristine, Dexamethasone, and PEG-Asparaginase.',
        keyDrugs: ['Daunorubicin IV', 'Vincristine IV', 'Dexamethasone oral/IV', 'PEG-Asparaginase IV/IM', 'IT Methotrexate + Hydrocortisone + Cytarabine (Triple IT)'],
        monitoringPoints: ['Day 29 BMA & Flow MRD', 'Cardiovascular monitoring (Echocardiogram baseline)']
      },
      {
        phaseName: 'Consolidation Phase',
        durationWeeks: 4,
        description: 'Augmented systemic consolidation and CNS sterilization.',
        keyDrugs: ['Cyclophosphamide', 'Cytarabine (Ara-C)', 'Mercaptopurine', 'Triple IT chemotherapy'],
        monitoringPoints: ['Complete blood counts', 'Urinalysis for hemorrhagic cystitis (Mesna co-administration)']
      },
      {
        phaseName: 'Interim Maintenance (High-Dose MTX 5 g/m²)',
        durationWeeks: 9,
        description: 'High-dose Methotrexate infusions with vigorous hydration and leucovorin rescue.',
        keyDrugs: ['HD-MTX (5,000 mg/m² over 24h)', 'Leucovorin rescue', 'Triple IT'],
        monitoringPoints: ['Serum MTX levels at 24h, 42h, 48h until < 0.1 µM', 'Urine pH > 7.0']
      },
      {
        phaseName: 'Delayed Intensification',
        durationWeeks: 8,
        description: 'Intense chemotherapy consolidation block.',
        keyDrugs: ['Vincristine', 'Dexamethasone', 'Doxorubicin', 'PEG-Asparaginase', 'Cyclophosphamide', 'Cytarabine'],
        monitoringPoints: ['Infection & neutropenia alerts']
      },
      {
        phaseName: 'Maintenance Phase',
        durationWeeks: 100,
        description: 'Extended oral maintenance with scheduled IT and steroid pulses.',
        keyDrugs: ['Daily 6-MP', 'Weekly MTX', 'VCR/Dex pulses every 4 weeks', 'Triple IT every 8-12 weeks'],
        monitoringPoints: ['ANC goal 750–1,500/mcL']
      }
    ],
    doseModificationGuidelines: [
      'Serum MTX 48h > 1.0 µM: Increase Leucovorin dose and hydration according to clearance nomogram.',
      'Neuropathy Grade 3: Hold or decrease Vincristine.'
    ],
    emergencyPrecautions: [
      'Tumor Lysis Syndrome prophylaxis with Rasburicase and hyperhydration prior to first cytotoxic dose.'
    ]
  },

  'Neuroblastoma': {
    id: 'cog-anbl0032',
    diagnosis: 'Neuroblastoma',
    protocolName: 'COG ANBL0032 Multimodality Neuroblastoma Roadmap',
    shortName: 'COG ANBL0032',
    treatmentType: 'Cycles',
    totalDuration: '18 Months',
    description: 'Triple-pillar strategy: (1) Intensive induction chemotherapy with stem cell collection; (2) Consolidation high-dose chemotherapy with autologous stem cell rescue; (3) Post-consolidation anti-GD2 immunotherapy.',
    phases: [
      {
        phaseName: 'Induction Cycles 1 & 2 (CAV)',
        durationWeeks: 6,
        description: 'Cyclophosphamide, Doxorubicin (Adriamycin), and Vincristine.',
        keyDrugs: ['Cyclophosphamide (IV 2,100 mg/m²)', 'Doxorubicin (IV 45 mg/m²)', 'Vincristine (IV 2 mg/m²)', 'Mesna uroprotection'],
        monitoringPoints: ['Urinalysis for hematuria', 'Peripheral blood stem cell (PBSC) mobilization & harvest after Cycle 2']
      },
      {
        phaseName: 'Induction Cycles 3 & 5 (HD-Cisplatin + Etoposide)',
        durationWeeks: 6,
        description: 'High-dose platinum alkylating agent combination.',
        keyDrugs: ['Cisplatin (IV 50 mg/m²/day x 4 days)', 'Etoposide (IV 200 mg/m²/day x 3 days)'],
        monitoringPoints: ['Audiogram (ototoxicity monitoring)', 'Glomerular filtration rate (GFR/CrCl) before each platinum cycle']
      },
      {
        phaseName: 'Induction Cycles 4 & 6 (High-Dose CAV & Primary Surgery)',
        durationWeeks: 6,
        description: 'Tumor downsizing followed by complete gross surgical resection of primary tumor.',
        keyDrugs: ['Cyclophosphamide, Doxorubicin, Vincristine', 'Definitive Surgical Resection'],
        monitoringPoints: ['Post-operative CT/MRI abdomen/chest', 'MIBG scan / FDG-PET response evaluation']
      },
      {
        phaseName: 'Consolidation (High-Dose Chemotherapy & Autologous SCT)',
        durationWeeks: 8,
        description: 'Myeloablative conditioning followed by autologous peripheral stem cell infusion.',
        keyDrugs: ['Carboplatin + Etoposide + Melphalan (CEM) conditioning', 'Autologous PBSC reinfusion'],
        monitoringPoints: ['Engraftment kinetics (ANC > 500, Platelets > 20k)', 'Veno-occlusive disease (VOD/SOS) screening']
      },
      {
        phaseName: 'Radiation Therapy',
        durationWeeks: 4,
        description: 'External beam radiotherapy (21.6 Gy) to the primary tumor bed and persistent MIBG-avid skeletal metastases.',
        keyDrugs: ['Fractionated Radiotherapy (Primary bed 21.6 Gy)'],
        monitoringPoints: ['Radiation dermatopathy', 'Normal tissue sparing']
      },
      {
        phaseName: 'Post-Consolidation Immunotherapy (Cycles 1–6)',
        durationWeeks: 24,
        description: 'Dinutuximab anti-GD2 monoclonal antibody + GM-CSF / IL-2 + Isotretinoin (13-cis-retinoic acid).',
        keyDrugs: ['Dinutuximab (Unituxin anti-GD2)', 'Sargramostim (GM-CSF)', 'Isotretinoin (oral 14 days on / 14 days off)'],
        monitoringPoints: ['Neuropathic pain management (continuous IV opioid infusion during Dinutuximab)', 'Capillary leak syndrome and hypersensitivity']
      }
    ],
    doseModificationGuidelines: [
      'Grade 3 Ototoxicity (Brock scale): Substitute Carboplatin for Cisplatin or reduce Cisplatin dose by 25%.',
      'GFR < 60 mL/min/1.73m²: Dose reduce platinum and etoposide.'
    ],
    emergencyPrecautions: [
      'Dinutuximab requires prophylactic antihistamine, acetaminophen, and continuous morphine infusion to control neuropathic allodynia.'
    ]
  },

  'Wilms Tumor': {
    id: 'siop-cog-wilms',
    diagnosis: "Wilm's Tumor (WT)",
    protocolName: "COG AREN0532 / SIOP-RTSG Wilm's Tumor Protocol",
    shortName: 'AREN0532 / SIOP-RTSG',
    treatmentType: 'Weeks',
    totalDuration: '19 - 25 Weeks',
    description: "Risk-stratified Wilm's Tumor (WT) roadmap balancing curative surgical excision with Vincristine, Dactinomycin (Actinomycin D), and Doxorubicin.",
    phases: [
      {
        phaseName: 'Phase 1: Pre-Op Chemo or Initial Radical Nephrectomy',
        durationWeeks: 4,
        description: 'Complete oncologic radical nephrectomy with lymph node sampling or pre-op neoadjuvant chemo (SIOP approach).',
        keyDrugs: ['Vincristine (1.5 mg/m² weekly)', 'Dactinomycin (0.045 mg/kg IV)'],
        monitoringPoints: ['Histologic subtype (Favorable vs Unfavorable Diffuse Anaplasia)', 'Loss of Heterozygosity (LOH 1p/16q)']
      },
      {
        phaseName: 'Phase 2: Post-Op Adjuvant Regimen EE-4A (Weeks 1–19)',
        durationWeeks: 19,
        description: 'Stage I/II favorable histology outpatient chemotherapy.',
        keyDrugs: ['Vincristine (Weeks 1–10 weekly, then pulses every 3 weeks)', 'Dactinomycin (Weeks 0, 3, 6, 9, 12, 15, 18)'],
        monitoringPoints: ['Weekly blood counts', 'Hepatotoxicity (Hepatic Veno-occlusive Disease/VOD associated with Dactinomycin)']
      },
      {
        phaseName: 'Phase 3 (Stage III / Anaplastic): Regimen DD-4A with Doxorubicin',
        durationWeeks: 25,
        description: 'Three-drug chemotherapy plus flank / abdominal radiotherapy.',
        keyDrugs: ['Vincristine', 'Dactinomycin', 'Doxorubicin (Adriamycin 45 mg/m²)', 'Abdominal Radiotherapy (10.8 Gy)'],
        monitoringPoints: ['Echocardiogram cumulative anthracycline cardiotoxicity monitoring', 'Renal function of solitary remaining kidney']
      }
    ],
    doseModificationGuidelines: [
      'Weight < 12 kg: Dose calculated strictly per kilogram body weight (NOT BSA) to avoid lethal overdosage.',
      'Unexplained weight gain or hepatomegaly: Hold Dactinomycin, rule out hepatopathy/VOD.'
    ],
    emergencyPrecautions: [
      'Extreme caution handling solitary kidney: Avoid nephrotoxic NSAIDs and aminoglycosides where possible.'
    ]
  },

  'Osteosarcoma': {
    id: 'euramos-1-map',
    diagnosis: 'Osteosarcoma',
    protocolName: 'EURAMOS-1 MAP Chemotherapy Roadmap',
    shortName: 'EURAMOS-1 MAP',
    treatmentType: 'Weeks',
    totalDuration: '29 - 35 Weeks',
    description: 'Gold-standard high-grade pediatric osteosarcoma protocol utilizing High-Dose Methotrexate, Doxorubicin, and Cisplatin with limb-salvage surgery at Week 10.',
    phases: [
      {
        phaseName: 'Pre-Operative Chemotherapy (Weeks 1–10)',
        durationWeeks: 10,
        description: 'Pre-operative MAP induction to facilitate limb-salvage resection.',
        keyDrugs: ['High-Dose Methotrexate (12 g/m² with Leucovorin rescue)', 'Doxorubicin (Adriamycin 75 mg/m²)', 'Cisplatin (100 mg/m² with hyperhydration)'],
        monitoringPoints: ['Methotrexate clearance to < 0.1 µM', 'Audiology baseline & repeat before each cisplatin cycle']
      },
      {
        phaseName: 'Definitive Limb-Salvage / Reconstruction Surgery (Week 10–12)',
        durationWeeks: 2,
        description: 'En bloc wide local resection with endoprosthetic reconstruction or rotationplasty.',
        keyDrugs: ['Surgical Resection', 'Pathologic Necrosis Assessment (Salzer-Kuntschik / Huvos Grade)'],
        monitoringPoints: ['Histologic tumor necrosis percentage: ≥90% = Good Responder; <90% = Poor Responder']
      },
      {
        phaseName: 'Post-Operative Chemotherapy (Weeks 12–29)',
        durationWeeks: 18,
        description: 'Completion of 6 cycles of MAP (Good Responders) or intensified post-op therapy.',
        keyDrugs: ['High-Dose Methotrexate', 'Doxorubicin', 'Cisplatin', 'Mesna & Leucovorin'],
        monitoringPoints: ['Cumulative Doxorubicin dose (limit to 375-450 mg/m²)', 'Renal tubular function']
      }
    ],
    doseModificationGuidelines: [
      'Creatinine clearance < 70 mL/min: Hold Methotrexate and Cisplatin.',
      'Ejection fraction < 50% or SF < 28%: Discontinue Doxorubicin.'
    ],
    emergencyPrecautions: [
      'Methotrexate urine alkalinization (urine pH must be ≥ 7.5 before and during infusion).'
    ]
  },

  'Ewing Sarcoma': {
    id: 'cog-aews1031',
    diagnosis: 'Ewing Sarcoma',
    protocolName: 'COG AEWS1031 Interval-Compressed VDC/IE Roadmap',
    shortName: 'COG AEWS1031',
    treatmentType: 'Weeks',
    totalDuration: '28 - 32 Weeks',
    description: 'Interval-compressed (every 2 weeks) alternating cycles of Vincristine/Doxorubicin/Cyclophosphamide and Ifosfamide/Etoposide with G-CSF support.',
    phases: [
      {
        phaseName: 'Pre-Operative Chemotherapy (Cycles 1–6 / Weeks 1–12)',
        durationWeeks: 12,
        description: 'Alternating VDC and IE every 14 days with pegfilgrastim or daily filgrastim support.',
        keyDrugs: ['Cycle A: Vincristine, Doxorubicin, Cyclophosphamide (VDC) + Mesna', 'Cycle B: Ifosfamide (1,800 mg/m²/day x 5) + Etoposide (100 mg/m²/day x 5) + Mesna'],
        monitoringPoints: ['CBC recovery at Day 14 for next cycle', 'Urinalysis for Ifosfamide hemorrhagic cystitis']
      },
      {
        phaseName: 'Local Control Surgery & Radiotherapy (Weeks 12–14)',
        durationWeeks: 2,
        description: 'Surgical excision of primary bone/soft-tissue lesion and/or definitive proton/photon radiotherapy.',
        keyDrugs: ['Complete surgical resection with negative margins', 'Adjuvant Radiotherapy if close/positive margins'],
        monitoringPoints: ['Wound healing before resumption of systemic therapy']
      },
      {
        phaseName: 'Post-Operative Chemotherapy (Cycles 7–14 / Weeks 14–28)',
        durationWeeks: 14,
        description: 'Continuation of compressed alternating cycles (Cyclophosphamide replaces Doxorubicin once cumulative lifetime limit reached).',
        keyDrugs: ['Alternating VDC (or VC) and IE cycles every 14 days', 'Filgrastim G-CSF support'],
        monitoringPoints: ['Fanconi syndrome (renal tubular wasting of phosphate/bicarbonate caused by Ifosfamide)']
      }
    ],
    doseModificationGuidelines: [
      'Grade 4 hematologic toxicity: Ensure G-CSF starts 24h after completion of chemo.',
      'Ifosfamide neurotoxicity (encephalopathy): Immediately treat with IV Methylene Blue.'
    ],
    emergencyPrecautions: [
      'Mesna mandatory with all Cyclophosphamide (>1 g/m²) and Ifosfamide infusions to neutralize acrolein.'
    ]
  },

  'Hodgkin Lymphoma': {
    id: 'euronet-ph98',
    diagnosis: 'Hodgkin Lymphoma',
    protocolName: 'EURONET-PH98 / COG AHOD1331 Pediatric Hodgkin Roadmap',
    shortName: 'EURONET / AHOD1331',
    treatmentType: 'Cycles',
    totalDuration: '4 - 8 Months',
    description: 'Response-adapted pediatric Hodgkin lymphoma protocol aiming to omit radiotherapy in early complete metabolic responders (FDG-PET negative after 2 cycles).',
    phases: [
      {
        phaseName: 'Cycle 1 & 2: OEPA Induction',
        durationWeeks: 6,
        description: 'Vincristine (Oncovin), Etoposide, Prednisone, and Doxorubicin (Adriamycin).',
        keyDrugs: ['Vincristine (Days 1, 8, 15)', 'Doxorubicin (Days 1, 15)', 'Etoposide (Days 1–5)', 'Prednisone (Days 1–15 daily)'],
        monitoringPoints: ['Interim FDG-PET/CT scan after Cycle 2 (Deauville Score 1-3 = Adequate Response; 4-5 = Inadequate)']
      },
      {
        phaseName: 'Cycles 3–4 (or 3–6): COPDAC Consolidation',
        durationWeeks: 12,
        description: 'Consolidation chemotherapy replacing procarbazine with dacarbazine to prevent gonadal toxicity and secondary leukemias.',
        keyDrugs: ['Cyclophosphamide (Days 1, 8)', 'Vincristine (Days 1, 8)', 'Prednisone (Days 1–15)', 'Dacarbazine (DTIC Days 1–3)'],
        monitoringPoints: ['Complete response verification on end-of-treatment PET/CT']
      },
      {
        phaseName: 'Involved-Site Radiotherapy (If indicated by PET)',
        durationWeeks: 3,
        description: 'Targeted radiotherapy (19.8 Gy) reserved only for patients with residual PET avidity (Deauville 4-5).',
        keyDrugs: ['Involved-Site Radiotherapy (ISRT)'],
        monitoringPoints: ['Thyroid and pulmonary shielding']
      }
    ],
    doseModificationGuidelines: [
      'Severe steroid myopathy: Taper Prednisone dose by 25%.',
      'Bleomycin pulmonary toxicity: Discontinue Bleomycin permanently if DLCO drops >20%.'
    ],
    emergencyPrecautions: [
      'PCP and anti-emetic prophylaxis during high-dose steroid administration.'
    ]
  }
};

// Backwards compatibility & bracketed diagnosis aliases
PEDIATRIC_STANDARD_PROTOCOLS['Acute Lymphoblastic Leukemia (ALL)'] = PEDIATRIC_STANDARD_PROTOCOLS['B-Cell Acute Lymphoblastic Leukemia (B-ALL)'];
PEDIATRIC_STANDARD_PROTOCOLS['Neuroblastoma (NB)'] = PEDIATRIC_STANDARD_PROTOCOLS['Neuroblastoma'];
PEDIATRIC_STANDARD_PROTOCOLS["Wilms' Tumor (WT)"] = PEDIATRIC_STANDARD_PROTOCOLS['Wilms Tumor'];
PEDIATRIC_STANDARD_PROTOCOLS["Wilm's Tumor (WT)"] = PEDIATRIC_STANDARD_PROTOCOLS['Wilms Tumor'];
PEDIATRIC_STANDARD_PROTOCOLS['Wilms Tumor (WT)'] = PEDIATRIC_STANDARD_PROTOCOLS['Wilms Tumor'];
PEDIATRIC_STANDARD_PROTOCOLS['Wilms Tumor (Nephroblastoma)'] = PEDIATRIC_STANDARD_PROTOCOLS['Wilms Tumor'];
PEDIATRIC_STANDARD_PROTOCOLS['Nephroblastoma'] = PEDIATRIC_STANDARD_PROTOCOLS['Wilms Tumor'];
PEDIATRIC_STANDARD_PROTOCOLS['High-Risk Neuroblastoma'] = PEDIATRIC_STANDARD_PROTOCOLS['Neuroblastoma'];
PEDIATRIC_STANDARD_PROTOCOLS['Medulloblastoma (MB)'] = PEDIATRIC_STANDARD_PROTOCOLS['Medulloblastoma'];
PEDIATRIC_STANDARD_PROTOCOLS['Medulloblastoma (CNS)'] = PEDIATRIC_STANDARD_PROTOCOLS['Medulloblastoma'];
PEDIATRIC_STANDARD_PROTOCOLS['Osteosarcoma (OS)'] = PEDIATRIC_STANDARD_PROTOCOLS['Osteosarcoma'];
PEDIATRIC_STANDARD_PROTOCOLS['Ewing Sarcoma (ES)'] = PEDIATRIC_STANDARD_PROTOCOLS['Ewing Sarcoma'];
PEDIATRIC_STANDARD_PROTOCOLS['Clear Cell Sarcoma of the Kidney (CCSK)'] = PEDIATRIC_STANDARD_PROTOCOLS['Wilms Tumor'];
PEDIATRIC_STANDARD_PROTOCOLS['Rhabdoid Tumor of the Kidney (RTK)'] = PEDIATRIC_STANDARD_PROTOCOLS['Wilms Tumor'];
PEDIATRIC_STANDARD_PROTOCOLS['Chronic Myeloid Leukemia (CML)'] = PEDIATRIC_STANDARD_PROTOCOLS['Acute Myeloid Leukemia (AML)'];
PEDIATRIC_STANDARD_PROTOCOLS['Juvenile Myelomonocytic Leukemia (JMML)'] = PEDIATRIC_STANDARD_PROTOCOLS['Acute Myeloid Leukemia (AML)'];
PEDIATRIC_STANDARD_PROTOCOLS['Myelodysplastic Syndrome/Neoplasm (MDS)'] = PEDIATRIC_STANDARD_PROTOCOLS['Acute Myeloid Leukemia (AML)'];
PEDIATRIC_STANDARD_PROTOCOLS['Hemophagocytic Lymphohistiocytosis (HLH)'] = PEDIATRIC_STANDARD_PROTOCOLS['B-Cell Acute Lymphoblastic Leukemia (B-ALL)'];
PEDIATRIC_STANDARD_PROTOCOLS['Hodgkin Lymphoma (HL)'] = PEDIATRIC_STANDARD_PROTOCOLS['Hodgkin Lymphoma'];
PEDIATRIC_STANDARD_PROTOCOLS['Rhabdomyosarcoma (RMS)'] = PEDIATRIC_STANDARD_PROTOCOLS['Rhabdomyosarcoma'];
PEDIATRIC_STANDARD_PROTOCOLS['Non-Hodgkin Lymphoma (NHL)'] = PEDIATRIC_STANDARD_PROTOCOLS['Burkitt Lymphoma'];

/**
 * Standard Acute Lymphoblastic Leukemia (ALL) phases
 */
export const ALL_TREATMENT_PHASES = [
  'Induction',
  'Consolidation',
  'Interim Maintenance 1',
  'Delayed Intensification 1',
  'Interim Maintenance 2',
  'Delayed Intensification 2',
  'Maintenance Cycles',
] as const;

/**
 * Maintenance Cycle specific pulse days (Days 1, 29, 57 of standard 84-day cycle)
 */
export const ALL_MAINTENANCE_DAYS = [1, 29, 57] as const;

/**
 * Common protocol phase presets for quick selection
 */
export const COMMON_PHASE_PRESETS = [
  'Induction',
  'Consolidation',
  'Interim Maintenance 1',
  'Delayed Intensification 1',
  'Interim Maintenance 2',
  'Delayed Intensification 2',
  'Maintenance Cycles',
  'Pre-Operative Chemotherapy',
  'Post-Operative Consolidation',
  'Intensification Phase',
  'Re-Induction',
  'Immunotherapy Phase',
  'Myeloablative Conditioning & SCT',
  'Off-Therapy Surveillance'
];

/**
 * Common week presets (deprecated in favor of dynamic week selector)
 */
export const COMMON_WEEK_PRESETS: string[] = [];

/**
 * Common cycle presets (deprecated in favor of dynamic cycle selector)
 */
export const COMMON_CYCLE_PRESETS: string[] = [];

