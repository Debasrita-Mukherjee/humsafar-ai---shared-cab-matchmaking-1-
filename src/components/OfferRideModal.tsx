import React, { useState, useMemo } from 'react';
import { X, Car, MapPin, Calendar, Clock, Users, IndianRupee, Check } from 'lucide-react';
import { KOLKATA_IMAGES, KOLKATA_LOCATIONS } from '../data/mockData';
import { estimateRoadDistanceKm } from '../utils/matchingEngine';
import { SharedCabListing } from './CabListingsSection';

interface OfferRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOfferedRide: (newCab: SharedCabListing) => void;
  defaultHostName?: string;
}

export const OfferRideModal: React.FC<OfferRideModalProps> = ({
  isOpen,
  onClose,
  onCreateOfferedRide,
  defaultHostName = 'Ananya Sen',
}) => {
  const [pickup, setPickup] = useState<string>('Salt Lake Sector V');
  const [destination, setDestination] = useState<string>('Kolkata Airport (CCU)');
  const [travelDate, setTravelDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [departureTime, setDepartureTime] = useState<string>('17:30');
  const [vehiclePreset, setVehiclePreset] = useState<'ambassador' | 'sedan' | 'suv'>('sedan');
  const [vehicleNumber, setVehicleNumber] = useState<string>('WB 04 HG 2914');
  const [availableSeats, setAvailableSeats] = useState<number>(2);
  const [hostName, setHostName] = useState<string>(defaultHostName);

  const estimatedDistance = useMemo(() => {
    const pLoc = KOLKATA_LOCATIONS.find((l) => l.name === pickup) || KOLKATA_LOCATIONS[1];
    const dLoc = KOLKATA_LOCATIONS.find((l) => l.name === destination) || KOLKATA_LOCATIONS[0];
    return Math.max(3.5, estimateRoadDistanceKm(pLoc.lat, pLoc.lng, dLoc.lat, dLoc.lng));
  }, [pickup, destination]);

  const suggestedSoloFare = Math.round(150 + estimatedDistance * 32);
  const suggestedSharedFare = Math.round(suggestedSoloFare * 0.56);

  const [customFare, setCustomFare] = useState<string>('');
  const finalFare = customFare ? Math.max(80, Number(customFare)) : suggestedSharedFare;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const vehicleMap = {
      ambassador: {
        name: 'Kolkata Yellow Ambassador Taxi',
        category: 'Heritage Yellow Cab (AC)',
        image: KOLKATA_IMAGES.heroTaxis,
      },
      sedan: {
        name: 'Modern White Sedan (Dzire / Etios)',
        category: 'Comfort Shared Sedan',
        image: KOLKATA_IMAGES.airportCabs,
      },
      suv: {
        name: 'Kolkata Airport Express SUV',
        category: 'Luggage-Friendly SUV',
        image: KOLKATA_IMAGES.sharedRide,
      },
    }[vehiclePreset];

    const isInboundFromAirport = pickup.toLowerCase().includes('airport');
    const isInboundFromHowrah = pickup.toLowerCase().includes('howrah');
    const isInboundFromSealdah = pickup.toLowerCase().includes('sealdah');

    const isToHowrah = destination.toLowerCase().includes('howrah');
    const isToSealdah = destination.toLowerCase().includes('sealdah');

    const hubId = isInboundFromHowrah || isToHowrah
      ? 'hwh-railway'
      : isInboundFromSealdah || isToSealdah
      ? 'sdah-railway'
      : 'ccu-airport';

    const direction =
      isInboundFromAirport || isInboundFromHowrah || isInboundFromSealdah
        ? 'inbound'
        : 'outbound';

    const areaName = direction === 'inbound' ? destination : pickup;

    const newCab: SharedCabListing = {
      id: `user-offer-${Date.now()}`,
      vehicleName: vehicleMap.name,
      vehicleCategory: vehicleMap.category,
      vehicleNumber: vehicleNumber.trim() || 'WB 02 AJ 4821',
      image: vehicleMap.image,
      driverName: hostName.trim() || 'Verified Host',
      driverRating: null,
      coTravelerName: hostName.trim() || 'Verified Host',
      coTravelerAffiliation: 'Humsafar Community Ride',
      pickup,
      destination,
      departureTime,
      travelDate,
      availableSeats,
      estimatedFarePerPassenger: finalFare,
      soloFareBaseline: suggestedSoloFare,
      corridorName: `${pickup} → ${destination}`,
      hubId,
      direction,
      areaName,
      isUserOffered: true,
    };

    onCreateOfferedRide(newCab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl my-8 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Offer Ride Modal"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Offer Seats in Your Kolkata Cab
            </h3>
            <p className="text-xs text-slate-500">
              Share your booked taxi or sedan and split the fare transparently
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Pickup Location</span>
              </label>
              <select
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              >
                {KOLKATA_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                <span>Destination</span>
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              >
                {KOLKATA_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Travel Date</span>
              </label>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Departure</span>
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Seats</span>
              </label>
              <select
                value={availableSeats}
                onChange={(e) => setAvailableSeats(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              >
                <option value={1}>1 Seat</option>
                <option value={2}>2 Seats</option>
                <option value={3}>3 Seats</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Cab Type
              </label>
              <select
                value={vehiclePreset}
                onChange={(e) => setVehiclePreset(e.target.value as 'ambassador' | 'sedan' | 'suv')}
                className="w-full px-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              >
                <option value="sedan">Modern White Sedan</option>
                <option value="ambassador">Yellow Kolkata Ambassador</option>
                <option value="suv">Airport Express SUV</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Vehicle Reg. Number
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="WB 04 HG 2914"
                className="w-full px-3 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Your Name (Co-Traveler / Host)
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
                <span>Fare Share / Seat (Est. ₹{suggestedSharedFare})</span>
              </label>
              <input
                type="number"
                min={60}
                max={2000}
                value={customFare}
                onChange={(e) => setCustomFare(e.target.value)}
                placeholder={`${suggestedSharedFare}`}
                className="w-full px-3 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 flex items-center justify-between">
            <span>Estimated Distance: <strong className="font-mono">{estimatedDistance} km</strong></span>
            <span>Solo Baseline: <strong className="font-mono">₹{suggestedSoloFare}</strong></span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Publish Shared Cab</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
