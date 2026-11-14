import React, { useState, useMemo } from 'react';
import {
  TRANSPORT_HUBS,
  MOCK_PASSENGERS_POOL,
  INITIAL_IMPACT_METRICS,
  KOLKATA_IMAGES,
  KOLKATA_LOCATIONS,
  POPULAR_KOLKATA_ROUTES,
  EXPLORE_KOLKATA_GALLERY,
} from './data/mockData';
import { Passenger, PoolMatchResult, TravelDirection } from './types';
import {
  evaluatePassengerCompatibility,
  buildOptimizedRoute,
  calculateTransparentFareSplits,
  verifyScheduleBuffer,
  parseTimeStringToMinutes,
  estimateRoadDistanceKm,
} from './utils/matchingEngine';
import { Navbar } from './components/Navbar';
import { RouteMap } from './components/RouteMap';
import { ScheduleAwareBookingForm } from './components/ScheduleAwareBookingForm';
import { MatchDetailsCard } from './components/MatchDetailsCard';
import { FareSplittingBreakdown } from './components/FareSplittingBreakdown';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { AiMatchExplainerModal } from './components/AiMatchExplainerModal';
import { ImpactDashboardModal } from './components/ImpactDashboardModal';
import { BookingTicketModal } from './components/BookingTicketModal';
import { CabListingsSection, SharedCabListing } from './components/CabListingsSection';
import { OfferRideModal } from './components/OfferRideModal';
import { AuthModal } from './components/AuthModal';
import { MyBookingsModal, ConfirmedBookingRecord } from './components/MyBookingsModal';
import {
  ShieldCheck,
  Leaf,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  MapPin,
  Calendar,
  Search,
  Car,
  IndianRupee,
  Route,
  Lock,
  Mail,
  Phone,
  Globe,
  Share2,
  MessageSquare,
} from 'lucide-react';

