"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CalendarIcon, Hotel, LogIn, LogOut, Moon,
  ArrowLeft, Loader2, CheckCircle2, Clock,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { apiRequest } from "@/lib/api";

interface Booking {
  _id: string;
  hotel: { _id: string; name: string; address?: string };
  checkInDate: string;
  numberOfNights: number;
  totalPrice: number;
  paymentStatus: string;
  status: string;
  createdAt?: string;
}

export default function EditBooking() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking]               = useState<Booking | null>(null);
  const [isFetching, setIsFetching]         = useState(true);
  const [fetchError, setFetchError]         = useState("");

  const [checkInDate, setCheckInDate]       = useState<Date>();
  const [numberOfNights, setNumberOfNights] = useState<string>("1");

  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState("");
  const [submitted, setSubmitted]           = useState(false);

  useEffect(() => { fetchBooking(); }, [bookingId]);

  async function fetchBooking() {
    setIsFetching(true);
    setFetchError("");
    try {
      const data = await apiRequest(`/bookings/${bookingId}`);
      const b: Booking = data.data;
      setBooking(b);
      setCheckInDate(new Date(b.checkInDate));
      setNumberOfNights(b.numberOfNights.toString());
    } catch {
      setFetchError("Failed to load booking");
    } finally {
      setIsFetching(false);
    }
  }

  async function handleSubmitRequest() {
    if (!checkInDate || !booking) return;
    setError("");
    setIsLoading(true);
    try {
      // POST /api/v1/bookings/:id/request — creates a pending request for admin approval
      await apiRequest(`/bookings/${bookingId}/request`, {
        method: "POST",
        body: JSON.stringify({
          type: "edit",
          newCheckInDate: format(checkInDate, "yyyy-MM-dd"),
          newNumberOfNights: Number(numberOfNights),
        }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  }

  const checkOutDate = checkInDate ? addDays(checkInDate, Number(numberOfNights)) : null;

  // ── Loading ──
  if (isFetching) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ── Fetch error ──
  if (fetchError || !booking) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{fetchError || "Booking not found"}</div>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/bookings")}>
            <ArrowLeft className="size-4 mr-1" /> Back to My Bookings
          </Button>
        </div>
      </div>
    );
  }

  const isCancelled = booking.status === "cancelled";

  // ── Submitted state ──
  if (submitted) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <Clock className="size-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold">Request Submitted</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Your date change request for <strong>{booking.hotel.name}</strong> has been submitted
                and is pending admin approval. You will be notified once it is reviewed.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 max-w-sm mx-auto text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Requested check-in</span>
                  <span className="font-medium">{checkInDate ? format(checkInDate, "d MMM yyyy") : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Requested nights</span>
                  <span className="font-medium">{numberOfNights}</span>
                </div>
              </div>
              <Button variant="outline" onClick={() => router.push("/bookings")}>
                Back to My Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" size="sm" className="mb-4 text-gray-500 -ml-2" onClick={() => router.push("/bookings")}>
          <ArrowLeft className="size-4 mr-1" /> Back to My Bookings
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>Request Date Change</CardTitle>
                <CardDescription>
                  Submit a request to change your booking dates. An admin will review and approve it.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs shrink-0">
                #{booking._id.slice(-6).toUpperCase()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Info banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
              <Clock className="size-4 shrink-0 mt-0.5" />
              <span>
                Date changes require admin approval. Your booking will not be modified until the request is approved.
              </span>
            </div>

            {/* Cancelled warning */}
            {isCancelled && (
              <Alert variant="destructive">
                <AlertDescription>This booking is cancelled and cannot be edited.</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Current booking info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Current Booking</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Hotel className="size-4 text-blue-600" />
                {booking.hotel.name}
              </div>
              {booking.hotel.address && (
                <p className="text-xs text-gray-500 pl-6">{booking.hotel.address}</p>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm pl-6 mt-1">
                <div>
                  <p className="text-xs text-gray-400">Check-in</p>
                  <p className="font-medium">{format(new Date(booking.checkInDate), "d MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Nights</p>
                  <p className="font-medium">{booking.numberOfNights}</p>
                </div>
              </div>
            </div>

            <Separator />

            <fieldset disabled={isCancelled} className="space-y-5 disabled:opacity-50 disabled:pointer-events-none">
              {/* New check-in date */}
              <div className="space-y-2">
                <Label>New Check-in Date</Label>
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

              {/* Number of nights */}
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
                <p className="text-xs text-gray-500">Maximum stay is 3 nights</p>
              </div>

              {/* Preview */}
              {checkInDate && checkOutDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm text-blue-800">Requested Change Preview</h4>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <LogIn className="size-3.5 text-green-600" />
                        <span>Check-in</span>
                      </div>
                      <span className="font-medium">{format(checkInDate, "d MMM yyyy")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <LogOut className="size-3.5 text-red-500" />
                        <span>Check-out</span>
                      </div>
                      <span className="font-medium">{format(checkOutDate, "d MMM yyyy")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Moon className="size-3.5 text-indigo-500" />
                        <span>Nights</span>
                      </div>
                      <span className="font-medium">
                        {numberOfNights} {Number(numberOfNights) === 1 ? "night" : "nights"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </fieldset>

            <div className="flex gap-4 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.push("/bookings")}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={isLoading || !checkInDate || isCancelled}
                onClick={handleSubmitRequest}
              >
                {isLoading
                  ? <><Loader2 className="size-4 mr-2 animate-spin" /> Submitting…</>
                  : <><CheckCircle2 className="size-4 mr-2" /> Submit Request</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
