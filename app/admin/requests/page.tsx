"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/api";

interface BookingRequest {
  _id: string;
  type: "edit" | "delete";
  status: "pending" | "approved" | "rejected";
  requestedBy: { _id: string; name: string; email: string } | string;
  booking: {
    _id: string;
    hotel: { _id: string; name: string } | string;
    checkInDate: string;
    numberOfNights: number;
  } | string;
  newCheckInDate?: string;
  newNumberOfNights?: number;
  adminReason?: string;
  createdAt: string;
}

type FilterTab = "All" | "Pending" | "Approved" | "Rejected";
const TABS: FilterTab[] = ["All", "Pending", "Approved", "Rejected"];

function fmt(d: string | undefined) {
  if (!d) return "—";
  return format(new Date(d), "d MMM yyyy");
}

function getName(field: { name: string } | string | undefined) {
  if (!field) return "—";
  return typeof field === "object" ? field.name : field;
}

function getEmail(field: { email: string } | string | undefined) {
  if (!field) return "";
  return typeof field === "object" ? field.email : "";
}

export default function AdminRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterTab>("All");

  // Action dialog (step 1 — reason)
  const [actionDialog, setActionDialog] = useState<{
    request: BookingRequest;
    action: "approve" | "reject";
  } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionReasonErr, setActionReasonErr] = useState("");

  // Confirm dialog (step 2)
  const [confirmDialog, setConfirmDialog] = useState<{
    request: BookingRequest;
    action: "approve" | "reject";
    reason: string;
  } | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setIsLoading(true);
    try {
      // GET /api/v1/bookings/requests — admin only; supports ?status=pending|approved|rejected
      const data = await apiRequest("/bookings/requests");
      setRequests(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }

  function openAction(request: BookingRequest, action: "approve" | "reject") {
    setActionDialog({ request, action });
    setActionReason("");
    setActionReasonErr("");
  }

  function handleActionSubmit() {
    if (!actionReason.trim()) {
      setActionReasonErr("Please provide a reason.");
      return;
    }
    setConfirmDialog({ ...actionDialog!, reason: actionReason });
    setActionDialog(null);
  }

  async function handleConfirm() {
    if (!confirmDialog) return;
    setIsPending(true);
    try {
      // PUT /api/v1/bookings/requests/:requestId/respond — endpoint EXISTS on backend
      await apiRequest(`/bookings/requests/${confirmDialog.request._id}/respond`, {
        method: "PUT",
        body: JSON.stringify({
          action: confirmDialog.action,
          reason: confirmDialog.reason,
        }),
      });
      const newStatus = confirmDialog.action === "approve" ? "approved" : "rejected";
      setRequests((prev) =>
        prev.map((r) =>
          r._id === confirmDialog.request._id
            ? { ...r, status: newStatus, adminReason: confirmDialog.reason }
            : r
        )
      );
      setConfirmDialog(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to process request");
      setConfirmDialog(null);
    } finally {
      setIsPending(false);
    }
  }

  const filtered =
    filter === "All" ? requests : requests.filter((r) => r.status === filter.toLowerCase());

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const statusBadge: Record<string, string> = {
    pending:  "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100  text-green-800",
    rejected: "bg-red-100    text-red-800",
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Back */}
        <Button variant="ghost" size="sm" className="text-gray-500 -ml-2" onClick={() => router.push("/admin")}>
          <ArrowLeft className="size-4 mr-1" />
          Back to Admin
        </Button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <ClipboardList className="size-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Booking Requests</h1>
              {pendingCount > 0 && (
                <Badge className="bg-blue-600 text-white text-xs">{pendingCount} pending</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">Accept or decline user edit / cancel requests</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Booking</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Current Dates</TableHead>
                  <TableHead>Requested Change</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                      No requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const booking = typeof r.booking === "object" ? r.booking : null;
                    const hotelName = booking ? getName(booking.hotel as any) : "—";
                    const requester = typeof r.requestedBy === "object" ? r.requestedBy : null;

                    return (
                      <TableRow key={r._id} className="hover:bg-gray-50">
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            #{booking?._id?.slice(-6).toUpperCase() ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              r.type === "edit"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {r.type === "edit" ? "Edit" : "Cancel"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{getName(requester as any)}</div>
                          <div className="text-xs text-gray-400">{getEmail(requester as any)}</div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[140px] truncate">{hotelName}</TableCell>
                        <TableCell className="text-sm">
                          {fmt(booking?.checkInDate)}
                          <br />
                          <span className="text-gray-400">{booking?.numberOfNights} nights</span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.type === "edit" ? (
                            <>
                              <span className="font-medium">{fmt(r.newCheckInDate)}</span>
                              <br />
                              <span className="text-gray-400">{r.newNumberOfNights} nights</span>
                            </>
                          ) : (
                            <span className="text-red-500">Cancellation</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{fmt(r.createdAt)}</TableCell>
                        <TableCell>
                          <Badge className={`${statusBadge[r.status]} capitalize border-0`}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {r.status === "pending" ? (
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                onClick={() => openAction(r, "approve")}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                onClick={() => openAction(r, "reject")}
                              >
                                Decline
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {r.adminReason
                                ? `Reason: ${r.adminReason}`
                                : "This request has already been processed."}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Step 1 — Reason Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve" ? "Accept" : "Decline"} Request
            </DialogTitle>
            <DialogDescription>
              {actionDialog && (
                <>
                  <span className="font-semibold">{getName(actionDialog.request.requestedBy as any)}</span>{" "}
                  — {actionDialog.request.type} request.
                  {actionDialog.request.type === "edit" && actionDialog.request.newCheckInDate && (
                    <> Requesting change to{" "}
                      <span className="font-semibold">{fmt(actionDialog.request.newCheckInDate)}</span>{" "}
                      ({actionDialog.request.newNumberOfNights} nights).
                    </>
                  )}
                  {actionDialog.request.type === "delete" && " Requesting cancellation."}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            <Label>Reason *</Label>
            <Textarea
              rows={3}
              value={actionReason}
              onChange={(e) => { setActionReason(e.target.value); setActionReasonErr(""); }}
              placeholder={
                actionDialog?.action === "approve"
                  ? "e.g. Approved — availability confirmed."
                  : "e.g. No rooms available for requested dates."
              }
            />
            {actionReasonErr && <p className="text-xs text-red-500">{actionReasonErr}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              className={
                actionDialog?.action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
              onClick={handleActionSubmit}
            >
              {actionDialog?.action === "approve" ? "Accept Request" : "Decline Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 2 — Confirm */}
      <AlertDialog open={!!confirmDialog} onOpenChange={(o) => !o && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {confirmDialog?.action === "approve" ? "Acceptance" : "Rejection"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === "approve" ? "Approve" : "Reject"} this request?{" "}
              Reason: &ldquo;{confirmDialog?.reason}&rdquo;
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
              className={
                confirmDialog?.action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isPending
                ? "Processing…"
                : confirmDialog?.action === "approve"
                ? "Yes, Accept"
                : "Yes, Decline"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
