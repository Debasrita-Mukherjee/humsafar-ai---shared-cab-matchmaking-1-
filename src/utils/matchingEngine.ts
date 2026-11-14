import { Passenger, TransportHub, PoolMatchResult, RouteStop, FareCalculation, TravelDirection } from '../types';

// Haversine distance in KM
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Road distance estimate with winding factor (urban multiplier)
export function estimateRoadDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const straight = calculateHaversineKm(lat1, lon1, lat2, lon2);
  return Number((straight * 1.32).toFixed(1));
}

// Convert km to estimated city drive minutes (avg speed 26 km/h in Kolkata traffic)
export function estimateDriveMinutes(distanceKm: number): number {
  const avgSpeedKmh = 28;
  const rawMinutes = (distanceKm / avgSpeedKmh) * 60;
  // +3 mins base for traffic signals & intersection delays
  return Math.max(8, Math.round(rawMinutes + 3));
}

// Deterministic compatibility scoring between two ride requests
export function evaluatePassengerCompatibility(
  p1: Passenger,
  p2: Passenger,
  hub: TransportHub,
  direction: TravelDirection
): {
  isCompatible: boolean;
  score: number; // 0 to 100
  overlapPercentage: number;
  detourMinutes: number;
  rejectionReason?: string;
} {
  // 1. Gender preference constraint
  if (p1.preferences.femaleOnlyPool || p2.preferences.femaleOnlyPool) {
    if (p1.gender !== 'female' || p2.gender !== 'female') {
      return { isCompatible: false, score: 0, overlapPercentage: 0, detourMinutes: 99, rejectionReason: 'Female-only pool preference requested' };
    }
  }

  // 2. Luggage capacity check (sedan carries max 3 large bags total)
  const totalLuggage = p1.preferences.luggageCount + p2.preferences.luggageCount;
  if (totalLuggage > 4) {
    return { isCompatible: false, score: 0, overlapPercentage: 0, detourMinutes: 99, rejectionReason: 'Total luggage exceeds vehicle trunk capacity' };
  }

  // 3. Direction match
  if (p1.direction !== p2.direction) {
    return { isCompatible: false, score: 0, overlapPercentage: 0, detourMinutes: 99, rejectionReason: 'Different travel directions' };
  }

  // 4. Proximity & Detour check
  const p1Loc = direction === 'outbound' ? p1.pickupLocation : p1.destinationLocation;
  const p2Loc = direction === 'outbound' ? p2.pickupLocation : p2.destinationLocation;

  const distanceBetweenPassengers = estimateRoadDistanceKm(p1Loc.lat, p1Loc.lng, p2Loc.lat, p2Loc.lng);
  const p1ToHub = estimateRoadDistanceKm(p1Loc.lat, p1Loc.lng, hub.lat, hub.lng);
  const p2ToHub = estimateRoadDistanceKm(p2Loc.lat, p2Loc.lng, hub.lat, hub.lng);

  // Direct sum vs combined route distance
  const combinedDistance = distanceBetweenPassengers + Math.min(p1ToHub, p2ToHub);
  const maxDirect = Math.max(p1ToHub, p2ToHub);
  const detourKm = Math.max(0, combinedDistance - maxDirect);
  const detourMinutes = Math.round(detourKm * 2.2);

  const maxAllowedDetour = Math.min(p1.preferences.maxTolerableDetourMins, p2.preferences.maxTolerableDetourMins);
  if (detourMinutes > maxAllowedDetour) {
    return {
      isCompatible: false,
      score: 35,
      overlapPercentage: 40,
      detourMinutes,
      rejectionReason: `Detour (+${detourMinutes}m) exceeds limit (max ${maxAllowedDetour}m)`,
    };
  }

  // Route overlap estimate: corridor overlap ratio
  const rawOverlap = Math.min(100, Math.max(45, Math.round(100 - (distanceBetweenPassengers / Math.max(p1ToHub, p2ToHub)) * 60)));

  // Time window compatibility (scheduledTime within 25 mins)
  const timeDifferenceMins = Math.abs(parseTimeStringToMinutes(p1.scheduledTime) - parseTimeStringToMinutes(p2.scheduledTime));
  if (timeDifferenceMins > 35) {
    return {
      isCompatible: false,
      score: 40,
      overlapPercentage: rawOverlap,
      detourMinutes,
      rejectionReason: `Time departure window difference (${timeDifferenceMins}m) is too wide`,
    };
  }

  // Overall compatibility score
  const score = Math.round(rawOverlap * 0.55 + Math.max(0, 30 - detourMinutes) * 1.0 + Math.max(0, 30 - timeDifferenceMins) * 0.5);

  return {
    isCompatible: score >= 60,
    score: Math.min(98, score),
    overlapPercentage: rawOverlap,
    detourMinutes,
  };
}