export default function App() {
  const [selectedHubId, setSelectedHubId] = useState<string>('ccu-airport');
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isAiExplainerOpen, setIsAiExplainerOpen] = useState<boolean>(false);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState<boolean>(false);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState<boolean>(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState<boolean>(false);
  const [isOfferRideModalOpen, setIsOfferRideModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState<boolean>(false);

  // Synced direction & area passed to ScheduleAwareBookingForm
  const [formSyncDirection, setFormSyncDirection] = useState<TravelDirection | undefined>(undefined);
  const [formSyncArea, setFormSyncArea] = useState<string | undefined>(undefined);

  // Hero Booking Search Card State
  const [heroPickup, setHeroPickup] = useState<string>('Salt Lake Sector V');
  const [heroDestination, setHeroDestination] = useState<string>('Kolkata Airport (CCU)');
  const [heroDate, setHeroDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [heroTime, setHeroTime] = useState<string>('16:45');
  const [heroPassengers, setHeroPassengers] = useState<number>(1);
  const [searchFilterSummary, setSearchFilterSummary] = useState<{
    pickup: string;
    destination: string;
    date: string;
    time: string;
    passengers: number;
  } | null>(null);

  // Auth Account State
  const [currentUserAccount, setCurrentUserAccount] = useState<{
    name: string;
    email: string;
    verified: boolean;
  } | null>(null);

  // User-Offered Rides & Confirmed Bookings State
  const [userOfferedCabs, setUserOfferedCabs] = useState<SharedCabListing[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<ConfirmedBookingRecord[]>([]);
  const [activeTicketMatch, setActiveTicketMatch] = useState<PoolMatchResult | null>(null);

  // Active Hub
  const currentHub = useMemo(() => {
    return TRANSPORT_HUBS.find((h) => h.id === selectedHubId) || TRANSPORT_HUBS[0];
  }, [selectedHubId]);

  // Current User Booking Request State
  const [currentUserRequest, setCurrentUserRequest] = useState<Passenger>({
    id: 'user-primary',
    name: 'You (Ananya)',
    gender: 'female',
    avatar: KOLKATA_IMAGES.avatarFemale,
    phoneMasked: '+91 98301 ••••',
    pickupLocation: {
      name: 'Salt Lake Sector V',
      address: 'GP Block, Sector V, Bidhannagar, Kolkata',
      lat: 22.5804,
      lng: 88.4326,
    },
    destinationLocation: {
      name: 'Netaji Subhash Chandra Bose Int. Airport',
      address: 'T2 Departure Ramp, CCU Airport',
      lat: 22.6547,
      lng: 88.4467,
    },
    scheduledTime: '16:45',
    direction: 'outbound',
    transportInfo: {
      carrierOrTrainName: 'IndiGo',
      number: '6E 204',
      departureOrArrivalTime: '18:45',
      status: 'On-time',
      terminalOrPlatform: 'T2 Gate 9',
      estimatedBoardingOrPlatformTime: '18:05',
    },
    preferences: {
      femaleOnlyPool: false,
      quietRide: true,
      luggageCount: 1,
      acPreference: 'Normal',
      maxTolerableDetourMins: 12,
    },
    verification: {
      idVerified: true,
      corporateEmailVerified: true,
      verifiedEmployerOrCollege: 'Cognizant Technology Solutions',
      ridesCompleted: 42,
      rating: 4.95,
    },
    soloFare: 620,
    soloDistanceKm: 14.2,
    soloDurationMins: 32,
    isCurrentUser: true,
  });

  // Compute Active Pool Match using Deterministic Engine
  const activeMatch: PoolMatchResult = useMemo(() => {
    const compatibleCandidates = MOCK_PASSENGERS_POOL.filter((candidate) => {
      const evalResult = evaluatePassengerCompatibility(
        currentUserRequest,
        candidate,
        currentHub,
        currentUserRequest.direction
      );
      return evalResult.isCompatible;
    });

    const sameDirectionPool = MOCK_PASSENGERS_POOL.filter(
      (c) => c.direction === currentUserRequest.direction
    );
    const matchedCoPassenger =
      compatibleCandidates[0] ||
      sameDirectionPool[0] || {
        ...MOCK_PASSENGERS_POOL[1],
        id: 'matched-co-pilot',
        direction: currentUserRequest.direction,
        pickupLocation:
          currentUserRequest.direction === 'inbound'
            ? {
                name: currentHub.name,
                address: currentHub.tagline,
                lat: currentHub.lat,
                lng: currentHub.lng,
              }
            : MOCK_PASSENGERS_POOL[1].pickupLocation,
        destinationLocation:
          currentUserRequest.direction === 'inbound'
            ? {
                name: 'New Town Action Area I',
                address: 'Major Arterial Road, Action Area I',
                lat: 22.5867,
                lng: 88.4754,
              }
            : {
                name: currentHub.name,
                address: currentHub.tagline,
                lat: currentHub.lat,
                lng: currentHub.lng,
              },
      };

    const passengersInPool = [currentUserRequest, matchedCoPassenger];

    const { stops, totalDistanceKm, totalDurationMins, netDetourMins, routePath } =
      buildOptimizedRoute(passengersInPool, currentHub, currentUserRequest.direction);

    const { fares, totalPoolFare, totalSoloFareSum, totalSavingsSum, co2SavedTotalKg } =
      calculateTransparentFareSplits(passengersInPool, netDetourMins);

    const arrivalTimeMins = parseTimeStringToMinutes(stops[stops.length - 1].estimatedTime);
    const flightOrTrainBufferStatus = verifyScheduleBuffer(
      passengersInPool,
      arrivalTimeMins,
      currentHub
    );

    return {
      matchId: 'HMF-8924',
      status: isBookingConfirmed ? 'confirmed' : 'recommended',
      vehicleType: 'Comfort Sedan',
      vehicleModel: 'Maruti Suzuki Dzire Tour (CNG/EV)',
      vehicleNumber: 'WB 02 AJ 4821',
      driver: {
        name: 'Tapan Karmakar',
        rating: 4.94,
        ridesCount: 1480,
        phoneMasked: '+91 98310 ••••',
        avatar: KOLKATA_IMAGES.avatarMale,
        verified: true,
      },
      hub: currentHub,
      direction: currentUserRequest.direction,
      passengers: passengersInPool,
      routeStops: stops,
      routePath,
      totalDistanceKm,
      totalDurationMins,
      routeOverlapPercentage: 86,
      netDetourMins,
      fares,
      totalPoolCost: totalPoolFare,
      totalSoloCostSum: totalSoloFareSum,
      totalSavingsSum,
      totalCo2SavedKg: co2SavedTotalKg,
      flightOrTrainBufferStatus,
      pinCodeForBoarding: '8492',
    };
  }, [currentUserRequest, currentHub, isBookingConfirmed]);

  // Baseline Curated Kolkata Shared Cab Listings + User-Offered Rides
  const baseKolkataListings: SharedCabListing[] = useMemo(() => {
    const curated: SharedCabListing[] = [
      {
        id: 'cab-ccu-saltlake',
        vehicleName: 'Modern White Sedan (Dzire Tour)',
        vehicleCategory: 'Airport Express Sedan',
        vehicleNumber: 'WB 02 AJ 4821',
        image: KOLKATA_IMAGES.airportCabs,
        driverName: 'Tapan Karmakar',
        driverRating: 4.94,
        coTravelerName: MOCK_PASSENGERS_POOL[1].name,
        coTravelerAffiliation: MOCK_PASSENGERS_POOL[1].verification.verifiedEmployerOrCollege,
        pickup: 'Salt Lake Sector V',
        destination: 'Kolkata Airport (CCU)',
        departureTime: '16:45',
        availableSeats: 2,
        estimatedFarePerPassenger: Math.round(620 * 0.56),
        soloFareBaseline: 620,
        corridorName: 'VIP Road & Biswa Bangla Sarani',
        hubId: 'ccu-airport',
        direction: 'outbound',
        areaName: 'Salt Lake Sector V',
      },
      {
        id: 'cab-hwh-parkstreet',
        vehicleName: 'Kolkata Yellow Ambassador Taxi',
        vehicleCategory: 'Heritage Yellow Cab (AC)',
        vehicleNumber: 'WB 04 D 3190',
        image: KOLKATA_IMAGES.howrahBridge,
        driverName: 'Subrata Chatterjee',
        driverRating: 4.89,
        coTravelerName: MOCK_PASSENGERS_POOL[3].name,
        coTravelerAffiliation: MOCK_PASSENGERS_POOL[3].verification.verifiedEmployerOrCollege,
        pickup: 'Park Street / Central',
        destination: 'Howrah Junction Station',
        departureTime: '15:40',
        availableSeats: 2,
        estimatedFarePerPassenger: Math.round(360 * 0.56),
        soloFareBaseline: 360,
        corridorName: 'Howrah Bridge & JL Nehru Rd',
        hubId: 'hwh-railway',
        direction: 'outbound',
        areaName: 'Park Street / Central',
      },
      {
        id: 'cab-ccu-newtown',
        vehicleName: 'Comfort White Sedan (Etios)',
        vehicleCategory: 'Women-Safe Verified Pool',
        vehicleNumber: 'WB 06 T 7742',
        image: KOLKATA_IMAGES.newTownSaltLake,
        driverName: 'Biplab Dasgupta',
        driverRating: 4.96,
        coTravelerName: MOCK_PASSENGERS_POOL[2].name,
        coTravelerAffiliation: MOCK_PASSENGERS_POOL[2].verification.verifiedEmployerOrCollege,
        pickup: 'New Town Action Area I',
        destination: 'Kolkata Airport (CCU)',
        departureTime: '17:05',
        availableSeats: 2,
        estimatedFarePerPassenger: Math.round(590 * 0.56),
        soloFareBaseline: 590,
        corridorName: 'Major Arterial Road (MAR)',
        hubId: 'ccu-airport',
        direction: 'outbound',
        areaName: 'New Town Action Area I',
      },
      {
        id: 'cab-inbound-ccu-saltlake',
        vehicleName: 'Airport Arrival Shared Sedan',
        vehicleCategory: 'Inbound Hub Pickup (T2 Gate)',
        vehicleNumber: 'WB 02 CL 9108',
        image: KOLKATA_IMAGES.sharedRide,
        driverName: 'Arindam Ghosh',
        driverRating: 4.91,
        coTravelerName: MOCK_PASSENGERS_POOL[4].name,
        coTravelerAffiliation: MOCK_PASSENGERS_POOL[4].verification.verifiedEmployerOrCollege,
        pickup: 'Kolkata Airport (CCU)',
        destination: 'Salt Lake Sector V',
        departureTime: '17:15',
        availableSeats: 2,
        estimatedFarePerPassenger: Math.round(520 * 0.56),
        soloFareBaseline: 520,
        corridorName: 'VIP Road & Sector I-V',
        hubId: 'ccu-airport',
        direction: 'inbound',
        areaName: 'Salt Lake Sector V',
      },
      {
        id: 'cab-sdah-sectorv',
        vehicleName: 'Yellow Taxi Express Pool',
        vehicleCategory: 'Rail-to-IT Corridor',
        vehicleNumber: 'WB 01 K 6052',
        image: KOLKATA_IMAGES.heroTaxis,
        driverName: 'Pradip Mondal',
        driverRating: 4.87,
        coTravelerName: 'Arjun Sengupta',
        coTravelerAffiliation: 'IIT Kharagpur Alum',
        pickup: 'Sealdah Railway Station',
        destination: 'Salt Lake Sector V',
        departureTime: '18:00',
        availableSeats: 3,
        estimatedFarePerPassenger: Math.round(380 * 0.56),
        soloFareBaseline: 380,
        corridorName: 'Beliaghata & EM Bypass',
        hubId: 'sdah-railway',
        direction: 'inbound',
        areaName: 'Salt Lake Sector V',
      },
      {
        id: 'cab-victoria-airport',
        vehicleName: 'Modern White Sedan (EV)',
        vehicleCategory: 'Zero-Emission Corridor',
        vehicleNumber: 'WB 05 EV 1149',
        image: KOLKATA_IMAGES.victoriaParkStreet,
        driverName: 'Suman Roy',
        driverRating: 4.95,
        coTravelerName: 'Meera Bose',
        coTravelerAffiliation: 'IIM Calcutta',
        pickup: 'Esplanade / Dharmatala',
        destination: 'Kolkata Airport (CCU)',
        departureTime: '17:30',
        availableSeats: 2,
        estimatedFarePerPassenger: Math.round(705 * 0.56),
        soloFareBaseline: 705,
        corridorName: 'Maa Flyover & EM Bypass',
        hubId: 'ccu-airport',
        direction: 'outbound',
        areaName: 'Esplanade / Dharmatala',
      },
    ];

    return [...userOfferedCabs, ...curated];
  }, [userOfferedCabs]);

  // Filtered cab listings based on Hero Search Card
  const displayedListings = useMemo(() => {
    if (!searchFilterSummary) return baseKolkataListings;

    const pQuery = searchFilterSummary.pickup.toLowerCase();
    const dQuery = searchFilterSummary.destination.toLowerCase();

    const matches = baseKolkataListings.filter((cab) => {
      const seatsOk = cab.availableSeats >= searchFilterSummary.passengers;
      const pickupMatch =
        cab.pickup.toLowerCase().includes(pQuery.split(' ')[0]) ||
        pQuery.includes(cab.pickup.toLowerCase().split(' ')[0]);
      const destMatch =
        cab.destination.toLowerCase().includes(dQuery.split(' ')[0]) ||
        dQuery.includes(cab.destination.toLowerCase().split(' ')[0]);
      return seatsOk && (pickupMatch || destMatch);
    });

    return matches.length > 0 ? matches : baseKolkataListings;
  }, [baseKolkataListings, searchFilterSummary]);

  // Scroll helper
  const scrollToElement = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Apply custom city-wide Kolkata route into the live matcher
  const applyKolkataRouteToMatcher = (
    pickupName: string,
    destinationName: string,
    timeStr?: string
  ) => {
    const pLoc = KOLKATA_LOCATIONS.find((l) => l.name === pickupName) || KOLKATA_LOCATIONS[1];
    const dLoc = KOLKATA_LOCATIONS.find((l) => l.name === destinationName) || KOLKATA_LOCATIONS[0];

    const isToHowrah = destinationName.toLowerCase().includes('howrah');
    const isFromHowrah = pickupName.toLowerCase().includes('howrah');
    const isToSealdah = destinationName.toLowerCase().includes('sealdah');
    const isFromSealdah = pickupName.toLowerCase().includes('sealdah');
    const isFromAirport = pickupName.toLowerCase().includes('airport');

    const hubId = isToHowrah || isFromHowrah
      ? 'hwh-railway'
      : isToSealdah || isFromSealdah
      ? 'sdah-railway'
      : 'ccu-airport';

    const direction: TravelDirection =
      isFromAirport || isFromHowrah || isFromSealdah ? 'inbound' : 'outbound';

    const targetHub = TRANSPORT_HUBS.find((h) => h.id === hubId) || currentHub;
    const areaCandidateName = direction === 'inbound' ? dLoc.name : pLoc.name;
    const matchedHubArea =
      targetHub.popularAreas.find((a) =>
        a.name.toLowerCase().includes(areaCandidateName.toLowerCase().split(' ')[0])
      ) || targetHub.popularAreas[0];

    const distKm = Math.max(
      3.5,
      estimateRoadDistanceKm(pLoc.lat, pLoc.lng, dLoc.lat, dLoc.lng)
    );

    setSelectedHubId(hubId);
    setFormSyncDirection(direction);
    setFormSyncArea(matchedHubArea.name);
    setIsBookingConfirmed(false);

    setCurrentUserRequest((prev) => ({
      ...prev,
      name: currentUserAccount ? `You (${currentUserAccount.name.split(' ')[0]})` : prev.name,
      direction,
      scheduledTime: timeStr || prev.scheduledTime,
      pickupLocation: {
        name: pLoc.name,
        address: `${pLoc.name}, ${pLoc.zone}, Kolkata`,
        lat: pLoc.lat,
        lng: pLoc.lng,
      },
      destinationLocation: {
        name: dLoc.name,
        address: `${dLoc.name}, ${dLoc.zone}, Kolkata`,
        lat: dLoc.lat,
        lng: dLoc.lng,
      },
      soloDistanceKm: distKm,
      soloFare: Math.round(150 + distKm * 32),
      soloDurationMins: Math.round((distKm / 26) * 60 + 5),
    }));
  };

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilterSummary({
      pickup: heroPickup,
      destination: heroDestination,
      date: heroDate,
      time: heroTime,
      passengers: heroPassengers,
    });
    applyKolkataRouteToMatcher(heroPickup, heroDestination, heroTime);
    scrollToElement('find-rides');
  };

  // Handler for ScheduleAwareBookingForm updates
  const handleSearchMatches = (newReq: Partial<Passenger>) => {
    setCurrentUserRequest((prev) => ({
      ...prev,
      ...newReq,
      isCurrentUser: true,
    }));
    setIsBookingConfirmed(false);
  };

  // Handler for Natural Language AI Assistant Parsed Booking
  const handleApplyParsedBooking = (extracted: any) => {
    const matchedHub =
      TRANSPORT_HUBS.find((h) =>
        h.name.toLowerCase().includes(extracted?.hubName?.toLowerCase() || '')
      ) || currentHub;

    const matchedArea =
      matchedHub.popularAreas.find((a) =>
        a.name.toLowerCase().includes(extracted?.pickupLocation?.toLowerCase() || '')
      ) || matchedHub.popularAreas[0];

    const dir: TravelDirection = extracted?.direction === 'inbound' ? 'inbound' : 'outbound';

    setFormSyncDirection(dir);
    setFormSyncArea(matchedArea.name);

    setCurrentUserRequest((prev) => ({
      ...prev,
      direction: dir,
      pickupLocation:
        dir === 'outbound'
          ? {
              name: matchedArea.name,
              address: `${matchedArea.name}, Kolkata Corridor`,
              lat: matchedArea.lat,
              lng: matchedArea.lng,
            }
          : {
              name: matchedHub.name,
              address: matchedHub.tagline,
              lat: matchedHub.lat,
              lng: matchedHub.lng,
            },
      destinationLocation:
        dir === 'outbound'
          ? {
              name: matchedHub.name,
              address: matchedHub.tagline,
              lat: matchedHub.lat,
              lng: matchedHub.lng,
            }
          : {
              name: matchedArea.name,
              address: `${matchedArea.name}, Kolkata Corridor`,
              lat: matchedArea.lat,
              lng: matchedArea.lng,
            },
      scheduledTime: extracted?.departureOrArrivalTime || prev.scheduledTime,
      transportInfo: {
        carrierOrTrainName: extracted?.transportType === 'train' ? 'Train Express' : 'IndiGo Flight',
        number: extracted?.flightOrTrainNumber || '6E 204',
        departureOrArrivalTime: extracted?.departureOrArrivalTime || '18:45',
        status: 'On-time',
        terminalOrPlatform: matchedHub.type === 'airport' ? 'T2 Gate 9' : 'Platform 1',
        estimatedBoardingOrPlatformTime: '18:05',
      },
      preferences: {
        ...prev.preferences,
        luggageCount: extracted?.luggageCount || 1,
      },
      soloDistanceKm: matchedArea.approxDistanceKm,
      soloFare: Math.round(150 + matchedArea.approxDistanceKm * 32),
      soloDurationMins: Math.round((matchedArea.approxDistanceKm / 26) * 60 + 5),
    }));

    if (matchedHub.id !== selectedHubId) {
      setSelectedHubId(matchedHub.id);
    }
    setIsBookingConfirmed(false);
    scrollToElement('matcher');
  };

  // Confirm match or book a specific cab listing
  const handleConfirmMatchBooking = (cabListing?: SharedCabListing) => {
    const existingForCab = cabListing
      ? confirmedBookings.find((b) => b.cabId === cabListing.id)
      : undefined;

    if (existingForCab) {
      setActiveTicketMatch(existingForCab.matchSnapshot);
      setIsTicketModalOpen(true);
      return;
    }

    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const bookingId = cabListing
      ? `HMF-${cabListing.id.slice(-4).toUpperCase()}`
      : `HMF-${Math.floor(1000 + Math.random() * 9000)}`;

    const snapshotMatch: PoolMatchResult = cabListing
      ? {
          ...activeMatch,
          matchId: bookingId,
          status: 'confirmed',
          vehicleModel: cabListing.vehicleName,
          vehicleNumber: cabListing.vehicleNumber,
          pinCodeForBoarding: pin,
          driver: {
            ...activeMatch.driver,
            name: cabListing.driverName,
            rating: cabListing.driverRating ?? activeMatch.driver.rating,
          },
          fares: activeMatch.fares.map((f, idx) =>
            idx === 0
              ? {
                  ...f,
                  soloFare: cabListing.soloFareBaseline,
                  pooledFare: cabListing.estimatedFarePerPassenger,
                  savingsAmount: Math.max(
                    0,
                    cabListing.soloFareBaseline - cabListing.estimatedFarePerPassenger
                  ),
                  savingsPercentage: Math.round(
                    ((cabListing.soloFareBaseline - cabListing.estimatedFarePerPassenger) /
                      (cabListing.soloFareBaseline || 1)) *
                      100
                  ),
                }
              : f
          ),
        }
      : {
          ...activeMatch,
          matchId: bookingId,
          status: 'confirmed',
          pinCodeForBoarding: pin,
        };

    const newRecord: ConfirmedBookingRecord = {
      bookingId,
      cabId: cabListing?.id,
      title: cabListing ? cabListing.corridorName : `${currentUserRequest.pickupLocation.name} → ${currentUserRequest.destinationLocation.name}`,
      pickup: cabListing ? cabListing.pickup : currentUserRequest.pickupLocation.name,
      destination: cabListing ? cabListing.destination : currentUserRequest.destinationLocation.name,
      departureTime: cabListing ? cabListing.departureTime : currentUserRequest.scheduledTime,
      farePaid: cabListing
        ? cabListing.estimatedFarePerPassenger
        : activeMatch.fares[0]?.pooledFare || 360,
      vehicleName: snapshotMatch.vehicleModel,
      vehicleNumber: snapshotMatch.vehicleNumber,
      pinCode: pin,
      matchSnapshot: snapshotMatch,
    };

    setConfirmedBookings((prev) => [newRecord, ...prev]);
    setIsBookingConfirmed(true);
    setActiveTicketMatch(snapshotMatch);
    setIsTicketModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Sticky Pure White Navbar */}
      <Navbar
        activeSection={activeSection}
        onSelectSection={scrollToElement}
        onOpenOfferRide={() => setIsOfferRideModalOpen(true)}
        onOpenMyBookings={() => setIsMyBookingsOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        currentUserAccount={currentUserAccount}
        onLogout={() => setCurrentUserAccount(null)}
        confirmedBookingsCount={confirmedBookings.length}
      />

      {/* 1. HOMEPAGE HERO SECTION (PURE WHITE + SUBTLE SKY-BLUE DECORATION) */}
      <section id="home" className="bg-white pt-10 pb-14 border-b border-slate-200 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Hero Left Copy & CTAs */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                <span className="tracking-wide">একই পথে, একসাথে।</span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="text-slate-500 font-medium">
                  Same route, shared ride, lower cost.
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display text-slate-900 leading-[1.12]">
                Your Journey, Shared with Comfort.
              </h1>

              <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl">
                Find fellow travellers heading in the same direction. Share your cab, split the fare, and travel smarter across Kolkata.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => scrollToElement('find-rides')}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center gap-2"
                >
                  <span>Find a Shared Cab</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOfferRideModalOpen(true)}
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-900 font-semibold text-sm rounded-xl border border-slate-200 hover:border-blue-300 transition-all"
                >
                  Offer a Ride
                </button>

                <button
                  type="button"
                  onClick={() => setIsAiAssistantOpen(true)}
                  className="px-4 py-3.5 bg-sky-50 hover:bg-sky-100 text-blue-700 font-semibold text-sm rounded-xl border border-sky-200 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Ask AI Planner</span>
                </button>
              </div>

              {/* Clean Unboxed KPI Summary */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-blue-600 tabular-nums">
                    41.2%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Avg Fare Savings</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
                    +7.2 min
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Max Bounded Detour</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
                    100%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Verified Profiles</div>
                </div>
              </div>
            </div>

            {/* Hero Right Photograph with Subtle Light-Blue Decoration */}
            <div className="lg:col-span-6">
              <div className="relative bg-sky-50 border border-sky-100 rounded-2xl p-3 sm:p-4 shadow-sm">
                <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={KOLKATA_IMAGES.heroTaxis}
                    alt="Traditional yellow Kolkata Ambassador taxi alongside a modern white shared cab"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-3 px-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">
                    Kolkata Yellow Taxis &amp; Modern Shared Sedans
                  </span>
                  <span className="font-mono text-blue-600 font-semibold">
                    CCU Airport · Howrah · Sealdah · Salt Lake
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Booking Search Card */}
          <form
            onSubmit={handleHeroSearchSubmit}
            className="mt-10 bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pickup Location</span>
                </label>
                <select
                  value={heroPickup}
                  onChange={(e) => setHeroPickup(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
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
                  value={heroDestination}
                  onChange={(e) => setHeroDestination(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
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
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Travel Date</span>
                </label>
                <input
                  type="date"
                  value={heroDate}
                  onChange={(e) => setHeroDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Departure Time</span>
                </label>
                <input
                  type="time"
                  value={heroTime}
                  onChange={(e) => setHeroTime(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-mono font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Passengers</span>
                </label>
                <select
                  value={heroPassengers}
                  onChange={(e) => setHeroPassengers(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                >
                  <option value={1}>1 Passenger</option>
                  <option value={2}>2 Passengers</option>
                  <option value={3}>3 Passengers</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 h-[38px]"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Available Cabs</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* 2. AVAILABLE SHARED CABS LISTING CARDS */}
        <CabListingsSection
          listings={displayedListings}
          searchSummary={searchFilterSummary}
          bookedCabIds={confirmedBookings
            .map((b) => b.cabId)
            .filter((id): id is string => Boolean(id))}
          onResetFilter={() => setSearchFilterSummary(null)}
          onOpenOfferRide={() => setIsOfferRideModalOpen(true)}
          onViewDetails={(cab) => {
            applyKolkataRouteToMatcher(cab.pickup, cab.destination, cab.departureTime);
            scrollToElement('matcher');
          }}
          onBookCab={(cab) => {
            applyKolkataRouteToMatcher(cab.pickup, cab.destination, cab.departureTime);
            handleConfirmMatchBooking(cab);
          }}
        />

        {/* 3. SCHEDULE-AWARE MATCHER & INTERACTIVE KOLKATA ROUTE MAP */}
        <section id="matcher" className="scroll-mt-20 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <span>Schedule-Aware Route Engine</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500 normal-case font-medium">
                Live corridor optimization &amp; fare transparency
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 font-display">
              Plan Your Corridor &amp; Inspect Route Overlap
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Booking Form (5 Cols) */}
            <div className="lg:col-span-5">
              <ScheduleAwareBookingForm
                currentHub={currentHub}
                onHubChange={(id) => setSelectedHubId(id)}
                availableHubs={TRANSPORT_HUBS}
                onSearchMatches={handleSearchMatches}
                onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
                externalDirection={formSyncDirection}
                externalArea={formSyncArea}
              />
            </div>

            {/* Interactive Map & Route Sequence (7 Cols) */}
            <div id="map" className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold uppercase tracking-wider text-blue-600">
                      Visual Corridor
                    </span>
                    <span className="text-slate-300" aria-hidden="true">·</span>
                    <span className="text-slate-500 font-medium">
                      Optimized Stops: {activeMatch.routeStops.length} Waypoints
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    <span>Corridor: </span>
                    <span className="font-semibold text-slate-900">
                      {currentHub.shortCode} Express Artery (EM Bypass / VIP Rd)
                    </span>
                  </div>
                </div>

                <RouteMap
                  hub={activeMatch.hub}
                  stops={activeMatch.routeStops}
                  routePath={activeMatch.routePath}
                  routeOverlapPercentage={activeMatch.routeOverlapPercentage}
                  totalDistanceKm={activeMatch.totalDistanceKm}
                  totalDurationMins={activeMatch.totalDurationMins}
                  netDetourMins={activeMatch.netDetourMins}
                />
              </div>

              {/* Schedule Buffer Safety Banner */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Departure Safety Verification
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {activeMatch.flightOrTrainBufferStatus.bufferVerdict}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-500">Target Hub Arrival</div>
                  <div className="text-base font-bold font-mono text-blue-600 tabular-nums">
                    {activeMatch.flightOrTrainBufferStatus.recommendedTimeAtHub}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Match Details & Fare Audit Side-by-Side */}
          <div id="safety" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6">
              <MatchDetailsCard
                match={activeMatch}
                onOpenAiExplainer={() => setIsAiExplainerOpen(true)}
                onConfirmBooking={() => handleConfirmMatchBooking()}
                isConfirmed={isBookingConfirmed}
              />
            </div>

            <div id="fares" className="lg:col-span-6">
              <FareSplittingBreakdown
                fares={activeMatch.fares}
                totalPoolFare={activeMatch.totalPoolCost}
                totalSoloFareSum={activeMatch.totalSoloCostSum}
                totalSavingsSum={activeMatch.totalSavingsSum}
                totalCo2SavedKg={activeMatch.totalCo2SavedKg}
                netDetourMins={activeMatch.netDetourMins}
              />
            </div>
          </div>
        </section>

        {/* 4. POPULAR ROUTES IN KOLKATA */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                City-Wide Coverage
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 font-display">
                Popular Routes in Kolkata
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Frequently shared airport, railway, and IT hub corridors. Passengers can also match across any Kolkata neighborhoods within normal cab range.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {POPULAR_KOLKATA_ROUTES.map((route) => {
              const soloEst = Math.round(150 + route.distanceKm * 32);
              const sharedEst = Math.round(soloEst * 0.56);

              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => {
                    applyKolkataRouteToMatcher(route.from, route.to);
                    setSearchFilterSummary({
                      pickup: route.from,
                      destination: route.to,
                      date: heroDate,
                      time: heroTime,
                      passengers: 1,
                    });
                    scrollToElement('find-rides');
                  }}
                  className="text-left bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all overflow-hidden group flex flex-col"
                >
                  <div className="aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                    <img
                      src={route.image}
                      alt={`${route.from} to ${route.to}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[11px] font-semibold text-blue-600">
                        {route.corridor}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1 font-display flex items-center gap-1.5 flex-wrap">
                        <span>{route.from}</span>
                        <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{route.to}</span>
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-mono tabular-nums">
                        {route.distanceKm} km · ~{route.durationMins} mins
                      </span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        Est. ₹{sharedEst}{' '}
                        <span className="text-slate-400 font-normal line-through">₹{soloEst}</span>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. WHY CHOOSE HUMSAFAR AI? */}
        <section id="about-us" className="scroll-mt-20 bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Built for Kolkata Commuters
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 font-display">
                Why Choose Humsafar AI?
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Designed around transparent cost splitting, schedule-aware hub safety buffers, and verified co-traveler trust.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsImpactModalOpen(true)}
              className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-600 font-semibold text-xs rounded-xl border border-slate-200 hover:border-blue-300 transition-colors shrink-0 self-start md:self-auto"
            >
              View Pilot Evaluation Benchmarks
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Sparkles,
                title: 'AI-Powered Cab Matching',
                desc: 'Matches passengers by route overlap, departure window, luggage fit, and flight or train buffer rules.',
              },
              {
                icon: IndianRupee,
                title: 'Affordable Shared Rides',
                desc: 'Split the ₹150 base fare equally and distance proportionally with automated detour courtesy credits.',
              },
              {
                icon: Route,
                title: 'Smart Route Matching',
                desc: 'Optimizes pickup sequences along VIP Road, EM Bypass, Howrah Bridge, and Maa Flyover to cap detours.',
              },
              {
                icon: ShieldCheck,
                title: 'Verified Travellers',
                desc: 'DigiLocker ID and corporate/university email badges plus women-only pool preference support.',
              },
              {
                icon: Lock,
                title: 'Secure Booking',
                desc: 'Every trip includes a 4-digit boarding Audio PIN, live tracking share links, and instant SOS alerts.',
              },
              {
                icon: Leaf,
                title: 'Reduced Traffic and Pollution',
                desc: 'Consolidates overlapping airport and railway cab trips, cutting peak-hour congestion and CO₂ emissions.',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs hover:border-blue-200 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. EXPLORE KOLKATA VISUAL GALLERY */}
        <section className="space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Explore Kolkata
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 font-display">
              Connecting Kolkata&apos;s Key Landmarks &amp; Transit Hubs
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Click any Kolkata landmark or hub below to load shared cab corridors in that zone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXPLORE_KOLKATA_GALLERY.map((spot) => (
              <button
                key={spot.id}
                type="button"
                onClick={() => {
                  setSelectedHubId(spot.hubId);
                  setFormSyncArea(spot.areaMatch);
                  scrollToElement('matcher');
                }}
                className="text-left bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <img
                    src={spot.image}
                    alt={spot.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-bold text-slate-900 font-display">{spot.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{spot.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 7. RETURN-TRIP INBOUND MATCHMAKING CALLOUT (SOFT SKY-BLUE & WHITE) */}
        <section className="bg-blue-50/70 rounded-2xl p-6 sm:p-8 border border-blue-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Return-Trip Matchmaking (Inbound)
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
                Landing at Kolkata Airport or Arriving at Howrah? Pool Back into the City.
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Skip long airport prepaid taxi queues. Pre-match with fellow passengers landing at Terminal 2 or arriving on platforms 1–23 heading toward Salt Lake, New Town, Park Street, or South Kolkata.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setFormSyncDirection('inbound');
                  setCurrentUserRequest((prev) => ({
                    ...prev,
                    direction: 'inbound',
                    scheduledTime: '17:15',
                    pickupLocation: {
                      name: currentHub.name,
                      address: currentHub.tagline,
                      lat: currentHub.lat,
                      lng: currentHub.lng,
                    },
                    destinationLocation: {
                      name: currentHub.popularAreas[0]?.name || 'Salt Lake Sector V',
                      address: `${currentHub.popularAreas[0]?.name || 'Salt Lake Sector V'}, Kolkata`,
                      lat: currentHub.popularAreas[0]?.lat || 22.5804,
                      lng: currentHub.popularAreas[0]?.lng || 88.4326,
                    },
                  }));
                  scrollToElement('matcher');
                }}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span>Switch to Inbound Return Ride</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsImpactModalOpen(true)}
                className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <span>View Pilot Evaluation Data</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 8. CLEAN WHITE FOOTER */}
      <footer className="mt-8 bg-slate-50 border-t border-slate-200 pt-12 pb-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-200">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </span>
                <span className="text-base font-extrabold text-slate-900 font-display">
                  Humsafar AI
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                একই পথে, একসাথে। Intelligent shared cab matchmaking for Kolkata airport, railway, and city corridors with transparent fare splits.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="#home"
                  aria-label="Humsafar AI Website"
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                </a>
                <a
                  href="#find-rides"
                  aria-label="Share Humsafar AI"
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsAiAssistantOpen(true)}
                  aria-label="Open Assistant"
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Quick Links
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToElement('home')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToElement('find-rides')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Find Rides
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsOfferRideModalOpen(true)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Offer a Ride
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsMyBookingsOpen(true)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    My Bookings
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToElement('about-us')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    About Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Popular Kolkata Routes */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Popular Kolkata Routes
              </h4>
              <ul className="space-y-2">
                {POPULAR_KOLKATA_ROUTES.slice(0, 4).map((route) => (
                  <li key={route.id}>
                    <button
                      type="button"
                      onClick={() => {
                        applyKolkataRouteToMatcher(route.from, route.to);
                        scrollToElement('matcher');
                      }}
                      className="hover:text-blue-600 transition-colors text-left"
                    >
                      {route.from} → {route.to}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Contact Info
              </h4>
              <ul className="space-y-2 text-slate-500">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <a
                    href="mailto:debasritamukherjee785@gmail.com"
                    className="hover:text-blue-600 transition-colors truncate"
                  >
                    debasritamukherjee785@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Salt Lake Sector V &amp; Netaji Subhash Chandra Bose Int. Airport, Kolkata</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>24×7 Hub Safety Desk · Audio Boarding PIN</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <span>© {new Date().getFullYear()} Humsafar AI. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span>DigiLocker Verified Profiles</span>
              <span aria-hidden="true">·</span>
              <span>Encrypted Audio PIN</span>
              <span aria-hidden="true">·</span>
              <span>Zero Surge Guarantee</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <AiAssistantDrawer
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        availableHubs={TRANSPORT_HUBS}
        onApplyParsedBooking={handleApplyParsedBooking}
      />

      <AiMatchExplainerModal
        isOpen={isAiExplainerOpen}
        onClose={() => setIsAiExplainerOpen(false)}
        match={activeMatch}
      />

      <ImpactDashboardModal
        isOpen={isImpactModalOpen}
        onClose={() => setIsImpactModalOpen(false)}
        metrics={INITIAL_IMPACT_METRICS}
      />

      <BookingTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        match={activeTicketMatch || activeMatch}
        onCancelRide={() => {
          const targetId = (activeTicketMatch || activeMatch).matchId;
          setConfirmedBookings((prev) => prev.filter((b) => b.bookingId !== targetId));
          setIsBookingConfirmed(false);
          setIsTicketModalOpen(false);
        }}
      />

      <OfferRideModal
        isOpen={isOfferRideModalOpen}
        onClose={() => setIsOfferRideModalOpen(false)}
        defaultHostName={currentUserAccount?.name || 'Ananya Sen'}
        onCreateOfferedRide={(newCab) => {
          setUserOfferedCabs((prev) => [newCab, ...prev]);
          scrollToElement('find-rides');
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticate={(account) => {
          setCurrentUserAccount(account);
          setCurrentUserRequest((prev) => ({
            ...prev,
            name: `You (${account.name.split(' ')[0]})`,
            verification: {
              ...prev.verification,
              idVerified: account.verified,
            },
          }));
        }}
      />

      <MyBookingsModal
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
        bookings={confirmedBookings}
        onViewBoardingPass={(booking) => {
          setActiveTicketMatch(booking.matchSnapshot);
          setIsMyBookingsOpen(false);
          setIsTicketModalOpen(true);
        }}
        onCancelBooking={(bookingId) => {
          setConfirmedBookings((prev) => prev.filter((b) => b.bookingId !== bookingId));
        }}
      />
    </div>
  );
}
