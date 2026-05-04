"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldTopology from "world-atlas/land-110m.json";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Globe,
  LocateFixed,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Zap,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Footer } from "../landing/Footer";
import { AppSidebar } from "../layout/AppSidebar";
import { DateRangeFilter } from "../shared/DateRangeFilter";
import { useAuthStore } from "../../store/auth-store";
import { deleteWebsite, fetchAlerts, fetchAlertsSummary, fetchWebsiteDetail, searchWebsites } from "../../lib/dashboard-api";
import type { Alert, AlertsSummary, Website, WebsiteTick } from "../../types/dashboard";
import { fetchCurrentUser } from "../../lib/user-api";

const AUTO_REFRESH_MS = 90_000;
const CHART_WIDTH = 760;
const CHART_HEIGHT = 260;
const CHART_PADDING = { top: 22, right: 28, bottom: 36, left: 58 };
const MAP_WIDTH = 920;
const MAP_HEIGHT = 430;
const REGION_COLORS = ["#81ECFF", "#5CFD80", "#FFB86B", "#C792EA", "#FF716C", "#6EA8FE", "#F8E16C", "#2DD4BF"];
const LINE_PATTERNS = ["", "10 7", "3 6", "14 5 4 5", "2 4", "18 8", "8 4 2 4", "12 3"];

const REGION_COORDS: Record<string, [number, number]> = {
  india: [78.96, 22.59],
  usa: [-98.58, 39.83],
  us: [-98.58, 39.83],
  america: [-98.58, 39.83],
  china: [104.2, 35.86],
  europe: [10.45, 51.17],
  uk: [-3.44, 55.38],
  germany: [10.45, 51.17],
  singapore: [103.85, 1.35],
  frankfurt: [8.68, 50.11],
  ohio: [-82.76, 40.39],
  virginia: [-78.17, 37.77],
};

const world = worldTopology as unknown as Topology;
const land = feature(world, world.objects.land as GeometryCollection) as FeatureCollection<Geometry>;
const mapProjection = geoNaturalEarth1().fitSize([MAP_WIDTH, MAP_HEIGHT], land);
const mapPath = geoPath(mapProjection);
const WORLD_MAP_PATH = mapPath(land) ?? "";

type IncidentRow = {
  id: string;
  title: string;
  detail: string;
  status: "RESOLVED" | "LOGGED";
  dateLabel: string;
  responseLabel: string;
  regionLabel: string;
};

type RegionStat = {
  id: string;
  name: string;
  color: string;
  ticks: WebsiteTick[];
  avgResponse: number;
};

type ChartSeries = {
  id: string;
  name: string;
  color: string;
  dashArray: string;
  path: string;
  points: { x: number; y: number; response: number; time: string }[];
};

type RegionalChart = {
  series: ChartSeries[];
  yTicks: number[];
  xLabels: { x: number; label: string }[];
};

function getRegionName(tick: WebsiteTick): string {
  return tick.region?.name || tick.region_id || "Unknown";
}

function getRegionKey(tick: WebsiteTick): string {
  return tick.region_id || getRegionName(tick).toLowerCase();
}

function getRegionColor(index: number): string {
  return REGION_COLORS[index % REGION_COLORS.length];
}