// Convert "18:45" to total minutes of day
export function parseTimeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 12 * 60;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Convert minutes to "18:45"
export function formatMinutesToTimeString(totalMinutes: number): string {
  const norm = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Build optimized sequence of stops
export function buildOptimizedRoute(
  passengers: Passenger[],
  hub: TransportHub,
  direction: TravelDirection
): {
  stops: RouteStop[];
  totalDistanceKm: number;
  totalDurationMins: number;
  netDetourMins: number;
  routePath: [number, number][];
} {
  const stops: RouteStop[] = [];
  const safeHubLat = typeof hub?.lat === 'number' ? hub.lat : 22.6547;
  const safeHubLng = typeof hub?.lng === 'number' ? hub.lng : 88.4467;

  if (!passengers || passengers.length === 0) {
    return {
      stops: [],
      totalDistanceKm: 0,
      totalDurationMins: 0,
      netDetourMins: 0,
      routePath: [],
    };
  }

  if (direction === 'outbound') {
    // City -> Hub: Sort pickups by distance to hub descending (farthest passenger picked up first)
    const sortedPassengers = [...passengers].sort((a, b) => {
      const latA = a?.pickupLocation?.lat ?? safeHubLat;
      const lngA = a?.pickupLocation?.lng ?? safeHubLng;
      const latB = b?.pickupLocation?.lat ?? safeHubLat;
      const lngB = b?.pickupLocation?.lng ?? safeHubLng;
      const distA = calculateHaversineKm(latA, lngA, safeHubLat, safeHubLng);
      const distB = calculateHaversineKm(latB, lngB, safeHubLat, safeHubLng);
      return distB - distA; // Descending: farthest first
    });

    let currentMinutes = parseTimeStringToMinutes(sortedPassengers[0]?.scheduledTime || '16:45');
    let cumulativeDistance = 0;

    sortedPassengers.forEach((p, idx) => {
      const pLat = p?.pickupLocation?.lat ?? safeHubLat;
      const pLng = p?.pickupLocation?.lng ?? safeHubLng;

      if (idx > 0) {
        const prevP = sortedPassengers[idx - 1];
        const prevLat = prevP?.pickupLocation?.lat ?? safeHubLat;
        const prevLng = prevP?.pickupLocation?.lng ?? safeHubLng;
        const legKm = estimateRoadDistanceKm(prevLat, prevLng, pLat, pLng);
        cumulativeDistance += legKm;
        currentMinutes += estimateDriveMinutes(legKm) + 2; // +2 mins for passenger onboarding
      }

      stops.push({
        id: `stop-pickup-${p.id || idx}`,
        passengerId: p.id || `p-${idx}`,
        passengerName: p.name || 'Passenger',
        passengerAvatar: p.avatar || '',
        type: 'pickup',
        locationName: p.pickupLocation?.name || 'Pickup Point',
        address: p.pickupLocation?.address || 'Pickup Point, City Corridor',
        lat: pLat,
        lng: pLng,
        estimatedTime: formatMinutesToTimeString(currentMinutes),
        detourAddedMins: idx === 0 ? 0 : 5,
      });
    });

    // Final stop: Hub
    const lastPassenger = sortedPassengers[sortedPassengers.length - 1];
    const lastLat = lastPassenger?.pickupLocation?.lat ?? safeHubLat;
    const lastLng = lastPassenger?.pickupLocation?.lng ?? safeHubLng;
    const hubLegKm = estimateRoadDistanceKm(lastLat, lastLng, safeHubLat, safeHubLng);
    cumulativeDistance += hubLegKm;
    currentMinutes += estimateDriveMinutes(hubLegKm);

    stops.push({
      id: `stop-hub-${hub.id}`,
      passengerId: 'all',
      passengerName: 'All Passengers',
      passengerAvatar: '',
      type: 'dropoff',
      locationName: hub.name,
      address: hub.tagline,
      lat: safeHubLat,
      lng: safeHubLng,
      estimatedTime: formatMinutesToTimeString(currentMinutes),
      detourAddedMins: 0,
    });

    const directFarthestKm = estimateRoadDistanceKm(sortedPassengers[0]?.pickupLocation?.lat ?? safeHubLat, sortedPassengers[0]?.pickupLocation?.lng ?? safeHubLng, safeHubLat, safeHubLng);
    const netDetourMins = Math.max(4, Math.round((cumulativeDistance - directFarthestKm) * 2.2));

    const totalDurationMins = stops.length > 0
      ? parseTimeStringToMinutes(stops[stops.length - 1].estimatedTime) - parseTimeStringToMinutes(stops[0].estimatedTime)
      : 30;

    const routePath = generateSmoothRoadPolyline(stops.map((s) => [s.lat, s.lng]));

    return {
      stops,
      totalDistanceKm: Number(cumulativeDistance.toFixed(1)),
      totalDurationMins: Math.max(25, totalDurationMins),
      netDetourMins,
      routePath,
    };
  } else {
    // Inbound: Hub -> City
    // Pick up at Hub first, then drop off in order of proximity (closest to hub first)
    const sortedPassengers = [...passengers].sort((a, b) => {
      const latA = a?.destinationLocation?.lat ?? safeHubLat;
      const lngA = a?.destinationLocation?.lng ?? safeHubLng;
      const latB = b?.destinationLocation?.lat ?? safeHubLat;
      const lngB = b?.destinationLocation?.lng ?? safeHubLng;
      const distA = calculateHaversineKm(safeHubLat, safeHubLng, latA, lngA);
      const distB = calculateHaversineKm(safeHubLat, safeHubLng, latB, lngB);
      return distA - distB; // Ascending: closest first
    });

    let currentMinutes = parseTimeStringToMinutes(sortedPassengers[0]?.scheduledTime || '17:15');
    let cumulativeDistance = 0;

    // First stop: Hub pickup for all
    stops.push({
      id: `stop-hub-pickup-${hub.id}`,
      passengerId: 'all',
      passengerName: 'All Passengers Boarding',
      passengerAvatar: '',
      type: 'pickup',
      locationName: hub.name,
      address: hub.terminalsOrPlatforms[0] || 'Designated Cab Pickup Bay',
      lat: safeHubLat,
      lng: safeHubLng,
      estimatedTime: formatMinutesToTimeString(currentMinutes),
      detourAddedMins: 0,
    });

    sortedPassengers.forEach((p, idx) => {
      const pDestLat = p?.destinationLocation?.lat ?? safeHubLat;
      const pDestLng = p?.destinationLocation?.lng ?? safeHubLng;

      const fromLat = idx === 0 ? safeHubLat : (sortedPassengers[idx - 1]?.destinationLocation?.lat ?? safeHubLat);
      const fromLng = idx === 0 ? safeHubLng : (sortedPassengers[idx - 1]?.destinationLocation?.lng ?? safeHubLng);
      const legKm = estimateRoadDistanceKm(fromLat, fromLng, pDestLat, pDestLng);
      cumulativeDistance += legKm;
      currentMinutes += estimateDriveMinutes(legKm) + 2;

      stops.push({
        id: `stop-dropoff-${p.id || idx}`,
        passengerId: p.id || `p-${idx}`,
        passengerName: p.name || 'Passenger',
        passengerAvatar: p.avatar || '',
        type: 'dropoff',
        locationName: p.destinationLocation?.name || 'Drop-off Destination',
        address: p.destinationLocation?.address || 'City Corridor',
        lat: pDestLat,
        lng: pDestLng,
        estimatedTime: formatMinutesToTimeString(currentMinutes),
        detourAddedMins: idx > 0 ? 6 : 0,
      });
    });

    const routePath = generateSmoothRoadPolyline(stops.map((s) => [s.lat, s.lng]));

    return {
      stops,
      totalDistanceKm: Number(cumulativeDistance.toFixed(1)),
      totalDurationMins: Math.max(25, parseTimeStringToMinutes(stops[stops.length - 1].estimatedTime) - parseTimeStringToMinutes(stops[0].estimatedTime)),
      netDetourMins: 6,
      routePath,
    };
  }
}

// Generate intermediate bezier curve points between stops for silky smooth map lines
function generateSmoothRoadPolyline(points: [number, number][]): [number, number][] {
  const validPoints = (points || []).filter(
    (pt): pt is [number, number] =>
      Array.isArray(pt) &&
      pt.length >= 2 &&
      typeof pt[0] === 'number' &&
      typeof pt[1] === 'number' &&
      !isNaN(pt[0]) &&
      !isNaN(pt[1])
  );
  if (validPoints.length < 2) return validPoints;
  const polyline: [number, number][] = [];

  for (let i = 0; i < validPoints.length - 1; i++) {
    const p1 = validPoints[i];
    const p2 = validPoints[i + 1];

    polyline.push(p1);

    // Create realistic intermediate road bends
    const steps = 6;
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      // Slight road curvature offset
      const curveOffset = Math.sin(t * Math.PI) * 0.003;
      const lat = p1[0] + (p2[0] - p1[0]) * t + curveOffset;
      const lng = p1[1] + (p2[1] - p1[1]) * t + (curveOffset * 0.7);
      polyline.push([lat, lng]);
    }
  }

  polyline.push(validPoints[validPoints.length - 1]);
  return polyline;
}

