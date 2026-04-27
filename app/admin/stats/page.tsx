"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BarChart2, Building2, Users, CalendarCheck, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

// Shape of each hotel entry inside data.hotelStats
interface HotelStat {
  _id: string;
  name: string;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  monthlyBookings: number[]; // 12-element array indexed Jan–Dec
  roomTypeOccupancy: {
    type: string;
    label: string;
    count: number;
    rate: number; // percentage of total bookings
  }[];
}

// Shape of platform-wide stats from backend
interface PlatformStats {
  users: { total: number; owners: number };
  hotels: { total: number };
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    totalRevenue: number;
  };
}

// Shape of GET /api/v1/hotels/admin/dashboard response
interface DashboardResponse {
  success: boolean;
  data: {
    platformStats: PlatformStats;
    hotelStats: HotelStat[];
    recentActivity: object[];
  };
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function BarChartSVG({ data, highlight }: { data: number[]; highlight: number | null }) {
  const max = Math.max(...data, 1);
  const W = 660, H = 160, bW = 36;
  const gap = (W - 48 - data.length * bW) / (data.length - 1);
  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} style={{ width: "100%", height: "auto" }}>
      {data.map((v, i) => {
        const x  = 24 + i * (bW + gap);
        const bh = (v / max) * H;
        const y  = H - bh;
        const isHl = highlight !== null && highlight === i;
        const fill = isHl ? "#f59e0b" : highlight !== null ? "#bfdbfe" : "#2563eb";
        return (
          <g key={i}>
            <rect x={x} y={y} width={bW} height={bh} rx="4" fill={fill} opacity={v > 0 ? 0.9 : 0.15} />
            {v > 0 && (
              <text
                x={x + bW / 2}
                y={bh >= 20 ? y + bh / 2 + 4 : y - 5}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill={bh >= 20 ? "#ffffff" : "#4b5563"}
              >
                {v}
              </text>
            )}
            <text x={x + bW / 2} y={H + 20} textAnchor="middle" fontSize="10" fill="#9ca3af">
              {MONTHS_SHORT[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function fmtMoney(n: number) {
  return `฿${n.toLocaleString()}`;
}

// Aggregate all hotel stats into a single "All Hotels" summary
function aggregate(stats: HotelStat[]): Omit<HotelStat, "_id" | "name"> {
  return stats.reduce(
    (acc, h) => ({
      totalBookings:   acc.totalBookings  + h.totalBookings,
      totalRevenue:    acc.totalRevenue   + h.totalRevenue,
      pendingBookings: acc.pendingBookings + h.pendingBookings,
      monthlyBookings: acc.monthlyBookings.map((v, i) => v + (h.monthlyBookings[i] ?? 0)),
      roomTypeOccupancy: acc.roomTypeOccupancy.map((r, i) => ({
        ...r,
        count: r.count + (h.roomTypeOccupancy?.[i]?.count ?? 0),
      })).map((r) => ({
        ...r,
        rate: acc.totalBookings + h.totalBookings > 0
          ? Math.round((r.count / (acc.totalBookings + h.totalBookings)) * 100)
          : 0,
      })),
    }),
    {
      totalBookings: 0,
      totalRevenue: 0,
      pendingBookings: 0,
      monthlyBookings: Array<number>(12).fill(0),
      roomTypeOccupancy: [
        { type: "standard", label: "Standard Room", count: 0, rate: 0 },
        { type: "deluxe",   label: "Deluxe Room",   count: 0, rate: 0 },
        { type: "suite",    label: "Suite Room",    count: 0, rate: 0 },
      ],
    }
  );
}

export default function AdminStats() {
  const router = useRouter();
  const [hotelStats,     setHotelStats]     = useState<HotelStat[]>([]);
  const [platformStats,  setPlatformStats]  = useState<PlatformStats | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [error,          setError]          = useState("");
  const [selectedHotel,  setSelectedHotel]  = useState<string>("all");
  const [selectedMonth,  setSelectedMonth]  = useState<number>(-1);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setIsLoading(true);
    setError("");
    try {
      // GET /api/v1/hotels/admin/dashboard — returns platformStats + hotelStats[]
      const res: DashboardResponse = await apiRequest("/hotels/admin/dashboard");
      setHotelStats(res.data.hotelStats || []);
      setPlatformStats(res.data.platformStats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard stats");
    } finally {
      setIsLoading(false);
    }
  }

  // Pick the data slice based on the hotel selector
  const current: Omit<HotelStat, "_id" | "name"> =
    selectedHotel === "all"
      ? aggregate(hotelStats)
      : hotelStats.find((h) => h._id === selectedHotel) ?? aggregate(hotelStats);

  const { totalBookings, totalRevenue, pendingBookings, monthlyBookings } = current;

  const selMonthCount = selectedMonth >= 0 ? monthlyBookings[selectedMonth] : null;

  const selectedHotelName =
    selectedHotel === "all"
      ? "All Hotels"
      : hotelStats.find((h) => h._id === selectedHotel)?.name ?? "Hotel";

  const isAllHotels = selectedHotel === "all";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Back */}
        <Button variant="ghost" size="sm" className="text-gray-500 -ml-2" onClick={() => router.push("/admin")}>
          <ArrowLeft className="size-4 mr-1" />
          Back to Admin
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BarChart2 className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selectedHotelName}</h1>
              <p className="text-sm text-gray-500">Booking Statistics</p>
            </div>
          </div>
          <Select
            value={selectedHotel}
            onValueChange={(v) => { setSelectedHotel(v); setSelectedMonth(-1); }}
          >
            <SelectTrigger className="w-56 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hotels</SelectItem>
              {hotelStats.map((h) => (
                <SelectItem key={h._id} value={h._id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
        )}

        {/* Platform-wide summary — only shown when "All Hotels" is selected */}
        {isAllHotels && platformStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="size-4 text-blue-500" />
                  <p className="text-xs text-gray-500">Total Users</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoading ? "—" : platformStats.users.total}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {platformStats.users.owners} owner{platformStats.users.owners !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="size-4 text-indigo-500" />
                  <p className="text-xs text-gray-500">Total Hotels</p>
                </div>
                <p className="text-2xl font-bold text-indigo-600">
                  {isLoading ? "—" : platformStats.hotels.total}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">registered</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarCheck className="size-4 text-green-500" />
                  <p className="text-xs text-gray-500">Confirmed</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? "—" : platformStats.bookings.confirmed}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">of {platformStats.bookings.total} total</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-400">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="size-4 text-red-400" />
                  <p className="text-xs text-gray-500">Cancelled</p>
                </div>
                <p className="text-2xl font-bold text-red-500">
                  {isLoading ? "—" : platformStats.bookings.cancelled}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">bookings</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Per-hotel / aggregate stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">
                {isLoading ? "—" : totalBookings}
              </p>
              <p className="text-xs text-gray-400 mt-1">reservations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-1">Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                {isLoading ? "—" : fmtMoney(totalRevenue)}
              </p>
              <p className="text-xs text-gray-400 mt-1">paid bookings only</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-1">Pending Bookings</p>
              <p className="text-3xl font-bold text-amber-500">
                {isLoading ? "—" : pendingBookings}
              </p>
              <p className="text-xs text-gray-400 mt-1">awaiting action</p>
            </CardContent>
          </Card>
        </div>

        {/* Room Type Occupancy */}
        <Card>
          <CardHeader className="pb-2">
            <p className="font-semibold text-gray-800">Room Type Occupancy</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : current.roomTypeOccupancy && current.roomTypeOccupancy.length > 0 && current.totalBookings > 0 ? (
              current.roomTypeOccupancy.map((r) => {
                const color = r.type === "standard" ? "bg-blue-500" : r.type === "deluxe" ? "bg-indigo-500" : "bg-purple-500";
                const textColor = r.type === "standard" ? "text-blue-600" : r.type === "deluxe" ? "text-indigo-600" : "text-purple-600";
                return (
                  <div key={r.type} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700">{r.label}</span>
                      <span className={`font-semibold ${textColor}`}>{r.count} bookings ({r.rate}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`${color} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${r.rate}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                {current.totalBookings === 0
                  ? "No bookings yet — occupancy data will appear once bookings are made."
                  : "No room type data — bookings were made before room types were tracked."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 pb-2">
            <p className="font-semibold text-gray-800">Monthly Booking Trend</p>
            <Select
              value={String(selectedMonth)}
              onValueChange={(v) => setSelectedMonth(Number(v))}
            >
              <SelectTrigger className="w-44 bg-white">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">All Months</SelectItem>
                {MONTHS_FULL.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-40 bg-gray-100 rounded animate-pulse" />
            ) : (
              <BarChartSVG
                data={monthlyBookings}
                highlight={selectedMonth >= 0 ? selectedMonth : null}
              />
            )}

            {selMonthCount !== null && (
              <div className="text-center mt-2">
                <span className="bg-amber-100 text-amber-800 rounded-md px-3 py-1 text-sm font-semibold">
                  {MONTHS_FULL[selectedMonth]}: {selMonthCount} booking{selMonthCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-3">
              Grouped by check-in date — showing total bookings per month.
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
