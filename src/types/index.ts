export type TransportType = 'airport' | 'railway';

export type TravelDirection = 'outbound' | 'inbound'; // outbound: city -> hub; inbound: hub -> city

export interface TransportHub {
  id: string;
  name: string;
  shortCode: string;
  type: TransportType;
  city: string;
  tagline: string;
  lat: number;
  lng: number;
  terminalsOrPlatforms: string[];
  recommendedBufferMinutes: number; // e.g. 120 mins for airport, 45 mins for railway
  popularAreas: { name: string; lat: number; lng: number; approxDistanceKm: number }[];
}

export interface VerificationBadges {
  idVerified: boolean; // DigiLocker / Aadhaar
  corporateEmailVerified: boolean; // e.g. TCS, Cognizant, Wipro, IIT, IIM
  verifiedEmployerOrCollege?: string;
  ridesCompleted: number;
  rating: number; // e.g. 4.9
}

export interface TravelPreferences {
  femaleOnlyPool: boolean;
  quietRide: boolean;
  luggageCount: number; // 1, 2, 3
  acPreference: 'Normal' | 'Chill' | 'Eco';
  maxTolerableDetourMins: number; // e.g. 10 or 15 mins
}

export interface ScheduledTransportInfo {
  carrierOrTrainName: string;
  number: string; // e.g. "6E 204" or "22301"
  departureOrArrivalTime: string; // e.g. "18:45"
  status: 'On-time' | 'Delayed' | 'Boarding' | 'Scheduled';
  terminalOrPlatform: string;
  estimatedBoardingOrPlatformTime: string;
}

export interface Passenger {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'other';
  avatar: string;
  phoneMasked: string;
  pickupLocation: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  destinationLocation: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  scheduledTime: string;
  direction: TravelDirection;
  transportInfo?: ScheduledTransportInfo;
  preferences: TravelPreferences;
  verification: VerificationBadges;
  soloFare: number;
  soloDistanceKm: number;
  soloDurationMins: number;
  isCurrentUser?: boolean;
}

export interface RouteStop {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerAvatar: string;
  type: 'pickup' | 'dropoff';
  locationName: string;
  lat: number;
  lng: number;
  estimatedTime: string;
  detourAddedMins: number;
  address: string;
}

export interface FareCalculation {
  passengerId: string;
  passengerName: string;
  soloFare: number;
  pooledFare: number;
  savingsAmount: number;
  savingsPercentage: number;
  baseFareShare: number;
  distanceKmShare: number;
  detourIncentiveDiscount: number;
  co2SavedKg: number;
}

export interface PoolMatchResult {
  matchId: string;
  status: 'recommended' | 'confirmed' | 'in_transit' | 'completed';
  vehicleType: 'Comfort Sedan' | 'Spacious SUV' | 'Eco Electric';
  vehicleModel: string;
  vehicleNumber: string;
  driver: {
    name: string;
    rating: number;
    ridesCount: number;
    phoneMasked: string;
    avatar: string;
    verified: boolean;
  };
  hub: TransportHub;
  direction: TravelDirection;
  passengers: Passenger[];
  routeStops: RouteStop[];
  routePath: [number, number][]; // lat/lng pairs
  totalDistanceKm: number;
  totalDurationMins: number;
  routeOverlapPercentage: number;
  netDetourMins: number;
  fares: FareCalculation[];
  totalPoolCost: number;
  totalSoloCostSum: number;
  totalSavingsSum: number;
  totalCo2SavedKg: number;
  flightOrTrainBufferStatus: {
    isSafe: boolean;
    remainingBufferMins: number;
    recommendedTimeAtHub: string;
    bufferVerdict: string;
  };
  aiExplanation?: string;
  pinCodeForBoarding: string;
}

export interface ImpactMetrics {
  pilotRegion: string;
  totalPooledRides: number;
  matchSuccessRate: number; // e.g. 89.2%
  avgFareSavingsPercent: number; // e.g. 41.5%
  avgFareSavingsRupees: number; // e.g. ₹385
  avgDetourMinutes: number; // e.g. 7.4 min
  avgVehicleOccupancy: number; // e.g. 2.4 passengers
  totalCo2SavedKg: number; // e.g. 1420 kg
  congestionIndexReduction: number; // e.g. 18%
}
