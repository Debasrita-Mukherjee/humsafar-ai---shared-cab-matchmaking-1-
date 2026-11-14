import React from 'react';
import { X, TrendingUp, Clock, Users, Leaf, Activity, CheckCircle } from 'lucide-react';
import { ImpactMetrics } from '../types';

interface ImpactDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: ImpactMetrics;
}

export const ImpactDashboardModal: React.FC<ImpactDashboardModalProps> = ({
  isOpen,
  onClose,
  metrics,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-blue-600">
                Corridor Evaluation Suite
              </span>
              <span aria-hidden="true">·</span>
              <span>Pilot Test Results</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 mt-1 font-display">
              Humsafar AI Performance & Impact Benchmarks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{metrics.pilotRegion}</p>
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

        {/* 6 Key KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-5">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>Match Success Rate</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5 tabular-nums">
              {metrics.matchSuccessRate}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Compatible pairings within 20m window</p>
          </div>

          <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Avg Fare Reduction</span>
            </div>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-1.5 tabular-nums">
              {metrics.avgFareSavingsPercent}%
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Avg ₹{metrics.avgFareSavingsRupees} saved per traveler
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Average Detour</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5 tabular-nums">
              {metrics.avgDetourMinutes} min
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Below 12-min tolerance ceiling</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Vehicle Occupancy</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5 tabular-nums">
              {metrics.avgVehicleOccupancy}x
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Higher fleet utilization efficiency</p>
          </div>

          <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Leaf className="w-4 h-4 text-blue-600" />
              <span>CO₂ Avoided</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5 tabular-nums">
              {metrics.totalCo2SavedKg} kg
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">Compared to solo individual cab trips</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Corridor Congestion</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5 tabular-nums">
              -{metrics.congestionIndexReduction}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Reduction in peak-hour hub cab volume</p>
          </div>
        </div>

        {/* Detailed Impact Breakdown */}
        <div className="mt-6 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Core Evaluation Hypotheses & Validation
          </h4>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-900 shrink-0">1. Schedule Buffer Invariance:</span>
              <span className="text-slate-600">
                Outbound pooling guaranteed 99.4% on-time airport arrivals by factoring domestic flight security buffer rules (120 mins).
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-900 shrink-0">2. Deterministic Pricing Trust:</span>
              <span className="text-slate-600">
                Zero surge fluctuations. Automated detour credits eliminate passenger cost-sharing friction.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-900 shrink-0">3. Return-Trip Inbound Efficiency:</span>
              <span className="text-slate-600">
                Arriving passengers matched with ~4.2-minute average wait times at CCU & Howrah taxi staging bays.
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
          >
            Close Benchmark Report
          </button>
        </div>
      </div>
    </div>
  );
};
