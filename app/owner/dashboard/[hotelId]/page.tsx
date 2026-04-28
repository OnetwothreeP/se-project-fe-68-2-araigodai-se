"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft } from "lucide-react";

/* ─── Types ─── */
interface JwtPayload { role: string; name?: string; }

interface DashboardData {
  totalBookings: number;
  confirmedBookings?: number;
  cancelledBookings?: number;
  totalRevenue: number;
  pendingRequestsCount?: number;
  monthlyBookings?: number[];
  hotelName?: string;
  hotel?: { name?: string };
}

interface BookingRequest {
  _id: string;
  type: "edit" | "delete";
  status: string;
  newCheckInDate?: string;
  newNumberOfNights?: number;
  createdAt: string;
  booking: {
    _id: string;
    checkInDate: string;
    numberOfNights: number;
    user?: { name?: string };
  };
  requestedBy?: { name?: string };
}

interface HotelBooking {
  _id: string;
  checkInDate: string;
  numberOfNights: number;
  status: string;
  totalPrice?: number;
  paymentStatus?: string;
  roomType?: string;
  user?: { name?: string; email?: string };
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

function shortId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ─── Main Page ─── */
export default function OwnerDashboard() {
  const router = useRouter();
  const params = useParams();
  const hotelId = params.hotelId as string;

  const [hotelName, setHotelName] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  /* Toasts */
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((msg: string, type: Toast["type"] = "default") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  /* Approve/Reject dialogs */
  const [confirmApprove, setConfirmApprove] = useState<BookingRequest | null>(null);
  const [confirmReject, setConfirmReject]   = useState<BookingRequest | null>(null);

  /* Cancel booking dialogs */
  const [cancelDialog, setCancelDialog]   = useState<HotelBooking | null>(null);
  const [cancelReason, setCancelReason]   = useState("");
  const [cancelReasonErr, setCancelReasonErr] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState<{ booking: HotelBooking; reason: string } | null>(null);

  /* Edit booking dialog */
  const [editDialog, setEditDialog]     = useState<HotelBooking | null>(null);
  const [editForm, setEditForm]         = useState({ checkInDate: "", numberOfNights: "" });
  const [editConflict, setEditConflict] = useState(false);
  const [editSaving, setEditSaving]     = useState(false);

  /* Auth + data load */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    const decoded = decodeToken(token);
    if (!decoded || decoded.role !== "owner") { router.replace("/owner/hotels"); return; }

    const headers = { Authorization: `Bearer ${token}` };
    const base = process.env.NEXT_PUBLIC_API_URL;

    const load = async () => {
      try {
        const [dashRes, reqRes, bkRes] = await Promise.all([
          fetch(`${base}/hotels/${hotelId}/dashboard`,          { headers }),
          fetch(`${base}/hotels/${hotelId}/booking-requests`,   { headers }),
          fetch(`${base}/hotels/${hotelId}/bookings`,           { headers }),
        ]);

        if (dashRes.status === 403 || bkRes.status === 403) {
          router.replace("/403"); return;
        }
        if (dashRes.status === 404) { setLoadError("Hotel not found."); setIsLoading(false); return; }

        const [dashData, reqData, bkData] = await Promise.all([
          dashRes.json(),
          reqRes.ok ? reqRes.json() : { data: [] },
          bkRes.ok ? bkRes.json() : { data: [] },
        ]);

        if (!dashRes.ok) {
          setLoadError(dashData.message || "Failed to load dashboard.");
          setIsLoading(false);
          return;
        }

        const d: DashboardData = dashData.data || dashData;
        setDashboard(d);
        setHotelName(d.hotelName || d.hotel?.name || "Hotel");

        const allRequests: BookingRequest[] = reqData.data || reqData || [];
        setRequests(allRequests.filter((r: BookingRequest) => r.status === "pending"));
        setBookings((bkData.data || bkData || []).filter(
          (b: HotelBooking) => b.status !== "cancelled"
        ));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [router, hotelId]);

  /* ── Approve ── */
  async function handleApprove() {
    if (!confirmApprove) return;
    const token = localStorage.getItem("token")!;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/requests/${confirmApprove._id}/respond`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "approve", reason: "Approved by hotel owner" }),
        }
      );
      if (res.status === 403) { router.replace("/403"); return; }
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      setRequests(r => r.filter(x => x._id !== confirmApprove._id));
      addToast("Request approved successfully.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Approve failed.", "error");
    } finally {
      setConfirmApprove(null);
    }
  }

  /* ── Reject ── */
  async function handleReject() {
    if (!confirmReject) return;
    const token = localStorage.getItem("token")!;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/requests/${confirmReject._id}/respond`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "reject", reason: "Rejected by hotel owner" }),
        }
      );
      if (res.status === 403) { router.replace("/403"); return; }
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      setRequests(r => r.filter(x => x._id !== confirmReject._id));
      addToast("Request rejected. Booking unchanged.", "default");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Reject failed.", "error");
    } finally {
      setConfirmReject(null);
    }
  }

  /* ── Cancel Booking — step 1: validate reason ── */
  function handleCancelSubmit() {
    if (!cancelReason.trim()) {
      setCancelReasonErr("Please provide a reason for canceling booking.");
      return;
    }
    const booking = cancelDialog!;
    setCancelDialog(null);
    setCancelConfirm({ booking, reason: cancelReason });
  }

  /* ── Cancel Booking — step 2: confirm + API ── */
  async function handleCancelConfirm() {
    if (!cancelConfirm) return;
    const { booking, reason } = cancelConfirm;
    const token = localStorage.getItem("token")!;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${booking._id}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reason }),
        }
      );
      if (res.status === 403) {
        addToast("You do not have permission to cancel this booking.", "error");
        setCancelConfirm(null);
        return;
      }
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      setBookings(b => b.filter(x => x._id !== booking._id));
      addToast("Booking cancelled. Guest has been notified.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Cancellation failed.", "error");
    } finally {
      setCancelConfirm(null);
    }
  }

  /* ── Edit Booking ── */
  async function handleEditSave() {
    if (!editDialog) return;
    setEditConflict(false);
    setEditSaving(true);
    const token = localStorage.getItem("token")!;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${editDialog._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            checkInDate: editForm.checkInDate,
            numberOfNights: parseInt(editForm.numberOfNights, 10),
            reason: "Updated by hotel owner",
          }),
        }
      );
      if (res.status === 403) { router.replace("/403"); return; }
      if (res.status === 409) { setEditConflict(true); return; }
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      setBookings(b => b.map(x =>
        x._id === editDialog._id
          ? { ...x, checkInDate: editForm.checkInDate, numberOfNights: parseInt(editForm.numberOfNights, 10) }
          : x
      ));
      addToast("Booking updated. Guest has been notified.", "success");
      setEditDialog(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Update failed.", "error");
    } finally {
      setEditSaving(false);
    }
  }

  /* ── Monthly chart data ── */
  const chartData = (dashboard?.monthlyBookings ?? Array(12).fill(0)).map(
    (v, i) => ({ month: MONTHS[i], count: v })
  );

  const guestName = (req: BookingRequest) =>
    req.booking?.user?.name || req.requestedBy?.name || "Guest";

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/owner/hotels")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 mb-3 bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏨</span>
            <div>
              {isLoading
                ? <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
                : <h1 className="text-2xl font-bold text-gray-900">{hotelName}</h1>
              }
              <p className="text-sm text-gray-500 mt-0.5">Dashboard</p>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{loadError}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="h-8 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : !loadError && (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
                <div className="text-sm font-medium text-gray-500 mb-1.5">Total Bookings</div>
                <div className="text-3xl font-bold text-gray-900">{dashboard?.totalBookings ?? 0}</div>
                <div className="text-sm text-gray-400 mt-1">reservations</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
                <div className="text-sm font-medium text-gray-500 mb-1.5">Revenue Summary</div>
                <div className="text-3xl font-bold text-gray-900">{fmtMoney(dashboard?.totalRevenue ?? 0)}</div>
                <div className="text-sm text-gray-400 mt-1">estimated total</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
                <div className="flex items-center text-sm font-medium text-gray-500 mb-1.5">
                  Pending Requests
                  {requests.length > 0 && (
                    <span className="inline-block ml-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                <div className="text-3xl font-bold text-gray-900">{requests.length}</div>
                <div className="text-sm text-gray-400 mt-1">awaiting action</div>
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Button variant="outline" onClick={() => router.push(`/owner/dashboard/${hotelId}/financial`)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <path d="M8 21h8M12 17v4M7 8h10M7 12h6"/>
                </svg>
                Financial Report
              </Button>
              <Button variant="outline" onClick={() => router.push(`/owner/dashboard/${hotelId}/edit`)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Hotel Info
              </Button>
            </div>

            {/* ── Pending Requests ── */}
            <div className="mb-8">
              <div className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-gray-100">
                Pending Requests
              </div>
              {requests.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-sm text-gray-400">
                  No pending requests.
                </div>
              ) : (
                requests.map(req => (
                  <div key={req._id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 mb-2.5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={req.type === "edit" ? "bg-blue-100 text-blue-700 border-0" : "bg-red-100 text-red-700 border-0"}>
                          {req.type === "edit" ? "Edit" : "Cancel"}
                        </Badge>
                        <span className="font-semibold text-sm">{guestName(req)}</span>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">Submitted {fmtDate(req.createdAt)}</span>
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      <div>Check-in: <strong>{fmtDate(req.booking?.checkInDate)}</strong> ({req.booking?.numberOfNights} nights)</div>
                      {req.type === "edit" && (
                        <div>→ Requesting: <strong>{fmtDate(req.newCheckInDate)}</strong> ({req.newNumberOfNights} nights)</div>
                      )}
                      {req.type === "delete" && (
                        <div>→ Requesting: <strong>Cancellation</strong></div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setConfirmReject(req)}
                      >
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => setConfirmApprove(req)}>
                        Approve ✓
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── All Bookings ── */}
            <div className="mb-8">
              <div className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-gray-100">
                All Bookings
              </div>
              {bookings.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-sm text-gray-400">
                  No bookings found.
                </div>
              ) : (
                bookings.map(b => (
                  <div key={b._id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 mb-2.5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">{shortId(b._id)}</Badge>
                          <span className="font-semibold text-sm">{b.user?.name || "Guest"}</span>
                          <Badge className={
                            b.status === "confirmed"
                              ? "bg-green-100 text-green-700 border-0"
                              : b.status === "pending"
                              ? "bg-yellow-100 text-yellow-700 border-0"
                              : "bg-gray-100 text-gray-600 border-0"
                          }>
                            {b.status}
                          </Badge>
                          {b.paymentStatus && b.paymentStatus !== "paid" && (
                            <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                              {b.paymentStatus.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Check-in: {fmtDate(b.checkInDate)} · {b.numberOfNights} nights
                          {b.roomType && <span className="ml-2 capitalize text-gray-400">· {b.roomType}</span>}
                          {b.totalPrice != null && <span className="ml-2 font-medium text-gray-700">· {fmtMoney(b.totalPrice)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditForm({ checkInDate: b.checkInDate.slice(0, 10), numberOfNights: String(b.numberOfNights) });
                            setEditConflict(false);
                            setEditDialog(b);
                          }}
                        >
                          Edit Booking
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            setCancelReason("");
                            setCancelReasonErr("");
                            setCancelDialog(b);
                          }}
                        >
                          Cancel Booking
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Monthly Chart ── */}
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-gray-100">
                Monthly Booking Count (Current Year)
              </div>
              <div className="bg-white rounded-xl border border-gray-200 px-4 pt-5 pb-2">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }}
                      cursor={{ fill: "#f3f4f6" }}
                    />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Approve AlertDialog ── */}
      <AlertDialog open={!!confirmApprove} onOpenChange={o => !o && setConfirmApprove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Approve {confirmApprove?.type} request from{" "}
              <strong>{confirmApprove && guestName(confirmApprove)}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reject AlertDialog ── */}
      <AlertDialog open={!!confirmReject} onOpenChange={o => !o && setConfirmReject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
            <AlertDialogDescription>
              Reject this request from{" "}
              <strong>{confirmReject && guestName(confirmReject)}</strong>?{" "}
              The booking will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleReject}>
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Cancel Booking Dialog (reason input) ── */}
      <Dialog open={!!cancelDialog} onOpenChange={o => !o && setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 -mt-2">
            Cancelling booking{" "}
            <strong>{cancelDialog && shortId(cancelDialog._id)}</strong> for{" "}
            <strong>{cancelDialog?.user?.name || "Guest"}</strong>. Please provide a
            reason — the guest will be notified.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for cancellation *
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={cancelReason}
              onChange={e => { setCancelReason(e.target.value); setCancelReasonErr(""); }}
              placeholder="e.g. Hotel maintenance scheduled for that period..."
            />
            {cancelReasonErr && (
              <p className="text-red-600 text-xs mt-1">{cancelReasonErr}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(null)}>Close</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleCancelSubmit}>
              Submit Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Booking Confirm AlertDialog ── */}
      <AlertDialog open={!!cancelConfirm} onOpenChange={o => !o && setCancelConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? Reason:{" "}
              &ldquo;{cancelConfirm?.reason}&rdquo;
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleCancelConfirm}>
              Yes, Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Edit Booking Dialog ── */}
      <Dialog open={!!editDialog} onOpenChange={o => !o && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 -mt-2">
            Editing booking{" "}
            <strong>{editDialog && shortId(editDialog._id)}</strong> for{" "}
            <strong>{editDialog?.user?.name || "Guest"}</strong>.
          </p>
          {editConflict && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">
              No rooms available for the selected dates.
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New Check-in Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={editForm.checkInDate}
                onChange={e => { setEditForm(f => ({ ...f, checkInDate: e.target.value })); setEditConflict(false); }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Number of Nights
              </label>
              <input
                type="number"
                min="1"
                max="3"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={editForm.numberOfNights}
                onChange={e => { setEditForm(f => ({ ...f, numberOfNights: e.target.value })); setEditConflict(false); }}
                placeholder="1 – 3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Toast Container ── */}
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
