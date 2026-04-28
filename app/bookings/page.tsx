"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays, Edit, Hotel, LogIn, LogOut, Moon, CreditCard,
  CheckCircle2, XCircle, Clock, AlertTriangle, Loader2,
} from "lucide-react";
import { format, addDays, differenceInHours } from "date-fns";
import { apiRequest } from "@/lib/api";

interface Booking {
  _id: string;
  hotel: { _id: string; name: string; address?: string; telephone?: string };
  checkInDate: string;
  numberOfNights: number;
  totalPrice: number;
  amountPaid?: number;
  paymentStatus: string;
  status: string;
  cancellationReason?: string;
  createdAt?: string;
}

function shortId(id: string) { return `#${id.slice(-6).toUpperCase()}`; }
function fmtMoney(n: number) { return `฿${n.toLocaleString()}`; }

function getRefundPolicy(checkInDate: string): { rate: number; label: string; variant: "safe" | "partial" | "none" } {
  const hours = differenceInHours(new Date(checkInDate), new Date());
  if (hours >= 72) return { rate: 1,   label: "Full refund (≥72h before check-in)",    variant: "safe" };
  if (hours >= 24) return { rate: 0.5, label: "50% refund (24–72h before check-in)",   variant: "partial" };
  return              { rate: 0,   label: "No refund (<24h before check-in)",       variant: "none" };
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-700",  icon: <CheckCircle2 className="size-3" /> },
  pending:   { label: "Pending",   className: "bg-yellow-100 text-yellow-700", icon: <Clock className="size-3" /> },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700",      icon: <XCircle className="size-3" /> },
};

const paymentConfig: Record<string, { label: string; className: string }> = {
  paid:                       { label: "Paid",              className: "bg-green-100 text-green-700" },
  unpaid:                     { label: "Unpaid",            className: "bg-gray-100 text-gray-600" },
  pending_additional_payment: { label: "Additional Payment",className: "bg-amber-100 text-amber-700" },
  partial_refund:             { label: "Partial Refund",    className: "bg-blue-100 text-blue-700" },
  refunded:                   { label: "Refunded",          className: "bg-indigo-100 text-indigo-700" },
};