// Transparent Fair-Fare Algorithm
export function calculateTransparentFareSplits(
  passengers: Passenger[],
  netDetourMins: number
): {
  fares: FareCalculation[];
  totalPoolFare: number;
  totalSoloFareSum: number;
  totalSavingsSum: number;
  co2SavedTotalKg: number;
} {
  const numPassengers = passengers.length;
  // Pool discount rate: ~40% for 2 passengers, ~50% for 3 passengers
  const poolDiscountFactor = numPassengers >= 3 ? 0.48 : 0.40;

  let totalSoloFareSum = 0;
  let totalPoolFare = 0;
  let totalSavingsSum = 0;
  let co2SavedTotalKg = 0;

  const fares: FareCalculation[] = passengers.map((p, idx) => {
    const solo = p.soloFare || 580;
    totalSoloFareSum += solo;

    // Base fare: ₹150 shared evenly among riders
    const baseFareShare = Math.round(150 / numPassengers);
    // Variable distance share discounted
    const variableSolo = solo - 150;
    let individualPoolFare = Math.round(baseFareShare + variableSolo * (1 - poolDiscountFactor));

    // Detour compensation discount: The rider who incurred the extra detour gets a ₹30 courtesy discount
    let detourIncentive = 0;
    if (idx === 0 && netDetourMins > 4) {
      detourIncentive = 30;
      individualPoolFare -= detourIncentive;
    } else if (idx > 0) {
      individualPoolFare += Math.round(detourIncentive / Math.max(1, numPassengers - 1));
    }

    const savingsAmount = solo - individualPoolFare;
    const savingsPercentage = Math.round((savingsAmount / solo) * 100);

    // CO2 calculation: ~0.192 kg CO2 per solo km saved
    const co2SavedKg = Number((p.soloDistanceKm * 0.192 * 0.75).toFixed(2));

    totalPoolFare += individualPoolFare;
    totalSavingsSum += savingsAmount;
    co2SavedTotalKg += co2SavedKg;

    return {
      passengerId: p.id,
      passengerName: p.name,
      soloFare: solo,
      pooledFare: individualPoolFare,
      savingsAmount,
      savingsPercentage,
      baseFareShare,
      distanceKmShare: individualPoolFare - baseFareShare,
      detourIncentiveDiscount: detourIncentive,
      co2SavedKg,
    };
  });

  return {
    fares,
    totalPoolFare,
    totalSoloFareSum,
    totalSavingsSum,
    co2SavedTotalKg: Number(co2SavedTotalKg.toFixed(2)),
  };
}

