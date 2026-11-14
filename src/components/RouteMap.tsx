import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RouteStop, TransportHub } from '../types';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Navigation, Car, ShieldCheck } from 'lucide-react';

interface RouteMapProps {
  hub: TransportHub;
  stops: RouteStop[];
  routePath: [number, number][];
  routeOverlapPercentage: number;
  totalDistanceKm: number;
  totalDurationMins: number;
  netDetourMins: number;
  isSimulating?: boolean;
  onSimulationToggle?: () => void;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  hub,
  stops,
  routePath,
  routeOverlapPercentage,
  totalDistanceKm,
  totalDurationMins,
  netDetourMins,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [showOverlapCorridor, setShowOverlapCorridor] = useState<boolean>(true);
  const [activeStop, setActiveStop] = useState<RouteStop | null>(null);

  // Simulation state
  const [simProgress, setSimProgress] = useState<number>(0); // 0 to 1
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  // Calculate bounding box for auto-projection
  const bounds = useMemo(() => {
    const validStopLats = (stops || [])
      .map((s) => s?.lat)
      .filter((l): l is number => typeof l === 'number' && !isNaN(l));
    const validStopLngs = (stops || [])
      .map((s) => s?.lng)
      .filter((l): l is number => typeof l === 'number' && !isNaN(l));

    const validPathLats = (routePath || [])
      .map((p) => (Array.isArray(p) ? p[0] : undefined))
      .filter((l): l is number => typeof l === 'number' && !isNaN(l));
    const validPathLngs = (routePath || [])
      .map((p) => (Array.isArray(p) ? p[1] : undefined))
      .filter((l): l is number => typeof l === 'number' && !isNaN(l));

    const hubLat = typeof hub?.lat === 'number' ? hub.lat : 22.6547;
    const hubLng = typeof hub?.lng === 'number' ? hub.lng : 88.4467;

    const allLats = [...validStopLats, hubLat, ...validPathLats];
    const allLngs = [...validStopLngs, hubLng, ...validPathLngs];

    const minLat = allLats.length ? Math.min(...allLats) : 22.4;
    const maxLat = allLats.length ? Math.max(...allLats) : 22.7;
    const minLng = allLngs.length ? Math.min(...allLngs) : 88.3;
    const maxLng = allLngs.length ? Math.max(...allLngs) : 88.5;

    const latSpan = Math.max(0.04, maxLat - minLat);
    const lngSpan = Math.max(0.04, maxLng - minLng);

    return {
      minLat: minLat - latSpan * 0.15,
      maxLat: maxLat + latSpan * 0.15,
      minLng: minLng - lngSpan * 0.15,
      maxLng: maxLng + lngSpan * 0.15,
    };
  }, [stops, hub, routePath]);

  const MAP_WIDTH = 800;
  const MAP_HEIGHT = 520;

