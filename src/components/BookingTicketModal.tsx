import React from 'react';
import { PoolMatchResult } from '../types';
import {
  CheckCircle2,
  X,
  KeyRound,
  Car,
  Download,
  QrCode,
} from 'lucide-react';

interface BookingTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: PoolMatchResult;
  onCancelRide: () => void;
}

export const BookingTicketModal: React.FC<BookingTicketModalProps> = ({
  isOpen,
  onClose,
  match,
  onCancelRide,
}) => {
  if (!isOpen) return null;

  const primaryFare = match.fares[0];

  const handleDownloadTicket = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl my-8 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close boarding pass"
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Confirmation Status */}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
          <CheckCircle2 className="w-4 h-4" />
          <span>Ride Confirmed & Dispatched</span>
        </div>

        {/* Title */}
        <div className="mt-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
            Humsafar Shared Mobility Pass
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trip ID: <span className="font-mono font-bold text-slate-900">{match.matchId}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            Issued on{' '}
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Boarding Audio PIN Callout (Clean White & Sky-Blue Surface) */}
        <div className="mt-5 bg-blue-50/75 rounded-2xl p-5 border border-blue-200 flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Driver Boarding Audio PIN</span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-slate-900 tracking-widest mt-1 tabular-nums">
              {match.pinCodeForBoarding}
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Share this PIN verbally with the driver before boarding the cab
            </p>
          </div>

          <div className="w-16 h-16 bg-white p-1.5 rounded-xl border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
            <div className="w-full h-full bg-blue-600 rounded-lg p-1 text-white flex flex-col items-center justify-center">
              <QrCode className="w-7 h-7 text-white" />
              <span className="text-[7px] font-mono tracking-tight">HUMSAFAR</span>
            </div>
          </div>
        </div>

        {/* Driver & Cab Details */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{match.driver.name}</span>
                  <span className="text-xs text-amber-600 font-semibold font-mono tabular-nums">
                    ★ {match.driver.rating}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  <span>{match.vehicleModel}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {match.vehicleNumber}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                Driver Status
              </div>
              <div className="text-xs font-bold text-slate-900">Arriving in ~6 mins</div>
            </div>
          </div>
        </div>

        {/* Route Stops Sequence */}
        <div className="mt-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Route Schedule & Stops
          </div>

          <div className="space-y-2 text-xs">
            {match.routeStops.map((stop, idx) => (
              <div
                key={stop.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900">
                      {stop.passengerName} ({stop.type === 'pickup' ? 'Pickup' : 'Hub Drop-off'})
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{stop.locationName}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {stop.estimatedTime}
                  </span>
                  {stop.detourAddedMins > 0 && (
                    <div className="text-[10px] text-blue-600 font-mono">+{stop.detourAddedMins}m detour</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fare Summary Breakdown */}
        <div className="mt-5 p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-sky-200/70">
            <span className="text-slate-600">Solo Cab Standard Fare</span>
            <span className="font-mono text-slate-400 line-through tabular-nums">
              ₹{primaryFare?.soloFare || 620}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 text-sm font-bold text-slate-900">
            <span>Your Pooled Fare</span>
            <span className="font-mono text-blue-700 text-base tabular-nums">
              ₹{primaryFare?.pooledFare || 360}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-blue-700">
            <span>Instant Cost Reduction</span>
            <span className="font-semibold font-mono tabular-nums">
              You saved ₹{primaryFare?.savingsAmount || 260} ({primaryFare?.savingsPercentage || 42}%)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadTicket}
            className="w-full sm:flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save / Print Boarding Pass</span>
          </button>

          <button
            type="button"
            onClick={onCancelRide}
            className="w-full sm:w-auto py-3 px-4 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Cancel Trip
          </button>
        </div>
      </div>
    </div>
  );
};