// Safety buffer checker for flight & train
export function verifyScheduleBuffer(
  passengers: Passenger[],
  hubArrivalMinutes: number,
  hub: TransportHub
): {
  isSafe: boolean;
  remainingBufferMins: number;
  recommendedTimeAtHub: string;
  bufferVerdict: string;
} {
  // Find the earliest flight or train departure time among passengers
  let earliestDepartureMinutes = 24 * 60;
  let referencePassengerName = '';

  passengers.forEach((p) => {
    if (p.transportInfo?.departureOrArrivalTime) {
      const depMins = parseTimeStringToMinutes(p.transportInfo.departureOrArrivalTime);
      if (depMins < earliestDepartureMinutes) {
        earliestDepartureMinutes = depMins;
        referencePassengerName = p.name;
      }
    }
  });

  if (earliestDepartureMinutes === 24 * 60) {
    // Default fallback if no flight number provided
    earliestDepartureMinutes = hubArrivalMinutes + hub.recommendedBufferMinutes;
  }

  const remainingBufferMins = earliestDepartureMinutes - hubArrivalMinutes;
  const isSafe = remainingBufferMins >= (hub.type === 'airport' ? 75 : 25);

  let bufferVerdict = 'Safe & Recommended Buffer';
  if (remainingBufferMins >= 90) {
    bufferVerdict = 'Generous Buffer (Comfortable check-in & lounge access)';
  } else if (remainingBufferMins >= 60) {
    bufferVerdict = 'On Schedule (Sufficient for security & boarding)';
  } else if (remainingBufferMins >= 30) {
    bufferVerdict = 'Moderate Buffer (Proceed directly to baggage drop)';
  } else {
    bufferVerdict = 'Tight Buffer (Prioritize express security lane)';
  }

  return {
    isSafe,
    remainingBufferMins,
    recommendedTimeAtHub: formatMinutesToTimeString(hubArrivalMinutes),
    bufferVerdict: `${bufferVerdict} for ${referencePassengerName || 'departure'} (${remainingBufferMins} mins before departure)`,
  };
}
