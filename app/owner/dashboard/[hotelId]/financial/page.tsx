"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ─── Types ─── */
interface JwtPayload { role: string; }

interface FinancialBooking {
  bookingId: string;
  guestName: string;
  guestEmail: string;
  checkInDate: string;
  nights: number;
  amount: number;
}

interface FinancialData {
  hotelName?: string;
  totalRevenue: number;
  totalBookings: number;
  averageDailyRate: number;
  bookings: FinancialBooking[];
}

interface Toast { id: number; msg: string; type: "success" | "error" | "default" }

/* ─── Helpers ─── */
function decodeToken(token: string): JwtPayload | null {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return format(new Date(d), "d MMM yyyy"); } catch { return d; }
}

function fmtMoney(n: number) {
  return `฿${n.toLocaleString()}`;
}

/* ─── Page ─── */
export default function OwnerFinancial() {
  const router = useRouter();
  const params = useParams();
  const hotelId = params.hotelId as string;

  const [hotelName, setHotelName]       = useState("");
  const [startDate, setStartDate]       = useState("");
  const [endDate, setEndDate]           = useState("");
  const [dateError, setDateError]       = useState("");
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [hasApplied, setHasApplied]     = useState(false);
  const [isApplying, setIsApplying]     = useState(false);
  const [isExporting, setIsExporting]   = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((msg: string, type: Toast["type"] = "default") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  /* ── Auth + initial hotel name ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    const decoded = decodeToken(token);
    if (!decoded || decoded.role !== "owner") { router.replace("/owner/hotels"); return; }

    const fetchHotel = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/hotels/${hotelId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.status === 403) { router.replace("/403"); return; }
        if (res.ok) {
          const data = await res.json();
          setHotelName(data.data?.name || data.name || "Hotel");
        }
      } catch { /* non-critical */ }
    };

    fetchHotel();
  }, [router, hotelId]);

  /* ── Apply filter ── */
  async function handleApply() {
    setDateError("");
    if (!startDate || !endDate) return;
    if (new Date(startDate) > new Date(endDate)) {
      setDateError("Start date cannot be after end date.");
      return;
    }

    const token = localStorage.getItem("token")!;
    setIsApplying(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/hotels/${hotelId}/financial?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 403) { router.replace("/403"); return; }
      if (!res.ok) throw new Error((await res.json()).message || "Failed to load report");

      const body = await res.json();
      const d: FinancialData = body.data || body;
      setFinancialData(d);
      if (d.hotelName) setHotelName(d.hotelName);
      setHasApplied(true);
      addToast("Report updated for selected date range.", "default");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load report.", "error");
    } finally {
      setIsApplying(false);
    }
  }

  /* ── Export CSV ── */
  async function handleExport() {
    if (!startDate || !endDate) return;
    const token = localStorage.getItem("token")!;
    setIsExporting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/hotels/${hotelId}/financial/export?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 403) { router.replace("/403"); return; }
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial_report_${hotelId}_${startDate}_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast("CSV exported successfully.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Export failed.", "error");
    } finally {
      setIsExporting(false);
    }
  }

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/owner/dashboard/${hotelId}`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 mb-3 bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏨</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {hotelName || <span className="inline-block w-40 h-6 bg-gray-200 rounded animate-pulse" />}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Financial Report</p>
            </div>
          </div>
        </div>

        {/* Date range filter */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Date Range:</span>
            <input
              type="date"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setDateError(""); setHasApplied(false); }}
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setDateError(""); setHasApplied(false); }}
            />
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!startDate || !endDate || isApplying}
            >
              {isApplying ? "Loading…" : "Apply"}
            </Button>
          </div>
          {dateError && (
            <p className="text-red-600 text-sm mt-2">{dateError}</p>
          )}
        </div>

        {/* Results — only shown after Apply */}
        {hasApplied && financialData && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
                <div className="text-sm font-medium text-gray-500 mb-1.5">Total Revenue</div>
                <div className="text-3xl font-bold text-gray-900">{fmtMoney(financialData.totalRevenue)}</div>
                <div className="text-sm text-gray-400 mt-1">for selected period</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
                <div className="text-sm font-medium text-gray-500 mb-1.5">Total Bookings</div>
                <div className="text-3xl font-bold text-gray-900">{financialData.totalBookings}</div>
                <div className="text-sm text-gray-400 mt-1">completed stays</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
                <div className="text-sm font-medium text-gray-500 mb-1.5">Average Daily Rate</div>
                <div className="text-3xl font-bold text-gray-900">{fmtMoney(financialData.averageDailyRate)}</div>
                <div className="text-sm text-gray-400 mt-1">per night</div>
              </div>
            </div>

            {/* Booking details table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <h2 className="text-base font-semibold text-gray-900">Booking Details</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  <Download className="size-4 mr-1.5" />
                  {isExporting ? "Exporting…" : "Export CSV"}
                </Button>
              </div>

              <div className="px-6 pb-6 overflow-x-auto">
                {financialData.bookings.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">
                    No bookings found for the selected date range.
                  </p>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        {["Booking ID", "Guest", "Check-In", "Nights", "Amount"].map(h => (
                          <th
                            key={h}
                            className={`text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200 py-2.5 px-3 text-left ${h === "Amount" ? "text-right" : ""}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.bookings.map((b, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                          <td className="py-3 px-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {b.bookingId}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-gray-800">{b.guestName}</div>
                            <div className="text-xs text-gray-400">{b.guestEmail}</div>
                          </td>
                          <td className="py-3 px-3 text-gray-700">{fmtDate(b.checkInDate)}</td>
                          <td className="py-3 px-3 text-gray-700">{b.nights}</td>
                          <td className="py-3 px-3 text-right font-semibold text-gray-800">
                            {fmtMoney(b.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2.5">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl text-sm text-white shadow-lg max-w-xs animate-in slide-in-from-bottom-2 duration-200 ${
              t.type === "success" ? "bg-green-600" : t.type === "error" ? "bg-red-600" : "bg-gray-800"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