export default function MyBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Cancel flow (US2-4)
  const [cancelTarget, setCancelTarget]   = useState<Booking | null>(null);
  const [cancelStep, setCancelStep]       = useState<"idle" | "confirm">("idle");
  const [isCancelling, setIsCancelling]   = useState(false);

  useEffect(() => { fetchBookings(); }, []);

  async function fetchBookings() {
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

  function openCancelDialog(booking: Booking) {
    setCancelTarget(booking);
    setCancelStep("confirm");
  }

  async function handleCancelConfirm() {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await apiRequest(`/bookings/${cancelTarget._id}/cancel`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setBookings((prev) =>
        prev.map((b) => b._id === cancelTarget._id ? { ...b, status: "cancelled" } : b)
      );
      setCancelStep("idle");
      setCancelTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel booking");
      setCancelStep("idle");
    } finally {
      setIsCancelling(false);
    }
  }

  const BookingActions = ({ booking }: { booking: Booking }) => {
    const isCancelled = booking.status === "cancelled";
    const isPaid = booking.paymentStatus === "paid" || booking.status === "confirmed";
    const isUnpaid = booking.paymentStatus === "unpaid";
    const needsPayment = !isPaid && !isCancelled;

    return (
      <div className="flex flex-wrap gap-2">
        {needsPayment && (
          <Button size="sm" onClick={() => router.push(`/bookings/${booking._id}/pay`)}>
            <CreditCard className="size-3.5 mr-1" /> Pay Now
          </Button>
        )}
        {isPaid && (
          <Button variant="outline" size="sm" onClick={() => router.push(`/bookings/${booking._id}/confirmation`)}>
            <CheckCircle2 className="size-3.5 mr-1 text-green-600" /> Confirmation
          </Button>
        )}
        {!isCancelled && isPaid && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/bookings/${booking._id}/edit`)}
          >
            <Edit className="size-3.5 mr-1" /> Edit
          </Button>
        )}
        {/* Only show Cancel for paid bookings — unpaid bookings can just be abandoned */}
        {!isCancelled && isPaid && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => openCancelDialog(booking)}
          >
            <XCircle className="size-3.5 mr-1" /> Cancel
          </Button>
        )}
      </div>
    );
  };

  const refundPolicy = cancelTarget ? getRefundPolicy(cancelTarget.checkInDate) : null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your hotel reservations</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="py-12 flex justify-center">
              <Loader2 className="size-8 animate-spin text-blue-600" />
            </CardContent>
          </Card>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Hotel className="size-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-4">Start planning your next trip!</p>
              <Button onClick={() => router.push("/hotels")}>Browse Hotels</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>Your Reservations ({bookings.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-24">Booking</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead className="text-center">Nights</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const checkOut = addDays(new Date(booking.checkInDate), booking.numberOfNights);
                      const sc = statusConfig[booking.status] ?? statusConfig.pending;
                      const pc = paymentConfig[booking.paymentStatus] ?? paymentConfig.unpaid;
                      return (
                        <TableRow key={booking._id} className={booking.status === "cancelled" ? "opacity-60" : ""}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">{shortId(booking._id)}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{booking.hotel.name}</TableCell>
                          <TableCell>
                            <Badge className={`${sc.className} border-0 text-xs flex items-center gap-1 w-fit`}>
                              {sc.icon}{sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${pc.className} border-0 text-xs`}>{pc.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <LogIn className="size-3.5 text-green-600" />
                              {format(new Date(booking.checkInDate), "d MMM yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <LogOut className="size-3.5 text-red-500" />
                              {format(checkOut, "d MMM yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1 text-sm">
                              <Moon className="size-3.5 text-indigo-500" />
                              {booking.numberOfNights}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <BookingActions booking={booking} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {bookings.map((booking) => {
                const checkOut = addDays(new Date(booking.checkInDate), booking.numberOfNights);
                const sc = statusConfig[booking.status] ?? statusConfig.pending;
                const pc = paymentConfig[booking.paymentStatus] ?? paymentConfig.unpaid;
                return (
                  <Card key={booking._id} className={booking.status === "cancelled" ? "opacity-60" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{booking.hotel.name}</CardTitle>
                        <Badge variant="outline" className="font-mono text-xs shrink-0">{shortId(booking._id)}</Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap mt-1">
                        <Badge className={`${sc.className} border-0 text-xs flex items-center gap-1`}>{sc.icon}{sc.label}</Badge>
                        <Badge className={`${pc.className} border-0 text-xs`}>{pc.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <LogIn className="size-4 text-green-600 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Check-in</p>
                            <p className="font-medium">{format(new Date(booking.checkInDate), "d MMM yyyy")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <LogOut className="size-4 text-red-500 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Check-out</p>
                            <p className="font-medium">{format(checkOut, "d MMM yyyy")}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Moon className="size-4 text-indigo-500 shrink-0" />
                        <span>{booking.numberOfNights} {booking.numberOfNights === 1 ? "night" : "nights"}</span>
                        {booking.totalPrice > 0 && (
                          <span className="ml-auto font-semibold text-blue-600">{fmtMoney(booking.totalPrice)}</span>
                        )}
                      </div>
                      {booking.cancellationReason && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 border border-gray-100">
                          <span className="font-medium">Reason: </span>{booking.cancellationReason}
                        </div>
                      )}
                      {booking.createdAt && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CalendarDays className="size-3.5 shrink-0" />
                          <span>Booked on {format(new Date(booking.createdAt), "d MMM yyyy")}</span>
                        </div>
                      )}
                      <Separator />
                      <BookingActions booking={booking} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Cancel Confirmation Dialog (US2-4) */}
      <AlertDialog open={cancelStep === "confirm"} onOpenChange={(o) => !o && setCancelStep("idle")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to cancel your booking at{" "}
                  <span className="font-semibold">{cancelTarget?.hotel.name}</span>?
                </p>

                {/* Refund policy warning (US2-4 Scenario 2) */}
                {refundPolicy && (
                  <div className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
                    refundPolicy.variant === "safe"    ? "bg-green-50 border border-green-200 text-green-800" :
                    refundPolicy.variant === "partial" ? "bg-yellow-50 border border-yellow-200 text-yellow-800" :
                                                         "bg-red-50 border border-red-200 text-red-700"
                  }`}>
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        {refundPolicy.variant === "none"
                          ? "This cancellation is non-refundable"
                          : refundPolicy.variant === "partial"
                          ? "Partial refund applies"
                          : "Full refund applies"}
                      </p>
                      <p className="text-xs mt-0.5">{refundPolicy.label}</p>
                      {cancelTarget && (cancelTarget.amountPaid ?? cancelTarget.totalPrice ?? 0) > 0 && (
                        <p className="text-xs mt-1">
                          Refund amount:{" "}
                          <strong>
                            {cancelTarget.paymentStatus === "unpaid"
                              ? fmtMoney(0)
                              : fmtMoney(Math.round(
                                  (typeof cancelTarget.amountPaid === "number" && cancelTarget.amountPaid > 0
                                    ? cancelTarget.amountPaid
                                    : cancelTarget.totalPrice ?? 0
                                  ) * refundPolicy.rate
                                ))
                            }
                          </strong>
                          {" "}of{" "}
                          {fmtMoney(
                            typeof cancelTarget.amountPaid === "number" && cancelTarget.amountPaid > 0
                              ? cancelTarget.amountPaid
                              : cancelTarget.totalPrice ?? 0
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setCancelStep("idle"); setCancelTarget(null); }}>
              Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isCancelling}
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? <><Loader2 className="size-3.5 mr-1 animate-spin" /> Cancelling…</> : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
