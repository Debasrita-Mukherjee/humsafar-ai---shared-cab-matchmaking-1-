import React from 'react';
import {
  MapPin,
  Clock,
  Users,
  Star,
  Car,
  ArrowRight,
  ShieldCheck,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { TravelDirection } from '../types';

export interface SharedCabListing {
  id: string;
  vehicleName: string;
  vehicleCategory: string;
  vehicleNumber: string;
  image: string;
  driverName: string;
  driverRating: number | null;
  coTravelerName: string;
  coTravelerAffiliation?: string;
  pickup: string;
  destination: string;
  departureTime: string;
  travelDate?: string;
  availableSeats: number;
  estimatedFarePerPassenger: number;
  soloFareBaseline: number;
  corridorName: string;
  hubId: string;
  direction: TravelDirection;
  areaName: string;
  isUserOffered?: boolean;
}

interface CabListingsSectionProps {
  listings: SharedCabListing[];
  searchSummary: {
    pickup: string;
    destination: string;
    date: string;
    time: string;
    passengers: number;
  } | null;
  bookedCabIds: string[];
  onViewDetails: (cab: SharedCabListing) => void;
  onBookCab: (cab: SharedCabListing) => void;
  onOpenOfferRide: () => void;
  onResetFilter?: () => void;
}

export const CabListingsSection: React.FC<CabListingsSectionProps> = ({
  listings,
  searchSummary,
  bookedCabIds,
  onViewDetails,
  onBookCab,
  onOpenOfferRide,
  onResetFilter,
}) => {
  return (
    <section id="find-rides" className="scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            <span>Kolkata Live Pool Corridors</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500 normal-case font-medium">
              {listings.length} active shared {listings.length === 1 ? 'cab' : 'cabs'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 font-display">
            Available Shared Cabs in Kolkata
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {searchSummary
              ? `Showing compatible rides near ${searchSummary.pickup} → ${searchSummary.destination} (${searchSummary.date} at ${searchSummary.time} · ${searchSummary.passengers} ${
                  searchSummary.passengers === 1 ? 'seat' : 'seats'
                })`
              : 'Verified shared Ambassador taxis and modern sedans across Airport, Howrah, Sealdah, Salt Lake, and New Town.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {searchSummary && onResetFilter && (
            <button
              type="button"
              onClick={onResetFilter}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Show All Corridors
            </button>
          )}
          <button
            type="button"
            onClick={onOpenOfferRide}
            className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors"
          >
            + Offer Seats in Your Cab
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((cab) => {
          const isBooked = bookedCabIds.includes(cab.id);
          const savingsPct = Math.max(
            0,
            Math.round(((cab.soloFareBaseline - cab.estimatedFarePerPassenger) / (cab.soloFareBaseline || 1)) * 100)
          );

          return (
            <article
              key={cab.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden flex flex-col"
            >
              {/* Vehicle Photograph */}
              <div className="aspect-[16/10] w-full bg-slate-100 overflow-hidden relative">
                <img
                  src={cab.image}
                  alt={cab.vehicleName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Vehicle Name & Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-display leading-snug">
                        {cab.vehicleName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <span>{cab.vehicleCategory}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-700">{cab.vehicleNumber}</span>
                      </div>
                    </div>

                    {cab.driverRating !== null && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 font-mono tabular-nums shrink-0 pt-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{cab.driverRating.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Pickup & Destination */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Pickup
                        </span>
                        <span className="font-semibold text-slate-900 truncate block">
                          {cab.pickup}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Destination
                        </span>
                        <span className="font-semibold text-slate-900 truncate block">
                          {cab.destination}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Line: Departure, Seats, Driver */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-mono font-semibold tabular-nums">{cab.departureTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 justify-end">
                      <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-semibold font-mono tabular-nums">
                        {cab.availableSeats} {cab.availableSeats === 1 ? 'seat' : 'seats'} left
                      </span>
                    </div>
                  </div>

                  {/* Driver & Co-Traveler Trust Line */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        Driver: <strong className="text-slate-800 font-medium">{cab.driverName}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 font-medium shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{cab.isUserOffered ? 'Community Host' : 'Verified'}</span>
                    </div>
                  </div>
                </div>

                {/* Fare & CTAs */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Est. fare per passenger</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
                          ₹{cab.estimatedFarePerPassenger}
                        </span>
                        <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                          ₹{cab.soloFareBaseline}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-blue-600 tabular-nums">
                      Save {savingsPct}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onViewDetails(cab)}
                      className="py-2.5 px-3 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onBookCab(cab)}
                      className={`py-2.5 px-3 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs ${
                        isBooked
                          ? 'bg-sky-50 text-blue-700 border border-blue-200 hover:bg-sky-100'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isBooked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>View Pass</span>
                        </>
                      ) : (
                        <span>Book Shared Cab</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