function getRegionMarker(regionName: string, index: number): { x: number; y: number } {
  const key = regionName.toLowerCase().replace(/[^a-z]/g, "");
  const coords = REGION_COORDS[key] ?? [((index * 47) % 320) - 160, 54 - ((index * 19) % 108)];
  const projected = mapProjection(coords);

  if (projected) {
    return {
      x: projected[0],
      y: projected[1],
    };
  }

  return {
    x: MAP_WIDTH / 2,
    y: MAP_HEIGHT / 2,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatLastUpdated(isoDate: string | null): string {
  if (!isoDate) {
    return "Not synced yet";
  }

  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatShortTime(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function toRegionalLinePath(points: { x: number; y: number }[]): string {
  if (!points.length) {
    return "";
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    const controlX = (prev.x + current.x) / 2;
    path += ` C ${controlX} ${prev.y}, ${controlX} ${current.y}, ${current.x} ${current.y}`;
  }

  return path;
}

function buildIncidents(ticks: WebsiteTick[]): IncidentRow[] {
  const source = ticks.slice(0, 5);

  if (!source.length) {
    return [];
  }

  return source.map((tick) => ({
    id: tick.id,
    title: tick.status_code === "Down" ? "Availability Alert" : "Routine Health Check",
    detail: `${tick.status_code} state recorded from monitor runner`,
    status: tick.status_code === "Down" ? "LOGGED" : "RESOLVED",
    dateLabel: formatDateLabel(tick.time_checked),
    responseLabel: `${tick.response_time_ms}ms`,
    regionLabel: tick.region?.name ?? "Unknown",
  }));
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 h-76 animate-pulse rounded-xl bg-surface-low lg:col-span-8" />
        <div className="col-span-12 space-y-6 lg:col-span-4">
          <div className="h-35 animate-pulse rounded-xl bg-surface-low" />
          <div className="h-35 animate-pulse rounded-xl bg-surface-low" />
        </div>
      </div>
      <div className="h-34 animate-pulse rounded-xl bg-surface-low" />
      <div className="h-64 animate-pulse rounded-xl bg-surface-low" />
    </div>
  );
}

function buildRegionStats(ticks: WebsiteTick[]): RegionStat[] {
  const grouped = new Map<string, { name: string; ticks: WebsiteTick[] }>();

  for (const tick of ticks) {
    const key = getRegionKey(tick);
    const current = grouped.get(key);

    if (current) {
      current.ticks.push(tick);
    } else {
      grouped.set(key, {
        name: getRegionName(tick),
        ticks: [tick],
      });
    }
  }

  return Array.from(grouped.entries()).map(([id, group], index) => {
    const avgResponse = Math.round(group.ticks.reduce((sum, tick) => sum + tick.response_time_ms, 0) / group.ticks.length);

    return {
      id,
      name: group.name,
      color: getRegionColor(index),
      ticks: group.ticks,
      avgResponse,
    };
  });
}

function buildRegionalChart(regionStats: RegionStat[]): RegionalChart {
  const values = regionStats.flatMap((region) => region.ticks.map((tick) => tick.response_time_ms));
  const rawMin = values.length ? Math.min(...values) : 0;
  const rawMax = values.length ? Math.max(...values) : 1;
  const min = Math.max(0, Math.floor((rawMin - 20) / 25) * 25);
  const max = Math.max(min + 50, Math.ceil((rawMax + 20) / 25) * 25);
  const spread = max - min || 1;
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(max - spread * ratio));
  const newestRegion = regionStats.find((region) => region.ticks.length);
  const labelSource = newestRegion ? [...newestRegion.ticks].slice(0, 18).reverse() : [];
  const xLabels = labelSource
    .filter((_, index) => index === 0 || index === Math.floor((labelSource.length - 1) / 2) || index === labelSource.length - 1)
    .map((tick, index, labels) => {
      const sourceIndex =
        labels.length === 1
          ? 0
          : index === 0
            ? 0
            : index === labels.length - 1
              ? labelSource.length - 1
              : Math.floor((labelSource.length - 1) / 2);

      return {
        x: CHART_PADDING.left + (labelSource.length > 1 ? (sourceIndex / (labelSource.length - 1)) * plotWidth : plotWidth / 2),
        label: formatShortTime(tick.time_checked),
      };
    });

  const series = regionStats.map((region, regionIndex) => {
    const source = [...region.ticks].slice(0, 18).reverse();
    const stepX = source.length > 1 ? plotWidth / (source.length - 1) : plotWidth;
    const points = source.map((tick, index) => {
      const x = CHART_PADDING.left + index * stepX;
      const y = CHART_PADDING.top + plotHeight - ((tick.response_time_ms - min) / spread) * plotHeight;

      return {
        x,
        y,
        response: tick.response_time_ms,
        time: formatDateLabel(tick.time_checked),
      };
    });

    return {
      id: region.id,
      name: region.name,
      color: region.color,
      dashArray: LINE_PATTERNS[regionIndex % LINE_PATTERNS.length],
      path: toRegionalLinePath(points),
      points,
    };
  });

  return {
    series,
    yTicks,
    xLabels,
  };
}

function GlobalRegionMap({ regions }: { regions: RegionStat[] }) {
  const mapRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const [focusedRegionId, setFocusedRegionId] = useState<string | null>(null);

  function handleZoomIn() {
    setZoom((current) => Math.min(2.6, Number((current + 0.25).toFixed(2))));
  }

  function handleZoomOut() {
    setZoom((current) => Math.max(1, Number((current - 0.25).toFixed(2))));
  }

  function handleResetMap() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setFocusedRegionId(null);
  }

  function focusRegion(region: RegionStat, index: number) {
    const nextZoom = Math.max(zoom, 1.8);
    const marker = getRegionMarker(region.name, index);
    setZoom(nextZoom);
    setPan({
      x: MAP_WIDTH / 2 - marker.x * nextZoom,
      y: MAP_HEIGHT / 2 - marker.y * nextZoom,
    });
    setFocusedRegionId(region.id);
  }

  function handleMapWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const nextZoom = clamp(zoom + (event.deltaY < 0 ? 0.16 : -0.16), 1, 2.8);
    const point = clientToMapPoint(event.clientX, event.clientY);
    const zoomRatio = nextZoom / zoom;

    setPan(
      nextZoom === 1
        ? { x: 0, y: 0 }
        : {
            x: point.x - (point.x - pan.x) * zoomRatio,
            y: point.y - (point.y - pan.y) * zoomRatio,
          },
    );
    setZoom(Number(nextZoom.toFixed(2)));
  }

  function clientToMapPoint(clientX: number, clientY: number) {
    const rect = mapRef.current?.getBoundingClientRect();

    if (!rect) {
      return { x: clientX, y: clientY };
    }

    return {
      x: ((clientX - rect.left) / rect.width) * MAP_WIDTH,
      y: ((clientY - rect.top) / rect.height) * MAP_HEIGHT,
    };
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    const point = clientToMapPoint(event.clientX, event.clientY);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({
      pointerId: event.pointerId,
      x: point.x,
      y: point.y,
      panX: pan.x,
      panY: pan.y,
    });
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!dragStart) {
      return;
    }

    const point = clientToMapPoint(event.clientX, event.clientY);
    setPan({
      x: dragStart.panX + (point.x - dragStart.x),
      y: dragStart.panY + (point.y - dragStart.y),
    });
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (dragStart?.pointerId === event.pointerId) {
      setDragStart(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl bg-surface-low p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Global Monitoring Map</p>
          <h3 className="mt-2 font-display text-3xl font-bold text-on-surface">Regional response nodes</h3>
        </div>
        <span className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-primary">
          {regions.length || 0} active regions
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.65fr_0.85fr]">
        <div className="relative h-80 overflow-hidden rounded-lg border border-surface-highest/40 bg-surface-dim sm:h-96">
          <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-surface-highest/50 bg-surface-low/90 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
          <button
            type="button"
            onClick={handleZoomOut}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-highest/60 bg-surface-high text-on-surface transition-colors hover:border-primary/40 hover:text-primary"
            aria-label="Zoom map out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-14 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-center text-xs font-bold text-primary">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-highest/60 bg-surface-high text-on-surface transition-colors hover:border-primary/40 hover:text-primary"
            aria-label="Zoom map in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleResetMap}
            className="inline-flex items-center gap-2 rounded-md border border-surface-highest/60 bg-surface-high px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface transition-colors hover:border-primary/40 hover:text-primary"
          >
            <LocateFixed className="h-4 w-4" />
            Reset
          </button>
          </div>

          <svg
            ref={mapRef}
            className={`h-full w-full ${dragStart ? "cursor-grabbing" : "cursor-grab"}`}
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            role="img"
            aria-label="World map of monitoring regions"
            onWheel={handleMapWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#0b0e14" />
            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`} style={{ transition: dragStart ? "none" : "transform 180ms ease" }}>
              <path d={WORLD_MAP_PATH} fill="#1c2028" stroke="rgba(161,168,184,0.22)" strokeWidth="0.75" vectorEffect="non-scaling-stroke" />
              {regions.map((region, index) => {
                const marker = getRegionMarker(region.name, index);
                const isFocused = focusedRegionId === region.id;

                return (
                  <g
                    key={region.id}
                    transform={`translate(${marker.x} ${marker.y})`}
                    onClick={() => {
                      focusRegion(region, index);
                    }}
                    className="cursor-pointer"
                  >
                    <circle r={isFocused ? "22" : "16"} fill={region.color} opacity={isFocused ? "0.28" : "0.16"} />
                    <circle r={isFocused ? "8" : "6"} fill={region.color} stroke="#0b0e14" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                    <text x="12" y="-10" fill="#ecedf6" fontSize="13" fontWeight="700" transform={`scale(${1 / zoom})`}>
                      {region.name}
                    </text>
                    <text x="12" y="7" fill="#a1a8b8" fontSize="12" fontWeight="600" transform={`scale(${1 / zoom})`}>
                      {region.avgResponse}ms
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {!regions.length ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-on-surface-variant">
              Start regional workers to populate the global map.
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {regions.map((region) => (
            <button
              key={region.id}
              type="button"
              onClick={() => {
                focusRegion(region, regions.findIndex((item) => item.id === region.id));
              }}
              className={`block w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                focusedRegionId === region.id
                  ? "border-primary/50 bg-primary/10"
                  : "border-surface-highest/40 bg-surface-high hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-on-surface">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: region.color }} />
                  <span className="truncate">{region.name}</span>
                </span>
                <span className="font-display text-xl font-bold text-primary">{region.avgResponse}ms</span>
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">{region.ticks.length} checks recorded from this node</p>
            </button>
          ))}

          {!regions.length ? (
            <div className="rounded-lg border border-surface-highest/40 bg-surface-high px-4 py-5 text-sm text-on-surface-variant">
              No regional nodes have reported yet.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function WebsiteDetailPortal() {
  const params = useParams<{ websiteId: string }>();
  const websiteId = params?.websiteId;

  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  const [website, setWebsite] = useState<Website | null>(null);
  const [username, setUsername] = useState("");
  const [ticks, setTicks] = useState<WebsiteTick[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsSummary, setAlertsSummary] = useState<AlertsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Website[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState("all");
  const [incidentRegionId, setIncidentRegionId] = useState("all");
  const [hoveredSeriesId, setHoveredSeriesId] = useState<string | null>(null);
  const [pinnedSeriesId, setPinnedSeriesId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const previousTopTickId = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/sign");
    }
  }, [router, token]);

  const loadWebsiteDetail = useCallback(
    async (mode: "initial" | "manual" | "poll" = "initial") => {
      if (!token || !websiteId) {
        return;
      }

      try {
        if (mode === "initial") {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        setError("");

        const shouldFetchUser = !username;
        const [detail, currentUser, alertItems, alertSummary] = await Promise.all([
          fetchWebsiteDetail(token, websiteId),
          shouldFetchUser ? fetchCurrentUser(token) : Promise.resolve(null),
          fetchAlerts(token).catch(() => []),
          fetchAlertsSummary(token).catch(() => null),
        ]);

        const incomingTopTickId = detail.ticks[0]?.id ?? null;
        const hasNewResults =
          mode !== "initial" &&
          previousTopTickId.current !== null &&
          incomingTopTickId !== null &&
          incomingTopTickId !== previousTopTickId.current;

        setWebsite(detail.website);
        setTicks(detail.ticks);
        setAlerts(alertItems.filter((alert) => alert.website_id === websiteId));
        setAlertsSummary(alertSummary);

        if (currentUser) {
          setUsername(currentUser.username);
        }

        previousTopTickId.current = incomingTopTickId;
        setLastUpdatedAt(new Date().toISOString());

        if (mode === "manual") {
          setMessage(hasNewResults ? "Refreshed. New check results are now visible." : "Refreshed. No new check results yet.");
        } else if (mode === "poll" && hasNewResults) {
          setMessage("New monitoring results arrived just now.");
        }
      } catch (loadError) {
        const loadMessage = loadError instanceof Error ? loadError.message : "Failed to load website detail";
        setError(loadMessage);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, websiteId, username],
  );

  useEffect(() => {
    void loadWebsiteDetail("initial");
  }, [loadWebsiteDetail]);

  useEffect(() => {
    if (!token || !websiteId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadWebsiteDetail("poll");
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [loadWebsiteDetail, token, websiteId]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => setMessage(""), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    async function runSearch() {
      if (!token || !searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const results = await searchWebsites(token, searchQuery);
        setSearchResults(results.slice(0, 6));
      } catch {
        setSearchResults([]);
      }
    }

    const timeoutId = window.setTimeout(() => {
      void runSearch();
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, token]);

  const filteredTicks = useMemo(() => {
    const fromTime = fromDate ? new Date(fromDate).getTime() : Number.NEGATIVE_INFINITY;
    const toTime = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;

    return ticks.filter((tick) => {
      const checkedAt = new Date(tick.time_checked).getTime();
      return checkedAt >= fromTime && checkedAt <= toTime;
    });
  }, [fromDate, toDate, ticks]);

  const regionStats = useMemo(() => buildRegionStats(ticks), [ticks]);
  const regionalChart = useMemo(() => buildRegionalChart(regionStats), [regionStats]);
  const selectedRegion = useMemo(
    () => regionStats.find((region) => region.id === selectedRegionId) ?? null,
    [regionStats, selectedRegionId],
  );
  const incidentTicks = useMemo(
    () => filteredTicks.filter((tick) => incidentRegionId === "all" || getRegionKey(tick) === incidentRegionId),
    [filteredTicks, incidentRegionId],
  );
  const filteredIncidents = useMemo(() => buildIncidents(incidentTicks), [incidentTicks]);
  const activeSeriesId = pinnedSeriesId ?? hoveredSeriesId;
  const latestAlerts = useMemo(() => alerts.slice(0, 3), [alerts]);

  useEffect(() => {
    if (selectedRegionId === "all") {
      return;
    }

    if (!regionStats.some((region) => region.id === selectedRegionId)) {
      setSelectedRegionId("all");
    }
  }, [regionStats, selectedRegionId]);

  useEffect(() => {
    if (incidentRegionId === "all") {
      return;
    }

    if (!regionStats.some((region) => region.id === incidentRegionId)) {
      setIncidentRegionId("all");
    }
  }, [incidentRegionId, regionStats]);

  const metrics = useMemo(() => {
    const total = ticks.length;
    const upCount = ticks.filter((tick) => tick.status_code === "Up").length;
    const uptime = total ? Math.round((upCount / total) * 100) : 100;

    const allAvgResponse = total ? Math.round(ticks.reduce((sum, tick) => sum + tick.response_time_ms, 0) / total) : 0;
    const avgResponse = selectedRegion?.avgResponse ?? allAvgResponse;

    const uniqueRegions = regionStats.length;

    const firstHalf = ticks.slice(Math.floor(total / 2));
    const secondHalf = ticks.slice(0, Math.floor(total / 2));
    const firstAvg = firstHalf.length
      ? firstHalf.reduce((sum, tick) => sum + tick.response_time_ms, 0) / firstHalf.length
      : avgResponse;
    const secondAvg = secondHalf.length
      ? secondHalf.reduce((sum, tick) => sum + tick.response_time_ms, 0) / secondHalf.length
      : avgResponse;

    const trend = firstAvg ? Math.round(((firstAvg - secondAvg) / firstAvg) * 100) : 0;

    return {
      uptime,
      avgResponse,
      nodeCount: uniqueRegions || 1,
      trend,
      isOperational: ticks[0]?.status_code !== "Down",
    };
  }, [regionStats.length, selectedRegion, ticks]);

  async function handleLogout() {
    await logout();
    router.replace("/sign");
  }

  async function handleDeleteWebsite() {
    if (!token || !websiteId) {
      return;
    }

    const confirmed = window.confirm("Delete this monitor and all its ticks?");
    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteWebsite(token, websiteId);
      router.replace("/dashboard");
    } catch (deleteError) {
      const deleteMessage = deleteError instanceof Error ? deleteError.message : "Failed to delete website";
      setError(deleteMessage);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleOpenAlerts() {
    router.push("/alerts");
  }

  return (
    <main className="min-h-screen bg-surface-dim text-on-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-425">
        <AppSidebar
          active="monitors"
          onAddMonitor={() => router.push("/dashboard")}
          onLogout={handleLogout}
          onNavigate={(href) => router.push(href)}
        />

        <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
          <header className="sticky top-0 z-30 flex w-full flex-col gap-4 bg-surface-dim px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="text-on-surface-variant transition-colors hover:text-primary"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-primary">{website?.url ?? "Website"}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${metrics.isOperational ? "bg-secondary pulse-ring" : "bg-error pulse-ring-error"}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${metrics.isOperational ? "text-secondary" : "text-error"}`}>
                    {metrics.isOperational ? "Operational" : "Degraded"}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70">Owner: {username || "Unknown"}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70">
                    Last Sync: {formatLastUpdated(lastUpdatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:gap-4">
              <div className="relative hidden items-center gap-3 rounded-md bg-surface-high px-4 py-2 lg:flex">
                <Search className="h-4 w-4 text-on-surface-variant" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-48 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                  placeholder="Quick Search..."
                />

                {searchResults.length ? (
                  <div className="absolute left-0 top-12 z-40 w-full rounded-md border border-surface-highest/30 bg-surface-high p-2 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults([]);
                          router.push(`/dashboard/website/${item.id}`);
                        }}
                        className="block w-full rounded px-2 py-2 text-left text-xs text-on-surface-variant transition-colors hover:bg-surface-base hover:text-on-surface"
                      >
                        {item.url}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => void loadWebsiteDetail("manual")}
                disabled={isLoading || isRefreshing}
                className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                onClick={handleDeleteWebsite}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-md border border-error/30 bg-error/10 px-4 py-2 text-sm font-bold text-error transition-colors hover:bg-error/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </header>

          <div className="space-y-8 p-4 sm:p-6 lg:p-8">
            {message ? <div className="rounded-lg bg-primary/12 px-4 py-2 text-sm font-medium text-primary">{message}</div> : null}
            {error ? <div className="rounded-xl bg-error/15 px-4 py-3 text-sm text-error">{error}</div> : null}

            {!isLoading ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-high/40 bg-surface-low px-4 py-3 text-sm">
                <span className="text-on-surface-variant">
                  Auto refresh runs every <span className="font-semibold text-on-surface">1.5 minutes</span>.
                </span>
                <span className="text-on-surface-variant">
                  Latest tick count: <span className="font-semibold text-on-surface">{ticks.length}</span>
                </span>
              </div>
            ) : null}

            {isLoading ? (
              <DetailSkeleton />
            ) : (
              <>
                <div className="grid grid-cols-12 gap-6">
                  <div className="relative col-span-12 overflow-hidden rounded-xl bg-surface-low p-6 sm:p-8 lg:col-span-8">
                    <div className="relative z-10">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Regional Response Timeline</p>
                          <h3 className="font-display text-4xl font-extrabold leading-tight text-on-surface sm:text-5xl">
                            {metrics.uptime}% <span className="text-2xl font-light text-primary">Uptime</span>
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {regionStats.length ? (
                            regionStats.map((region) => (
                              <button
                                key={region.id}
                                type="button"
                                onMouseEnter={() => setHoveredSeriesId(region.id)}
                                onMouseLeave={() => setHoveredSeriesId(null)}
                                onFocus={() => setHoveredSeriesId(region.id)}
                                onBlur={() => setHoveredSeriesId(null)}
                                onClick={() => setPinnedSeriesId((current) => (current === region.id ? null : region.id))}
                                className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                  activeSeriesId === region.id
                                    ? "border-primary/40 bg-primary/10 text-on-surface"
                                    : "border-transparent text-on-surface-variant hover:border-surface-highest/50 hover:text-on-surface"
                                }`}
                                title="Hover or click to isolate this line"
                              >
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: region.color }} />
                                {region.name}
                              </button>
                            ))
                          ) : (
                            <span className="text-xs text-on-surface-variant">Waiting for regional ticks</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-8 h-80 overflow-hidden rounded-lg border border-surface-high/50 bg-surface-dim/50 p-3">
                        {regionalChart.series.length ? (
                          <svg className="h-full w-full" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label="Response time by region">
                            <line
                              x1={CHART_PADDING.left}
                              x2={CHART_PADDING.left}
                              y1={CHART_PADDING.top}
                              y2={CHART_HEIGHT - CHART_PADDING.bottom}
                              stroke="rgba(161,168,184,0.32)"
                              strokeWidth="1"
                              vectorEffect="non-scaling-stroke"
                            />
                            <line
                              x1={CHART_PADDING.left}
                              x2={CHART_WIDTH - CHART_PADDING.right}
                              y1={CHART_HEIGHT - CHART_PADDING.bottom}
                              y2={CHART_HEIGHT - CHART_PADDING.bottom}
                              stroke="rgba(161,168,184,0.32)"
                              strokeWidth="1"
                              vectorEffect="non-scaling-stroke"
                            />

                            {regionalChart.yTicks.map((tick, index) => {
                              const y =
                                CHART_PADDING.top +
                                index * ((CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) / (regionalChart.yTicks.length - 1));

                              return (
                                <g key={tick}>
                                  <line
                                    x1={CHART_PADDING.left}
                                    x2={CHART_WIDTH - CHART_PADDING.right}
                                    y1={y}
                                    y2={y}
                                    stroke="rgba(161,168,184,0.12)"
                                    strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                  />
                                  <text x={CHART_PADDING.left - 10} y={y + 4} textAnchor="end" fill="#a1a8b8" fontSize="11" fontWeight="700">
                                    {tick}ms
                                  </text>
                                </g>
                              );
                            })}

                            {regionalChart.xLabels.map((label) => (
                              <text key={`${label.x}-${label.label}`} x={label.x} y={CHART_HEIGHT - 10} textAnchor="middle" fill="#a1a8b8" fontSize="11" fontWeight="700">
                                {label.label}
                              </text>
                            ))}

                            {regionalChart.series.map((series) => (
                              <g
                                key={series.id}
                                onMouseEnter={() => setHoveredSeriesId(series.id)}
                                onMouseLeave={() => setHoveredSeriesId(null)}
                                onFocus={() => setHoveredSeriesId(series.id)}
                                onBlur={() => setHoveredSeriesId(null)}
                                tabIndex={0}
                              >
                                <path
                                  d={series.path}
                                  fill="none"
                                  stroke={series.color}
                                  strokeWidth={activeSeriesId === series.id ? "5.5" : "3.5"}
                                  strokeDasharray={series.dashArray || undefined}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  opacity={!activeSeriesId || activeSeriesId === series.id ? 1 : 0.2}
                                  vectorEffect="non-scaling-stroke"
                                  style={{
                                    filter: activeSeriesId === series.id ? `drop-shadow(0 0 10px ${series.color})` : `drop-shadow(0 0 5px ${series.color}55)`,
                                    transition: "opacity 160ms ease, stroke-width 160ms ease",
                                  }}
                                />
                                <path
                                  d={series.path}
                                  fill="none"
                                  stroke="transparent"
                                  strokeWidth="18"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  vectorEffect="non-scaling-stroke"
                                  className="cursor-crosshair"
                                >
                                  <title>{`${series.name}: latest ${series.points.at(-1)?.response ?? 0}ms`}</title>
                                </path>

                                {activeSeriesId === series.id
                                  ? series.points.slice(-1).map((point) => (
                                      <g key={`${series.id}-hover-label`} transform={`translate(${Math.min(point.x + 10, CHART_WIDTH - 154)} ${Math.max(point.y - 28, 10)})`}>
                                        <circle cx="-10" cy="12" r="5" fill={series.color} stroke="#10131a" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                                        <rect width="144" height="40" rx="7" fill="#10131a" stroke={series.color} strokeOpacity="0.72" />
                                        <text x="12" y="16" fill="#ecedf6" fontSize="12" fontWeight="800">
                                          {series.name}
                                        </text>
                                        <text x="12" y="31" fill="#a1a8b8" fontSize="11" fontWeight="700">
                                          {point.response}ms latest
                                        </text>
                                      </g>
                                    ))
                                  : null}
                              </g>
                            ))}
                          </svg>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                            Regional response lines will appear after workers write ticks.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
                    <div className="flex-1 rounded-xl bg-surface-high p-8">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Avg Response</span>
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <label className="relative mt-5 block">
                        <select
                          value={selectedRegionId}
                          onChange={(event) => setSelectedRegionId(event.target.value)}
                          className="w-full appearance-none rounded-md border border-surface-highest/60 bg-surface-dim px-3 py-2 pr-9 text-sm font-semibold text-on-surface outline-none transition-colors hover:border-primary/40"
                          aria-label="Choose response region"
                        >
                          <option value="all">All regions</option>
                          {regionStats.map((region) => (
                            <option key={region.id} value={region.id}>
                              {region.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                      </label>
                      <div className="mt-7">
                        <span className="font-display text-6xl font-extrabold text-on-surface">{metrics.avgResponse}</span>
                        <span className="ml-1 text-2xl font-bold text-primary">ms</span>
                        <p className="mt-2 text-xs font-medium text-on-surface-variant">
                          {selectedRegion ? `${selectedRegion.name} average from ${selectedRegion.ticks.length} checks` : `All-region average from ${ticks.length} checks`}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-secondary">
                          <ChevronRight className={`h-3 w-3 ${metrics.trend <= 0 ? "rotate-90" : "-rotate-90"}`} />
                          {Math.abs(metrics.trend)}% {metrics.trend <= 0 ? "faster" : "slower"} than last week
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 rounded-xl bg-surface-high p-8">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Global Availability</span>
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div className="mt-7">
                        <span className="font-display text-6xl font-extrabold text-on-surface">{metrics.nodeCount}</span>
                        <span className="ml-1 text-2xl font-bold text-primary">Nodes</span>
                        <p className="mt-2 text-xs font-medium text-on-surface-variant">Active monitoring regions</p>
                      </div>
                    </div>
                  </div>
                </div>

                <section className="relative overflow-hidden rounded-xl bg-surface-low p-8">
                  <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Alerts & Notifications</p>
                      <h3 className="mt-2 font-display text-3xl font-bold text-on-surface">
                        {alerts.length ? `${alerts.length} active alert${alerts.length === 1 ? "" : "s"}` : "No active alerts"}
                      </h3>
                      <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
                        {alerts.length
                          ? "Current availability alerts reported by regional workers for this monitor."
                          : "This monitor has no Down checks in the active alert feed."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAlerts}
                      className="rounded-md border border-primary/20 bg-primary/10 px-5 py-2 text-xs font-black uppercase tracking-[0.22em] text-primary transition-colors hover:bg-primary/20"
                    >
                      View Alerts
                    </button>
                  </div>

                  <div className="relative z-10 mt-6 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
                    <div className="rounded-lg border border-surface-highest/40 bg-surface-dim p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Last 24h Alerts</span>
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <p className="mt-4 font-display text-5xl font-extrabold text-on-surface">{alertsSummary?.active_alerts ?? alerts.length}</p>
                      <p className="mt-2 text-xs text-on-surface-variant">Across all monitors for this account</p>
                    </div>

                    <div className="space-y-3">
                      {latestAlerts.map((alert) => (
                        <div key={alert.id} className="grid gap-3 rounded-lg border border-error/20 bg-error/10 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-error/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-error">
                                {alert.status}
                              </span>
                              <span className="text-xs font-semibold text-on-surface-variant">{formatDateLabel(alert.time_checked)}</span>
                            </div>
                            <p className="mt-2 truncate text-sm font-bold text-on-surface">{alert.message}</p>
                            <p className="mt-1 text-xs text-on-surface-variant">{alert.region} region detected degraded availability</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-display text-2xl font-bold text-error">{alert.response_time_ms}ms</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Response</p>
                          </div>
                        </div>
                      ))}

                      {!latestAlerts.length ? (
                        <div className="rounded-lg border border-secondary/20 bg-secondary/10 px-4 py-5 text-sm text-on-surface-variant">
                          All reporting regions are currently healthy for this monitor.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-bold uppercase tracking-widest text-on-surface">Recent Incident History</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Showing newest results first
                    </span>
                  </div>

                  <DateRangeFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                  />

                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-surface-high/40 bg-surface-low px-4 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Region Logs</span>
                    <label className="relative min-w-48">
                      <select
                        value={incidentRegionId}
                        onChange={(event) => setIncidentRegionId(event.target.value)}
                        className="w-full appearance-none rounded-md border border-surface-highest/60 bg-surface-dim px-3 py-2 pr-9 text-sm font-semibold text-on-surface outline-none transition-colors hover:border-primary/40"
                        aria-label="Filter incident history by region"
                      >
                        <option value="all">All regions</option>
                        {regionStats.map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    </label>
                    <span className="text-xs text-on-surface-variant">
                      Showing {filteredIncidents.length} logs from {incidentRegionId === "all" ? "all regions" : regionStats.find((region) => region.id === incidentRegionId)?.name}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="hidden grid-cols-12 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 md:grid">
                      <div className="col-span-4">Event</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Date</div>
                      <div className="col-span-2">Response</div>
                      <div className="col-span-2">Region</div>
                    </div>

                    {filteredIncidents.map((incident) => {
                      const resolved = incident.status === "RESOLVED";

                      return (
                        <div
                          key={incident.id}
                          className="grid grid-cols-1 items-center rounded-xl bg-surface-low px-6 py-5 transition-colors hover:bg-surface-base md:grid-cols-12"
                        >
                          <div className="col-span-4 flex items-center gap-4">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                resolved ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"
                              }`}
                            >
                              {resolved ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-on-surface">{incident.title}</h4>
                              <p className="text-xs text-on-surface-variant">{incident.detail}</p>
                            </div>
                          </div>

                          <div className="col-span-2 mt-4 md:mt-0">
                            <span
                              className={`rounded px-3 py-1 text-[10px] font-bold ${
                                resolved
                                  ? "border border-secondary/20 bg-secondary/10 text-secondary"
                                  : "border border-error/20 bg-error/10 text-error"
                              }`}
                            >
                              {incident.status}
                            </span>
                          </div>

                          <div className="col-span-2 mt-2 text-sm text-on-surface-variant md:mt-0">{incident.dateLabel}</div>
                          <div className="col-span-2 mt-2 text-sm font-semibold text-on-surface md:mt-0">{incident.responseLabel}</div>
                          <div className="col-span-2 mt-2 text-sm text-on-surface-variant md:mt-0">{incident.regionLabel}</div>
                        </div>
                      );
                    })}

                    {!filteredIncidents.length ? (
                      <div className="rounded-xl bg-surface-low px-6 py-5 text-sm text-on-surface-variant">
                        No incidents in the selected date range.
                      </div>
                    ) : null}
                  </div>
                </section>

                <GlobalRegionMap regions={regionStats} />
              </>
            )}
          </div>

          <div className="px-6 pb-6 sm:px-8">
            <Footer className="mt-4 border-surface-high/30" />
          </div>
        </div>
      </div>
    </main>
  );
}
