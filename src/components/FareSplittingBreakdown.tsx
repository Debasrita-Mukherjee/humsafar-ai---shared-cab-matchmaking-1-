import React from 'react';
import { FareCalculation } from '../types';
import { Leaf, Info } from 'lucide-react';

interface FareSplittingBreakdownProps {
  fares: FareCalculation[];
  totalPoolFare: number;
  totalSoloFareSum: number;
  totalSavingsSum: number;
  totalCo2SavedKg: number;
  netDetourMins: number;
}

export const FareSplittingBreakdown: React.FC<FareSplittingBreakdownProps> = ({
  fares,
  totalPoolFare,
  totalSoloFareSum,
  totalSavingsSum,
  totalCo2SavedKg,
  netDetourMins,
}) => {
  const savingsPct = Math.round((totalSavingsSum / (totalSoloFareSum || 1)) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-blue-600">
              Fair Fare Algorithm
            </span>
            <span aria-hidden="true">·</span>
            <span>100% Transparent Split</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900 mt-1 font-display">
            Cost & Environmental Impact Audit
          </h3>
        </div>

        <div className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-right shadow-xs shrink-0">
          <div className="text-[10px] text-blue-100 uppercase font-semibold tracking-wider">
            Combined Pool Savings
          </div>
          <div className="text-lg font-bold font-mono text-white tabular-nums">
            ₹{totalSavingsSum} ({savingsPct}% off)
          </div>
        </div>
      </div>

      {/* Side-by-side Comparative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Solo Baseline
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
            ₹{totalSoloFareSum}
          </div>
          <p className="text-xs text-slate-500 mt-1">Sum of separate individual cab bookings</p>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
              Humsafar Total
            </span>
            <span className="text-xs font-mono font-bold text-blue-700 tabular-nums">
              -{savingsPct}%
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
            ₹{totalPoolFare}
          </div>
          <p className="text-xs text-blue-700 mt-1">Shared base fare + optimized corridor rate</p>
        </div>

        <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200">
          <div className="flex items-center gap-1.5">
            <Leaf className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Carbon Offset
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1 tabular-nums">
            {totalCo2SavedKg} kg CO₂
          </div>
          <p className="text-xs text-slate-600 mt-1">Avoided by sharing 1 vehicle instead of 2</p>
        </div>
      </div>

      {/* Individual Passenger Itemized Audit Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-3">Passenger</th>
              <th className="py-3 px-3 text-right">Solo Cab Fare</th>
              <th className="py-3 px-3 text-right">Base Share</th>
              <th className="py-3 px-3 text-right">Distance Share</th>
              <th className="py-3 px-3 text-right">Detour Credit</th>
              <th className="py-3 px-3 text-right text-blue-700 font-bold">Your Pooled Fare</th>
              <th className="py-3 px-3 text-right text-blue-700 font-bold">You Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fares.map((item) => (
              <tr key={item.passengerId} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-3 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    <span>{item.passengerName}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-slate-500 line-through tabular-nums">
                  ₹{item.soloFare}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                  ₹{item.baseFareShare}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                  ₹{item.distanceKmShare}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-blue-700 tabular-nums">
                  {item.detourIncentiveDiscount > 0 ? `-₹${item.detourIncentiveDiscount}` : '—'}
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums text-base">
                  ₹{item.pooledFare}
                </td>
                <td className="py-3.5 px-3 text-right">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg text-xs tabular-nums">
                    ₹{item.savingsAmount} ({item.savingsPercentage}%)
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Algorithmic Pricing Rule Note */}
      <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900">Deterministic Fare Rules:</span> Standard hub taxi base fare (₹150) is split equally. Road distance is split strictly proportional to individual km travelled. Any passenger whose route incurs a detour (&ge; {netDetourMins} mins) receives an automated ₹30 detour courtesy credit. Zero dynamic surge.
        </div>
      </div>
    </div>
  );
};
