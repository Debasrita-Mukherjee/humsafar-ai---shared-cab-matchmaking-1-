import React, { useState } from 'react';
import { PoolMatchResult } from '../types';
import { ShieldCheck, UserCheck, AlertTriangle, KeyRound, CheckCircle2, Car, Sparkles, Copy, Check } from 'lucide-react';

interface MatchDetailsCardProps {
  match: PoolMatchResult;
  onOpenAiExplainer: () => void;
  onConfirmBooking: () => void;
  isConfirmed: boolean;
}

export const MatchDetailsCard: React.FC<MatchDetailsCardProps> = ({
  match,
  onOpenAiExplainer,
  onConfirmBooking,
  isConfirmed,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [mutualConsentChecked, setMutualConsentChecked] = useState<boolean>(true);

  const handleShareTrackingLink = () => {
    navigator.clipboard?.writeText(`https://humsafar.ai/track/${match.matchId}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-blue-600">{match.vehicleType}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-medium">Trip #{match.matchId}</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900 mt-1 font-display">
            Verified Co-Travelers & Vehicle
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenAiExplainer}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Why this match?</span>
        </button>
      </div>

      {/* Driver & Vehicle Spotlight (Clean Soft White + Blue Theme) */}
      <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{match.driver.name}</span>
              <span className="text-xs text-amber-600 font-mono font-semibold">★ {match.driver.rating}</span>
              <span className="text-slate-500 text-xs">({match.driver.ridesCount} rides)</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-1.5">
              <span>{match.vehicleModel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {match.vehicleNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Boarding PIN */}
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-blue-200 shrink-0">
          <KeyRound className="w-4 h-4 text-blue-600" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Boarding Audio PIN</div>
            <div className="text-lg font-mono font-bold text-blue-600 tracking-widest">
              {match.pinCodeForBoarding}
            </div>
          </div>
        </div>
      </div>

      {/* Co-Passengers List */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Verified Ride Pool Members ({match.passengers.length} Passengers)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {match.passengers.map((passenger) => (
            <div
              key={passenger.id}
              className={`p-4 rounded-xl border transition-all ${
                passenger.isCurrentUser
                  ? 'bg-blue-50/40 border-blue-200'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={passenger.avatar}
                    alt={passenger.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {passenger.name}
                      </span>
                      <span className="text-xs text-amber-600 font-mono font-semibold">
                        ★ {passenger.verification.rating}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{passenger.phoneMasked}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-blue-600">
                    Save ₹{passenger.soloFare - Math.round(passenger.soloFare * 0.6)}
                  </span>
                </div>
              </div>

              {/* Verified Trust Badges */}
              <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-3 text-xs">
                {passenger.verification.idVerified && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>DigiLocker Verified</span>
                  </span>
                )}
                {passenger.verification.corporateEmailVerified && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                    <UserCheck className="w-3.5 h-3.5 text-sky-500" />
                    <span className="truncate max-w-[160px]">{passenger.verification.verifiedEmployerOrCollege || 'Corporate Verified'}</span>
                  </span>
                )}
              </div>

              {passenger.transportInfo && (
                <div className="mt-2.5 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                  <span className="truncate">
                    {passenger.transportInfo.carrierOrTrainName} {passenger.transportInfo.number}
                  </span>
                  <span className="font-mono font-semibold text-slate-900 shrink-0">
                    {passenger.transportInfo.departureOrArrivalTime}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Safety & Trust Actions Toolbar */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleShareTrackingLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedLink ? 'Tracking Link Copied!' : 'Share Live Trip'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSosModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Emergency SOS (112)</span>
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={mutualConsentChecked}
            onChange={(e) => setMutualConsentChecked(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-600"
          />
          <span>Agree to route detour buffer</span>
        </label>
      </div>

      {/* Final Confirmation Action */}
      <div className="pt-1">
        {isConfirmed ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-slate-900 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span>Ride Confirmed! Cab arriving in ~6 minutes at your pickup point.</span>
            </div>
            <p className="text-xs text-slate-600">
              Driver {match.driver.name} is on the way. Keep boarding PIN ({match.pinCodeForBoarding}) ready.
            </p>
            <button
              type="button"
              onClick={onConfirmBooking}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
            >
              View Digital Boarding Pass & Receipt
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConfirmBooking}
            disabled={!mutualConsentChecked}
            className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>Confirm & Book Shared Cab (₹{match.fares[0]?.pooledFare || 360})</span>
            <span className="font-mono text-xs">→</span>
          </button>
        )}
      </div>

      {/* SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Emergency SOS Response</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Triggering SOS dispatches your live GPS coordinates to the local police control room (112), Kolkata Traffic Police Control, and alerts your registered emergency contacts.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSosModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSosModal(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Broadcast SOS Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