  const project = (lat: number, lng: number): [number, number] => {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return [0, 0];
    }
    const spanLng = bounds.maxLng - bounds.minLng || 0.04;
    const spanLat = bounds.maxLat - bounds.minLat || 0.04;
    const x = ((lng - bounds.minLng) / spanLng) * MAP_WIDTH;
    const y = ((bounds.maxLat - lat) / spanLat) * MAP_HEIGHT;
    return [isNaN(x) ? 0 : Math.round(x * 10) / 10, isNaN(y) ? 0 : Math.round(y * 10) / 10];
  };

  const svgPathData = useMemo(() => {
    if (!Array.isArray(routePath) || routePath.length === 0) return '';
    const validPoints = routePath.filter(
      (pt): pt is [number, number] =>
        Array.isArray(pt) &&
        pt.length >= 2 &&
        typeof pt[0] === 'number' &&
        typeof pt[1] === 'number' &&
        !isNaN(pt[0]) &&
        !isNaN(pt[1])
    );
    if (validPoints.length === 0) return '';

    const projected = validPoints.map((pt) => project(pt[0], pt[1]));
    return projected.reduce((acc, curr, idx) => {
      if (!curr || typeof curr[0] !== 'number' || typeof curr[1] !== 'number' || isNaN(curr[0]) || isNaN(curr[1])) {
        return acc;
      }
      return idx === 0 ? `M ${curr[0]} ${curr[1]}` : `${acc} L ${curr[0]} ${curr[1]}`;
    }, '');
  }, [routePath, bounds]);

  const currentCarPos = useMemo(() => {
    const hubLat = typeof hub?.lat === 'number' ? hub.lat : 22.6547;
    const hubLng = typeof hub?.lng === 'number' ? hub.lng : 88.4467;

    if (!Array.isArray(routePath) || routePath.length < 2) return project(hubLat, hubLng);

    const validPoints = routePath.filter(
      (pt): pt is [number, number] =>
        Array.isArray(pt) &&
        pt.length >= 2 &&
        typeof pt[0] === 'number' &&
        typeof pt[1] === 'number' &&
        !isNaN(pt[0]) &&
        !isNaN(pt[1])
    );

    if (validPoints.length < 2) return project(hubLat, hubLng);

    const targetIdx = Math.min(validPoints.length - 1, Math.floor(simProgress * (validPoints.length - 1)));
    const nextIdx = Math.min(validPoints.length - 1, targetIdx + 1);
    const fraction = simProgress * (validPoints.length - 1) - targetIdx;

    const p1 = validPoints[targetIdx] || validPoints[0];
    const p2 = validPoints[nextIdx] || p1;

    const currentLat = p1[0] + (p2[0] - p1[0]) * fraction;
    const currentLng = p1[1] + (p2[1] - p1[1]) * fraction;

    return project(currentLat, currentLng);
  }, [routePath, simProgress, bounds, hub]);

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const step = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setSimProgress((prev) => {
        const next = prev + dt / 18;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="relative w-full h-[500px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 select-none font-sans">
      {/* Top Map HUD overlay (Clean White Theme) */}
      <div className="absolute top-3.5 left-3.5 z-20 flex flex-wrap items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center gap-2 shadow-sm">
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-bold text-slate-900">{hub.shortCode}</span>
          <span className="text-slate-300">·</span>
          <span>{totalDistanceKm} km total</span>
          <span className="text-slate-300">·</span>
          <span className="tabular-nums font-mono font-semibold text-blue-600">~{totalDurationMins}m drive</span>
        </div>

        {showOverlapCorridor && (
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-200 text-xs text-slate-700 flex items-center gap-1.5 shadow-sm">
            <span className="font-semibold text-blue-600">{routeOverlapPercentage}% Overlap</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">+{netDetourMins}m detour</span>
          </div>
        )}
      </div>

      {/* Top Right Controls HUD */}
      <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setShowTraffic(!showTraffic)}
          title="Toggle Traffic Flow"
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
            showTraffic ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Traffic
        </button>

        <button
          type="button"
          onClick={() => setShowOverlapCorridor(!showOverlapCorridor)}
          title="Toggle Route Overlap"
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
            showOverlapCorridor ? 'bg-sky-50 text-sky-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Overlap
        </button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.min(2.2, z + 0.2))}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setZoomLevel(1);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Light-Mode SVG Cartographic Map Canvas */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full h-full"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            <pattern id="urbanGridLight" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
            </pattern>

            <linearGradient id="routeGradientBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            <radialGradient id="hubBeaconGlowBlue" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.28" />
              <stop offset="65%" stopColor="#38BDF8" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Crisp Off-White Map Background */}
          <rect width="100%" height="100%" fill="#F8FAFC" />
          <rect width="100%" height="100%" fill="url(#urbanGridLight)" />

          {/* Stylized Hooghly River (Clean Sky Blue) */}
          <path
            d="M 120 0 Q 150 140 130 260 T 170 420 T 140 540"
            fill="none"
            stroke="#DBEAFE"
            strokeWidth="34"
            strokeLinecap="round"
          />
          <path
            d="M 120 0 Q 150 140 130 260 T 170 420 T 140 540"
            fill="none"
            stroke="#93C5FD"
            strokeWidth="3"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />

          {/* Major Kolkata arterial road network */}
          <g stroke="#CBD5E1" strokeWidth="2.5" fill="none" strokeLinecap="round">
            <path d="M 220 480 C 260 380, 360 320, 480 280 S 640 180, 710 110" />
            <path d="M 460 310 C 510 240, 580 180, 680 100" />
            <path d="M 80 340 Q 180 320 280 310" />
            <path d="M 160 120 Q 420 100 680 90" />
          </g>

          {/* Traffic Flow Overlay */}
          {showTraffic && (
            <g strokeLinecap="round" strokeWidth="4" opacity="0.75">
              <path d="M 380 300 Q 440 260 520 220" stroke="#38BDF8" />
              <path d="M 520 220 Q 580 180 620 150" stroke="#F59E0B" strokeDasharray="6 3" />
              <path d="M 620 150 Q 660 120 690 95" stroke="#22C55E" />
            </g>
          )}

          {/* Route Overlap Corridor Highlight */}
          {showOverlapCorridor && svgPathData && (
            <path
              d={svgPathData}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="14"
              strokeOpacity="0.28"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Main Shared Route Line */}
          {svgPathData && (
            <g>
              <path
                d={svgPathData}
                fill="none"
                stroke="url(#routeGradientBlue)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={svgPathData}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                strokeOpacity="0.9"
              />
            </g>
          )}

          {/* Detour branch connector */}
          {Array.isArray(stops) && stops.length > 2 && typeof stops[0]?.lat === 'number' && typeof stops[1]?.lat === 'number' && (
            <g>
              {(() => {
                const s1 = project(stops[0].lat, stops[0].lng);
                const s2 = project(stops[1].lat, stops[1].lng);
                if (!s1 || !s2) return null;
                return (
                  <line
                    x1={s1[0]}
                    y1={s1[1]}
                    x2={s2[0]}
                    y2={s2[1]}
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                    opacity="0.85"
                  />
                );
              })()}
            </g>
          )}

          {/* Destination Hub Marker */}
          {(() => {
            const [hx, hy] = project(hub.lat, hub.lng);
            return (
              <g transform={`translate(${hx}, ${hy})`} className="cursor-pointer">
                <circle r="28" fill="url(#hubBeaconGlowBlue)" />
                <circle r="13" fill="#2563EB" stroke="#FFFFFF" strokeWidth="3" />
                <circle r="4.5" fill="#FFFFFF" />

                <g transform="translate(0, -24)">
                  <rect
                    x="-58"
                    y="-12"
                    width="116"
                    height="22"
                    rx="6"
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#0F172A"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {hub.shortCode} {hub.type === 'airport' ? 'AIRPORT' : 'STATION'}
                  </text>
                </g>
              </g>
            );
          })()}

          {/* Passenger Stops Markers */}
          {stops.map((stop, idx) => {
            const [sx, sy] = project(stop.lat, stop.lng);
            const isHubStop = stop.passengerId === 'all';
            if (isHubStop) return null;

            const isCurrentStop = activeStop?.id === stop.id;

            return (
              <g
                key={stop.id}
                transform={`translate(${sx}, ${sy})`}
                className="cursor-pointer group"
                onClick={() => setActiveStop(stop)}
              >
                <circle r="15" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
                <circle r="11" fill="#EFF6FF" />

                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#2563EB"
                  fontSize="10"
                  fontWeight="800"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {idx + 1}
                </text>

                <g transform="translate(0, -26)">
                  <rect
                    x="-68"
                    y="-14"
                    width="136"
                    height="22"
                    rx="6"
                    fill="#FFFFFF"
                    stroke={isCurrentStop ? '#2563EB' : '#CBD5E1'}
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    fill="#0F172A"
                    fontSize="9.5"
                    fontWeight="600"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {stop.passengerName.split(' ')[0]} ({stop.estimatedTime})
                  </text>
                </g>
              </g>
            );
          })}

          {/* Moving Simulated Cab */}
          {currentCarPos && (
            <g transform={`translate(${currentCarPos[0]}, ${currentCarPos[1]})`}>
              <circle r="16" fill="#2563EB" fillOpacity="0.18">
                <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle r="9.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
              <g transform="translate(-5, -5) scale(0.65)">
                <Car className="w-4 h-4 text-white" />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Selected Stop Details Popover */}
      {activeStop && (
        <div className="absolute bottom-16 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-lg max-w-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
                Stop {stops.findIndex((s) => s.id === activeStop.id) + 1} · {activeStop.type === 'pickup' ? 'Pickup' : 'Drop-off'}
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">{activeStop.passengerName}</h4>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{activeStop.locationName}</p>
              <div className="text-[11px] text-slate-700 font-mono mt-1 flex items-center gap-2">
                <span>ETA: {activeStop.estimatedTime}</span>
                {activeStop.detourAddedMins > 0 && (
                  <span className="text-amber-600">+{activeStop.detourAddedMins}m detour</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveStop(null)}
              className="text-slate-400 hover:text-slate-700 text-xs px-1.5 py-0.5 rounded hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Bottom Simulation & Playback Bar */}
      <div className="absolute bottom-3 inset-x-3.5 z-20 flex items-center justify-between gap-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs whitespace-nowrap"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Ride</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Route</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setSimProgress(0);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 max-w-md flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
            {Math.round(simProgress * 100)}%
          </span>
          <div className="relative flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-75"
              style={{ width: `${Math.round(simProgress * 100)}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
            {totalDurationMins}m
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-medium whitespace-nowrap">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Corridor Monitored</span>
        </div>
      </div>
    </div>
  );
};
