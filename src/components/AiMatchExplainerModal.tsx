import React, { useEffect, useState } from 'react';
import { Sparkles, X, ShieldCheck, Route, Clock, IndianRupee } from 'lucide-react';
import { PoolMatchResult } from '../types';

interface AiMatchExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: PoolMatchResult;
}

export const AiMatchExplainerModal: React.FC<AiMatchExplainerModalProps> = ({
  isOpen,
  onClose,
  match,
}) => {
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    const fetchExplanation = async () => {
      try {
        const p1 = match.passengers[0];
        const p2 = match.passengers[1] || match.passengers[0];

        const res = await fetch('/api/ai/explain-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            primaryPassenger: { name: p1.name, pickup: p1.pickupLocation.name },
            matchedPassenger: { name: p2.name, pickup: p2.pickupLocation.name },
            detourMins: match.netDetourMins,
            savingsAmount: match.totalSavingsSum,
            hubName: match.hub.name,
            bufferRemainingMins: match.flightOrTrainBufferStatus.remainingBufferMins,
          }),
        });

        const data = await res.json();
        if (isMounted) {
          setExplanation(
            data.explanation ||
              `Matched based on ${match.routeOverlapPercentage}% corridor overlap along VIP Road / Major Arterial Road. Detour added is strictly bounded to ${match.netDetourMins} minutes, yielding ₹${match.totalSavingsSum} total combined savings while preserving ${match.flightOrTrainBufferStatus.remainingBufferMins} minutes safety buffer before departure.`
          );
        }
      } catch {
        if (isMounted) {
          setExplanation(
            `Matched based on ${match.routeOverlapPercentage}% corridor overlap along VIP Road / Major Arterial Road. Detour added is strictly bounded to ${match.netDetourMins} minutes, yielding ₹${match.totalSavingsSum} total combined savings while preserving ${match.flightOrTrainBufferStatus.remainingBufferMins} minutes safety buffer before departure.`
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchExplanation();

    return () => {
      isMounted = false;
    };
  }, [isOpen, match]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 shadow-2xl">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">
                AI Matchmaking Audit
              </h3>
              <p className="text-xs text-slate-500">Transparent algorithmic and corridor reasoning</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Narrative Box */}
        <div className="mt-5 p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-sm text-slate-800 leading-relaxed">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Evaluating route overlap and schedule safety...</span>
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-medium text-slate-800">{explanation}</p>
          )}
        </div>

        {/* 4 Algorithmic Pillars */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Route className="w-4 h-4 text-blue-600" />
              <span>Route Overlap</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {match.routeOverlapPercentage}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Along primary arterial corridor</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Detour Bounded</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
              +{match.netDetourMins} mins
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Below 12 min tolerance limit</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Schedule Buffer</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {match.flightOrTrainBufferStatus.remainingBufferMins} mins
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Before boarding gates close</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <IndianRupee className="w-4 h-4 text-blue-600" />
              <span>Net Savings</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
              ₹{match.totalSavingsSum}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Split proportionally with detour credit</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
