import React, { useState, useEffect } from 'react';
import { TransportHub, TravelDirection, Passenger, ScheduledTransportInfo } from '../types';
import { SCHEDULE_DATABASE } from '../data/mockData';
import { Plane, Train, Sparkles, Clock, MapPin, Luggage, UserCheck, ArrowRightLeft } from 'lucide-react';
import { parseTimeStringToMinutes, formatMinutesToTimeString } from '../utils/matchingEngine';

interface ScheduleAwareBookingFormProps {
  currentHub: TransportHub;
  onHubChange: (hubId: string) => void;
  availableHubs: TransportHub[];
  onSearchMatches: (request: Partial<Passenger>) => void;
  onOpenAiAssistant: () => void;
  externalDirection?: TravelDirection;
  externalArea?: string;
}

export const ScheduleAwareBookingForm: React.FC<ScheduleAwareBookingFormProps> = ({
  currentHub,
  onHubChange,
  availableHubs,
  onSearchMatches,
  onOpenAiAssistant,
  externalDirection,
  externalArea,
}) => {
  const [direction, setDirection] = useState<TravelDirection>(externalDirection || 'outbound');
  const [selectedArea, setSelectedArea] = useState<string>(
    externalArea || currentHub.popularAreas[0]?.name || 'Salt Lake Sector V'
  );
  const [transportType, setTransportType] = useState<'flight' | 'train'>(
    currentHub.type === 'airport' ? 'flight' : 'train'
  );
  const [selectedScheduleCode, setSelectedScheduleCode] = useState<string>(
    currentHub.type === 'airport' ? '6E 204' : '22301'
  );
  const [luggageCount, setLuggageCount] = useState<number>(1);
  const [femaleOnlyPool, setFemaleOnlyPool] = useState<boolean>(false);
  const [quietRide] = useState<boolean>(true);
  const [maxDetourMins, setMaxDetourMins] = useState<number>(12);
  const [isCustomAddress, setIsCustomAddress] = useState<boolean>(false);
  const [customAddressText, setCustomAddressText] = useState<string>('Salt Lake Sector V, Kolkata');
  const [customTime] = useState<string>('16:45');

  useEffect(() => {
    if (externalDirection) {
      setDirection(externalDirection);
    }
  }, [externalDirection]);

  useEffect(() => {
    if (externalArea && currentHub.popularAreas.some((a) => a.name === externalArea)) {
      setSelectedArea(externalArea);
      setIsCustomAddress(false);
    }
  }, [externalArea, currentHub]);

  useEffect(() => {
    setTransportType(currentHub.type === 'airport' ? 'flight' : 'train');
    setSelectedScheduleCode(currentHub.type === 'airport' ? '6E 204' : '22301');
    if (!currentHub.popularAreas.some((a) => a.name === selectedArea)) {
      setSelectedArea(currentHub.popularAreas[0]?.name || 'Salt Lake Sector V');
    }
  }, [currentHub]);

  const scheduleList = transportType === 'flight' ? SCHEDULE_DATABASE.flights : SCHEDULE_DATABASE.trains;
  const currentScheduleItem = scheduleList.find((s) => s.code === selectedScheduleCode) || scheduleList[0];

  const departureOrArrivalTime = currentScheduleItem ? currentScheduleItem.depTime : customTime;
  const scheduledMins = parseTimeStringToMinutes(departureOrArrivalTime);

  const bufferMins = currentHub.type === 'airport' ? 120 : 45;
  const areaObj = currentHub.popularAreas.find((a) => a.name === selectedArea);
  const approxTravelMins = areaObj ? Math.round((areaObj.approxDistanceKm / 26) * 60 + 5) : 35;

  const targetHubArrivalMins = direction === 'outbound' ? scheduledMins - bufferMins : scheduledMins + 20;
  const recommendedPickupMins = direction === 'outbound' ? targetHubArrivalMins - approxTravelMins : targetHubArrivalMins;

  const recommendedPickupTime = formatMinutesToTimeString(recommendedPickupMins);
  const recommendedArrivalTime = formatMinutesToTimeString(targetHubArrivalMins);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedAreaObj = currentHub.popularAreas.find((a) => a.name === selectedArea) || currentHub.popularAreas[0];
    const resolvedName = isCustomAddress && customAddressText.trim() ? customAddressText.trim() : selectedAreaObj.name;
    const resolvedAddress = isCustomAddress && customAddressText.trim() ? customAddressText.trim() : `${selectedAreaObj.name}, Kolkata Corridor`;

    const pickupLocation =
      direction === 'outbound'
        ? {
            name: resolvedName,
            address: resolvedAddress,
            lat: selectedAreaObj.lat,
            lng: selectedAreaObj.lng,
          }
        : {
            name: currentHub.name,
            address: currentHub.tagline,
            lat: currentHub.lat,
            lng: currentHub.lng,
          };

    const destinationLocation =
      direction === 'outbound'
        ? {
            name: currentHub.name,
            address: currentHub.tagline,
            lat: currentHub.lat,
            lng: currentHub.lng,
          }
        : {
            name: resolvedName,
            address: resolvedAddress,
            lat: selectedAreaObj.lat,
            lng: selectedAreaObj.lng,
          };

    const transportInfo: ScheduledTransportInfo = {
      carrierOrTrainName: 'airline' in currentScheduleItem ? currentScheduleItem.airline : currentScheduleItem.name,
      number: currentScheduleItem.code,
      departureOrArrivalTime,
      status: currentScheduleItem.status,
      terminalOrPlatform: 'terminal' in currentScheduleItem ? currentScheduleItem.terminal : currentScheduleItem.platform,
      estimatedBoardingOrPlatformTime: formatMinutesToTimeString(scheduledMins - 40),
    };

    const newRequest: Partial<Passenger> = {
      id: 'current-user-request',
      name: 'You (Ananya)',
      gender: 'female',
      direction,
      pickupLocation,
      destinationLocation,
      scheduledTime: direction === 'outbound' ? recommendedPickupTime : departureOrArrivalTime,
      transportInfo,
      preferences: {
        femaleOnlyPool,
        quietRide,
        luggageCount,
        acPreference: 'Normal',
        maxTolerableDetourMins: maxDetourMins,
      },
      soloDistanceKm: selectedAreaObj.approxDistanceKm,
      soloFare: Math.round(150 + selectedAreaObj.approxDistanceKm * 32),
      soloDurationMins: approxTravelMins,
      isCurrentUser: true,
    };

    onSearchMatches(newRequest);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-blue-600">Schedule-Aware Matcher</span>
            <span aria-hidden="true">·</span>
            <span>Auto-Calculated Buffers</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1 font-display">
            {direction === 'outbound' ? 'Head to Transport Hub' : 'Return Ride from Hub'}
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenAiAssistant}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>AI Booking Assistant</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {/* Direction Switcher */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Trip Direction
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setDirection('outbound')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                direction === 'outbound'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Outbound (To {currentHub.shortCode})</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection('inbound')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                direction === 'inbound'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
              <span>Return (From {currentHub.shortCode})</span>
            </button>
          </div>
        </div>

        {/* Hub & Area Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Transport Hub
            </label>
            <select
              value={currentHub.id}
              onChange={(e) => {
                onHubChange(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            >
              {availableHubs.map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.name} ({hub.city} - {hub.shortCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {direction === 'outbound' ? 'Pickup Area' : 'Drop-Off Area'}
              </label>
              <button
                type="button"
                onClick={() => setIsCustomAddress(!isCustomAddress)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                {isCustomAddress ? 'Use Kolkata Presets' : 'Custom Address'}
              </button>
            </div>

            {isCustomAddress ? (
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={customAddressText}
                  onChange={(e) => setCustomAddressText(e.target.value)}
                  placeholder="e.g. BD Block Salt Lake or Axis Mall New Town"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            ) : (
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                >
                  {currentHub.popularAreas.map((area) => (
                    <option key={area.name} value={area.name}>
                      {area.name} (~{area.approxDistanceKm} km)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Schedule-Aware Selector */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentHub.type === 'airport' ? (
                <Plane className="w-4 h-4 text-blue-600" />
              ) : (
                <Train className="w-4 h-4 text-blue-600" />
              )}
              <span className="text-xs font-bold text-slate-800">
                {currentHub.type === 'airport' ? 'Flight Departure / Arrival' : 'Train Departure / Arrival'}
              </span>
            </div>
            <span className="text-xs text-slate-500">Schedule Synced</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={selectedScheduleCode}
              onChange={(e) => setSelectedScheduleCode(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {scheduleList.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} — {'airline' in item ? `${item.airline} to ${item.destination}` : `${item.name}`} ({item.depTime})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Time:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {departureOrArrivalTime}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-blue-600 font-semibold truncate">
                {'terminal' in currentScheduleItem ? currentScheduleItem.terminal : currentScheduleItem.platform}
              </span>
            </div>
          </div>

          {/* Recommended Buffer Box */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">
                Recommended Hub Buffer: {bufferMins} mins
              </div>
              <div className="text-slate-600 mt-0.5">
                Target arrival at {currentHub.shortCode} by{' '}
                <span className="font-mono font-bold text-blue-700">{recommendedArrivalTime}</span> ensures safe boarding window.
              </div>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-right shrink-0">
              <div className="text-[10px] text-slate-500 font-semibold">Recommended Pickup</div>
              <div className="font-mono font-bold text-blue-600 text-sm tabular-nums">
                {recommendedPickupTime}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setFemaleOnlyPool(!femaleOnlyPool)}
            className={`p-3 rounded-xl border text-left transition-all ${
              femaleOnlyPool
                ? 'bg-blue-50 border-blue-300 text-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <UserCheck className={`w-4 h-4 ${femaleOnlyPool ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold">Women-Only Pool</span>
              </div>
              <span className={`text-[11px] font-semibold ${femaleOnlyPool ? 'text-blue-600' : 'text-slate-400'}`}>
                {femaleOnlyPool ? 'On' : 'Off'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Verified female co-riders only</p>
          </button>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Luggage className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">Luggage</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setLuggageCount(num)}
                    className={`w-6 h-6 rounded-md text-xs font-mono font-bold transition-colors ${
                      luggageCount === num
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Trunk capacity reserved</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Max Detour</span>
              <span className="font-mono text-xs font-bold text-blue-600 tabular-nums">{maxDetourMins}m</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={maxDetourMins}
              onChange={(e) => setMaxDetourMins(Number(e.target.value))}
              className="w-full mt-2 accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>5m</span>
              <span>12m</span>
              <span>20m</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <span>Match Compatible Rides on {currentHub.shortCode} Corridor</span>
          <span className="font-mono text-xs">→</span>
        </button>
      </form>
    </div>
  );
};
