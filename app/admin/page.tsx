"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  BarChart2, CalendarIcon, ClipboardList, Edit, Hotel as HotelIcon,
  LogIn, LogOut, Moon, Plus, Shield, ShieldCheck, XCircle,
} from "lucide-react";
import { format, addDays, isAfter } from "date-fns";
import { apiRequest } from "@/lib/api";

interface Booking {
  _id: string;
  user: string | { _id: string; name: string; email: string };
  hotel: string | { _id: string; name: string; address: string };
  checkInDate: string;
  numberOfNights: number;
  totalPrice?: number;
  status?: string;
  cancellationReason?: string;
  createdAt?: string;
}

interface HotelOption {
  _id: string;
  name: string;
}

function shortId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

function getCheckOut(checkInDate: string, nights: number) {
  return addDays(new Date(checkInDate), nights);
}

export default function AdminDashboard() {
  const router = useRouter();
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [hotels,    setHotels]    = useState<HotelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string>("");

  // ── Edit / Create dialog ──
  const [editingBooking,  setEditingBooking]  = useState<Booking | null>(null);
  const [checkInDate,     setCheckInDate]     = useState<Date>();
  const [numberOfNights,  setNumberOfNights]  = useState<string>("1");
  const [editReason,      setEditReason]      = useState("");
  const [editReasonErr,   setEditReasonErr]   = useState("");
  const [isDialogOpen,    setIsDialogOpen]    = useState(false);
  const [isSaving,        setIsSaving]        = useState(false);
  const [isCreating,      setIsCreating]      = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");

  // ── Cancel dialog (US3-2) ──
  const [cancelDialog,     setCancelDialog]     = useState(false);      // step 1 — reason
  const [cancelConfirm,    setCancelConfirm]    = useState(false);      // step 2 — confirm
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason,     setCancelReason]     = useState("");
  const [cancelReasonErr,  setCancelReasonErr]  = useState("");
  const [isCancelling,     setIsCancelling]     = useState(false);

  useEffect(() => {
    fetchAllBookings();
    fetchHotels();
  }, []);

  async function fetchAllBookings() {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiRequest("/bookings");
      setBookings(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchHotels() {
    try {
      const data = await apiRequest("/hotels");
      setHotels(data.data || []);
    } catch {
      // non-fatal
    }
  }

  // ── Cancel flow (US3-2) ──
  function openCancelDialog(booking: Booking) {
    setCancellingBooking(booking);
    setCancelReason("");
    setCancelReasonErr("");
    setCancelDialog(true);
  }

  function handleCancelSubmit() {
    if (!cancelReason.trim()) {
      setCancelReasonErr("Please provide a reason for canceling booking.");
      return;
    }
    setCancelDialog(false);
    setCancelConfirm(true);
  }

  async function handleCancelConfirm() {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      // POST /api/v1/bookings/:id/cancel — endpoint EXISTS on backend
      await apiRequest(`/bookings/${cancellingBooking._id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason }),
      });
      setBookings((prev) =>
        prev.map((b) =>
          b._id === cancellingBooking._id
            ? { ...b, status: "cancelled", cancellationReason: cancelReason }
            : b
        )
      );
      setCancelConfirm(false);
      setCancellingBooking(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel booking");
      setCancelConfirm(false);
    } finally {
      setIsCancelling(false);
    }
  }

  // ── Edit / Create flow (US3-4) ──
  function openCreateDialog() {
    setIsCreating(true);
    setEditingBooking(null);
    setCheckInDate(undefined);
    setNumberOfNights("1");
    setEditReason("");
    setEditReasonErr("");
    setSelectedHotelId("");
    setIsDialogOpen(true);
  }

  function openEditDialog(booking: Booking) {
    setIsCreating(false);
    setEditingBooking(booking);
    setCheckInDate(new Date(booking.checkInDate));
    setNumberOfNights(booking.numberOfNights.toString());
    setEditReason("");
    setEditReasonErr("");
    setIsDialogOpen(true);
  }

  async function handleSaveBooking() {
    if (!checkInDate) return;

    // Validate reason for admin edit (US3-4)
    if (!isCreating && !editReason.trim()) {
      setEditReasonErr("Please provide a reason for this change.");
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        if (!selectedHotelId) { alert("Please select a hotel"); setIsSaving(false); return; }
        await apiRequest(`/hotels/${selectedHotelId}/bookings`, {
          method: "POST",
          body: JSON.stringify({
            checkInDate: format(checkInDate, "yyyy-MM-dd"),
            numberOfNights: Number(numberOfNights),
          }),
        });
        await fetchAllBookings();
      } else if (editingBooking) {
        // PUT /api/v1/bookings/:id — requires reason for admin, endpoint EXISTS
        await apiRequest(`/bookings/${editingBooking._id}`, {
          method: "PUT",
          body: JSON.stringify({
            checkInDate: format(checkInDate, "yyyy-MM-dd"),
            numberOfNights: Number(numberOfNights),
            reason: editReason,
          }),
        });
        setBookings((prev) =>
          prev.map((b) =>
            b._id === editingBooking._id
              ? { ...b, checkInDate: format(checkInDate, "yyyy-MM-dd"), numberOfNights: Number(numberOfNights) }
              : b
          )
        );
      }
      setIsDialogOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save booking");
    } finally {
      setIsSaving(false);
    }
  }

  const upcomingCount = bookings.filter((b) => isAfter(new Date(b.checkInDate), new Date())).length;
  const checkOutDate  = checkInDate ? addDays(checkInDate, Number(numberOfNights)) : null;

  const statusBadge: Record<string, string> = {
    confirmed: "bg-green-100 text-green-800",
    pending:   "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Manage all hotel bookings in the system</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/hotels")}>
              <HotelIcon className="size-4 mr-2" />
              Manage Hotels
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/roles")}>
              <ShieldCheck className="size-4 mr-2" />
              Manage Roles
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/stats")}>
              <BarChart2 className="size-4 mr-2" />
              Statistics
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/requests")}>
              <ClipboardList className="size-4 mr-2" />
              Requests
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="size-4 mr-2" />
              Create Booking
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">{bookings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-green-600">{upcomingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-1">Total Hotels</p>
              <p className="text-3xl font-bold text-indigo-600">{hotels.length}</p>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {/* Bookings Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              All Bookings
              <span className="ml-2 text-sm font-normal text-gray-500">({bookings.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <HotelIcon className="size-10 mx-auto mb-3 opacity-40" />
                <p>No bookings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-28">Booking</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead className="text-center">Nights</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const hotelName = typeof booking.hotel === "object" ? booking.hotel.name : "—";
                      const checkOut  = getCheckOut(booking.checkInDate, booking.numberOfNights);
                      const isUpcoming = isAfter(new Date(booking.checkInDate), new Date());
                      const isCancelled = booking.status === "cancelled";

                      return (
                        <TableRow key={booking._id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="font-mono text-xs w-fit">
                                {shortId(booking._id)}
                              </Badge>
                              {isUpcoming && !isCancelled && (
                                <Badge className="text-xs bg-green-100 text-green-700 border-0 w-fit">
                                  Upcoming
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{hotelName}</TableCell>
                          <TableCell>
                            {booking.status && (
                              <Badge className={`${statusBadge[booking.status] ?? "bg-gray-100 text-gray-600"} capitalize border-0 text-xs`}>
                                {booking.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <LogIn className="size-3.5 text-green-600 shrink-0" />
                              {format(new Date(booking.checkInDate), "d MMM yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <LogOut className="size-3.5 text-red-500 shrink-0" />
                              {format(checkOut, "d MMM yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1 text-sm">
                              <Moon className="size-3.5 text-indigo-400" />
                              {booking.numberOfNights}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isCancelled}
                                onClick={() => openEditDialog(booking)}
                              >
                                <Edit className="size-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isCancelled}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => openCancelDialog(booking)}
                              >
                                <XCircle className="size-3.5 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Create / Edit Dialog (US3-4) ── */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isCreating ? "Create Booking" : "Edit Booking"}</DialogTitle>
              <DialogDescription>
                {isCreating
                  ? "Create a new booking (max 3 nights)"
                  : "Update the booking details (max 3 nights)"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {editingBooking && !isCreating && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 text-sm">
                  <Badge variant="outline" className="font-mono text-xs">
                    {shortId(editingBooking._id)}
                  </Badge>
                  <p className="text-gray-600">
                    Hotel:{" "}
                    <span className="font-medium text-gray-900">
                      {typeof editingBooking.hotel === "object"
                        ? editingBooking.hotel.name
                        : editingBooking.hotel}
                    </span>
                  </p>
                </div>
              )}

              {isCreating && (
                <div className="space-y-2">
                  <Label>Hotel</Label>
                  <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels.map((hotel) => (
                        <SelectItem key={hotel._id} value={hotel._id}>{hotel.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Check-in Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 size-4" />
                      {checkInDate ? format(checkInDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkInDate}
                      onSelect={(date) => setCheckInDate(date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Number of Nights</Label>
                <Select value={numberOfNights} onValueChange={setNumberOfNights}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Night</SelectItem>
                    <SelectItem value="2">2 Nights</SelectItem>
                    <SelectItem value="3">3 Nights</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {checkInDate && checkOutDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold">Booking Preview</p>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <LogIn className="size-3.5 text-green-600" /> Check-in
                      </span>
                      <span className="font-medium">{format(checkInDate, "d MMM yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <LogOut className="size-3.5 text-red-500" /> Check-out
                      </span>
                      <span className="font-medium">{format(checkOutDate, "d MMM yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Moon className="size-3.5 text-indigo-500" /> Nights
                      </span>
                      <span className="font-medium">
                        {numberOfNights} {Number(numberOfNights) === 1 ? "night" : "nights"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason for change — required for admin edit (US3-4) */}
              {!isCreating && (
                <div className="space-y-1.5">
                  <Label>Reason for change *</Label>
                  <Textarea
                    rows={3}
                    value={editReason}
                    onChange={(e) => { setEditReason(e.target.value); setEditReasonErr(""); }}
                    placeholder="e.g. Guest requested date change due to travel delays…"
                  />
                  {editReasonErr && <p className="text-xs text-red-500">{editReasonErr}</p>}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveBooking} disabled={isSaving || !checkInDate}>
                {isSaving ? "Saving…" : isCreating ? "Create Booking" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Cancel Step 1: Reason Dialog (US3-2) ── */}
        <Dialog open={cancelDialog} onOpenChange={(o) => !o && setCancelDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
              <DialogDescription>
                Cancelling booking{" "}
                <span className="font-semibold font-mono">
                  {cancellingBooking ? shortId(cancellingBooking._id) : ""}
                </span>.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5 py-2">
              <Label>Reason for cancellation *</Label>
              <Textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => { setCancelReason(e.target.value); setCancelReasonErr(""); }}
                placeholder="e.g. Double booking error…"
              />
              {cancelReasonErr && <p className="text-xs text-red-500">{cancelReasonErr}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialog(false)}>Close</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleCancelSubmit}>
                Submit Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Cancel Step 2: Confirm (US3-2) ── */}
        <AlertDialog open={cancelConfirm} onOpenChange={(o) => !o && setCancelConfirm(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure? Reason: &ldquo;{cancelReason}&rdquo;
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCancelConfirm(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isCancelling}
                onClick={handleCancelConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                {isCancelling ? "Cancelling…" : "Yes, Cancel"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </main>
    </div>
  );
}
