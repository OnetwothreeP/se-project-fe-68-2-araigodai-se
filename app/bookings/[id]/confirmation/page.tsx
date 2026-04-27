"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Printer, CalendarDays, LogIn, LogOut, Moon, Hotel, Loader2, AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";
import { apiRequest } from "@/lib/api";

interface Booking {
  _id: string;
  hotel: { _id: string; name: string; address?: string; telephone?: string };
  checkInDate: string;
  numberOfNights: number;
  totalPrice: number;
  amountPaid: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  user?: { name: string; email: string };
}

function fmtMoney(n: number) {
  return `฿${n.toLocaleString()}`;
}

export default function ConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  async function fetchBooking() {
    setIsFetching(true);
    setFetchError("");
    try {
      const data = await apiRequest(`/bookings/${bookingId}`);
      setBooking(data.data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load booking");
    } finally {
      setIsFetching(false);
    }
  }

  if (isFetching) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (fetchError || !booking) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{fetchError || "Booking not found"}</div>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/bookings")}>Back to My Bookings</Button>
        </div>
      </div>
    );
  }

  const checkOut = addDays(new Date(booking.checkInDate), booking.numberOfNights);
  const shortId = `#${booking._id.slice(-6).toUpperCase()}`;
  const isPaid = booking.paymentStatus === "paid" || booking.status === "confirmed";
  const amountDisplay = booking.amountPaid > 0 ? booking.amountPaid : booking.totalPrice;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-18 h-18 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4" style={{ width: 72, height: 72 }}>
            <CheckCircle2 className="size-9 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Booking Confirmed!</h1>
          <p className="text-gray-500 mt-2 text-sm">Your reservation is all set. See you there!</p>
        </div>

        {/* Warning if not yet confirmed */}
        {!isPaid && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2 text-yellow-800 text-sm mb-5">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>This booking is not yet confirmed — payment may still be processing. Details below are shown for reference.</span>
          </div>
        )}

        {/* Booking details card — printable */}
        <div id="printable" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
          <div className="text-center mb-5">
            <Badge variant="outline" className="font-mono text-sm px-3 py-1">{shortId}</Badge>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Hotel className="size-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Hotel</p>
                <p className="font-semibold">{booking.hotel.name}</p>
                {booking.hotel.address && <p className="text-xs text-gray-400 mt-0.5">{booking.hotel.address}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="flex items-start gap-2">
                <LogIn className="size-4 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Check-in</p>
                  <p className="font-medium">{format(new Date(booking.checkInDate), "d MMM yyyy")}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <LogOut className="size-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Check-out</p>
                  <p className="font-medium">{format(checkOut, "d MMM yyyy")}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <Moon className="size-4 text-indigo-500 shrink-0" />
              <span className="text-gray-500">Nights:</span>
              <span className="font-medium">{booking.numberOfNights} {booking.numberOfNights === 1 ? "night" : "nights"}</span>
            </div>

            {booking.createdAt && (
              <div className="flex items-center gap-2 py-1">
                <CalendarDays className="size-4 text-gray-400 shrink-0" />
                <span className="text-gray-500">Booked on:</span>
                <span className="font-medium">{format(new Date(booking.createdAt), "d MMM yyyy, HH:mm")}</span>
              </div>
            )}

            <Separator className="my-2" />

            <div className="flex justify-between items-center pt-1">
              <span className="font-semibold text-gray-700">Amount Paid</span>
              <span className="text-2xl font-bold text-green-600">{fmtMoney(amountDisplay)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500">Payment Status</span>
              <Badge className={isPaid ? "bg-green-100 text-green-700 border-0" : "bg-yellow-100 text-yellow-700 border-0"}>
                {isPaid ? "Paid" : booking.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4 mr-2" />
            Print / Save as PDF
          </Button>
          <Button onClick={() => router.push("/bookings")}>
            View My Bookings
          </Button>
        </div>
        <p className="text-xs text-center text-gray-400 mt-3">Use Ctrl+P / Cmd+P to save as PDF</p>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable, #printable * { visibility: visible; }
          #printable { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
