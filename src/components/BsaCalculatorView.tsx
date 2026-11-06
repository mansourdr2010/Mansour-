import React, { useState } from 'react';
import { Calculator, AlertCircle, Sparkles, Check, Info } from 'lucide-react';
import { calculateBSA, calculateGehanBSA } from '../utils/oncologyUtils';

export const BsaCalculatorView: React.FC = () => {
  const [heightCm, setHeightCm] = useState<number>(115);
  const [weightKg, setWeightKg] = useState<number>(20.5);
  const [dosePerM2, setDosePerM2] = useState<number>(1000);
  const [doseUnit, setDoseUnit] = useState<'mg/m²' | 'g/m²' | 'mcg/m²' | 'mg/kg'>('mg/m²');

  const mostellerBsa = calculateBSA(heightCm, weightKg);
  const gehanBsa = calculateGehanBSA(heightCm, weightKg);

  // Computed absolute dose
  const computedDose = () => {
    if (doseUnit === 'mg/kg') {
      return (weightKg * dosePerM2).toFixed(1) + ' mg';
    }
    if (doseUnit === 'g/m²') {
      return (mostellerBsa * dosePerM2).toFixed(2) + ' g';
    }
    if (doseUnit === 'mcg/m²') {
      return (mostellerBsa * dosePerM2).toFixed(0) + ' mcg';
    }
    // Default mg/m²
    return (mostellerBsa * dosePerM2).toFixed(1) + ' mg';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5 text-teal-700" />
          <h2 className="text-base font-bold text-slate-900">
            Pediatric Body Surface Area (BSA) & Chemotherapy Dosage Calculator
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Pediatric chemotherapy dosing relies strictly on Body Surface Area ($m^2$) or body weight ($mg/kg$ for infants &lt;10 kg) to minimize toxicity while preserving oncologic efficacy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Inputs */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Patient Anthropometrics
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                min="30"
                max="220"
                step="0.5"
                value={heightCm}
                onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-mono"
              />
              <span className="text-[11px] text-slate-400">Typical range: 45 cm (infant) to 180 cm</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                min="1"
                max="150"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-mono"
              />
              <span className="text-[11px] text-slate-400">Re-weigh prior to each cycle for accurate dosing</span>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Dose Verification Check
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Protocol Dose</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dosePerM2}
                    onChange={(e) => setDosePerM2(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Dosing Unit</label>
                  <select
                    value={doseUnit}
                    onChange={(e: any) => setDoseUnit(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="mg/m²">mg/m²</option>
                    <option value="g/m²">g/m²</option>
                    <option value="mcg/m²">mcg/m²</option>
                    <option value="mg/kg">mg/kg (Infant)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results display */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="bg-teal-50 border border-teal-200 p-5 rounded-xl text-center">
              <div className="text-xs text-teal-800 font-semibold uppercase tracking-wider">
                Calculated Mosteller BSA
              </div>
              <div className="text-4xl font-extrabold text-teal-900 font-mono tabular-nums my-2">
                {mostellerBsa.toFixed(2)} <span className="text-xl font-normal text-teal-700">m²</span>
              </div>
              <div className="text-xs text-teal-700 font-mono">
                Formula: √((Height × Weight) / 3600)
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Gehan & George Formula:</span>
                <span className="font-mono font-bold text-slate-800">{gehanBsa.toFixed(2)} m²</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                <span>Calculated Patient Dose:</span>
                <span className="font-mono font-bold text-teal-800 text-sm">{computedDose()}</span>
              </div>
            </div>

            {/* Pediatric Oncology Safety Reminders */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-700" />
                Pediatric Safety Clinical Safeguards:
              </div>
              <ul className="list-disc list-inside text-amber-900 space-y-1 pl-1">
                <li><strong>Vincristine:</strong> Standard dose is 1.5 mg/m², conventionally capped at a maximum of <strong>2.0 mg</strong> to prevent severe peripheral neuropathy.</li>
                <li><strong>Infants &lt; 10 kg or &lt; 1 year:</strong> Dose based on weight (mg/kg) using COG conversion: dose = (dose in mg/m²) / 30.</li>
                <li><strong>High-Dose Methotrexate:</strong> Verify normal renal function (GFR) and urine pH &ge; 7.0 before start.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
