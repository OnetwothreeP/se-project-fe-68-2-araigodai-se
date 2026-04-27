"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, QrCode, ShieldCheck, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { apiRequest } from "@/lib/api";

interface Booking {
  _id: string;
  hotel: { _id: string; name: string; pricePerNight?: number };
  checkInDate: string;
  numberOfNights: number;
  totalPrice: number;
  paymentStatus: string;
  status: string;
  amountPaid?: number;
}

type PayMethod = "card" | "promptpay";

function fmtMoney(n: number) {
  return `฿${n.toLocaleString()}`;
}

function fmtCountdown(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// Simple deterministic QR-like SVG (visual only)
function QRCodeSVG({ size = 180 }: { size?: number }) {
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,1,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,0,1,0,1,1,0,1,1,0,1],
    [0,1,0,0,1,0,0,0,1,0,0,1,0,0,1,0,0,1,0],
    [1,1,0,1,0,1,1,1,0,1,1,0,1,1,0,1,0,1,1],
    [0,0,0,0,0,0,0,0,1,0,1,1,0,1,0,0,1,0,0],
    [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,1,0,1,1,0,1,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,0,1,0,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,1,0,1,0,1,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,0,0,1,0,1,0,1,1,1,1,1],
  ];
  const cols = pattern[0].length;
  const rows = pattern.length;
  const cell = (size - 16) / cols;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ border: "4px solid #0f172a", borderRadius: 8, background: "#fff" }}>
      {pattern.map((row, r) =>
        row.map((v, c) =>
          v ? (
            <rect
              key={`${r}-${c}`}
              x={8 + c * cell}
              y={8 + r * cell}
              width={cell - 1}
              height={cell - 1}
              rx="1"
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [method, setMethod] = useState<PayMethod>("card");
  const [paying, setPaying] = useState(false);

  // QR countdown (15 min = 900s)
  const [qrShown, setQrShown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Countdown timer for QR
  useEffect(() => {
    if (method !== "promptpay" || !qrShown || timedOut) return;
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(iv); setTimedOut(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [method, qrShown, timedOut]);

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

  function handleSwitchMethod(m: PayMethod) {
    setMethod(m);
    if (m === "promptpay") { setTimeLeft(900); setTimedOut(false); setQrShown(false); }
  }

  function handleGenerateQR() {
    setTimeLeft(900);
    setTimedOut(false);
    setQrShown(true);
  }

  async function handlePay() {
    if (!booking) return;
    setPaying(true);
    try {
      // POST /api/v1/bookings/:id/mock-pay — 2s simulated delay on backend
      await apiRequest(`/bookings/${booking._id}/mock-pay`, { method: "POST" });
      router.push(`/bookings/${booking._id}/confirmation`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setPaying(false);
    }
  }

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
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{fetchError || "Booking not found"}</div>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/bookings")}>
            <ArrowLeft className="size-4 mr-1" /> Back to My Bookings
          </Button>
        </div>
      </div>
    );
  }

  const total = booking.totalPrice || 0;
  const checkOut = addDays(new Date(booking.checkInDate), booking.numberOfNights);
  const shortId = `#${booking._id.slice(-6).toUpperCase()}`;

  // ── Edge: already cancelled ──
  if (booking.status === "cancelled") {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-xl mx-auto px-4 py-8">
          <Button variant="ghost" size="sm" className="mb-4 text-gray-500" onClick={() => router.push("/bookings")}>
            <ArrowLeft className="size-4 mr-1" /> Back to My Bookings
          </Button>
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-2xl font-bold">Complete Your Payment</h1>
            <Badge variant="outline" className="font-mono text-xs">{shortId}</Badge>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700 text-sm">
            <XCircle className="size-4 shrink-0" />
            This booking has been cancelled. Payment is not available.
          </div>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/bookings")}>
            Return to My Bookings
          </Button>
        </div>
      </div>
    );
  }

  // ── Edge: already paid/confirmed ──
  if (booking.status === "confirmed" || booking.paymentStatus === "paid") {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-xl mx-auto px-4 py-8">
          <Button variant="ghost" size="sm" className="mb-4 text-gray-500" onClick={() => router.push("/bookings")}>
            <ArrowLeft className="size-4 mr-1" /> Back to My Bookings
          </Button>
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-2xl font-bold">Complete Your Payment</h1>
            <Badge variant="outline" className="font-mono text-xs">{shortId}</Badge>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between gap-2 text-green-700 text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              This booking is already confirmed and paid.
            </span>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 shrink-0" onClick={() => router.push(`/bookings/${booking._id}/confirmation`)}>
              View Confirmation →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4 text-gray-500 -ml-2" onClick={() => router.push("/bookings")}>
          <ArrowLeft className="size-4 mr-1" /> Back to My Bookings
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">Complete Your Payment</h1>
          <Badge variant="outline" className="font-mono text-xs">{shortId}</Badge>
        </div>

        {/* Order Summary */}
        <Card className="mb-5">
          <CardContent className="pt-5">
            <p className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Order Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Hotel</span><span className="font-semibold">{booking.hotel.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Check-in</span><span>{format(new Date(booking.checkInDate), "d MMM yyyy")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Check-out</span><span>{format(checkOut, "d MMM yyyy")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Nights</span><span>{booking.numberOfNights}</span></div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-blue-600">{fmtMoney(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selector */}
        <div className="flex flex-col gap-3 mb-5">
          <button
            onClick={() => handleSwitchMethod("card")}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${method === "card" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-200"}`}
          >
            <CreditCard className={`size-5 shrink-0 ${method === "card" ? "text-blue-600" : "text-gray-400"}`} />
            <div>
              <p className="font-semibold text-sm">Pay by Card / Online Banking</p>
              <p className="text-xs text-gray-400">Visa, Mastercard, and bank transfer</p>
            </div>
          </button>
          <button
            onClick={() => handleSwitchMethod("promptpay")}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${method === "promptpay" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-200"}`}
          >
            <QrCode className={`size-5 shrink-0 ${method === "promptpay" ? "text-blue-600" : "text-gray-400"}`} />
            <div>
              <p className="font-semibold text-sm">Pay by QR Code (PromptPay)</p>
              <p className="text-xs text-gray-400">Scan with your banking app — expires in 15 min</p>
            </div>
          </button>
        </div>

        {/* Card Payment Form */}
        {method === "card" && (
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                <ShieldCheck className="size-3.5 text-blue-500" />
                Secured by Stripe — card details encrypted
              </div>
              {/* Mock Stripe fields */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="bg-white border border-gray-200 rounded-md px-3 py-2.5 flex justify-between text-sm text-gray-400">
                  <span>Card number</span><span>•••• •••• •••• ••••</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400">MM / YY</div>
                  <div className="bg-white border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400">CVC</div>
                </div>
              </div>
              <Button
                className="w-full mt-4"
                onClick={handlePay}
                disabled={paying}
              >
                {paying ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> Processing…</>
                ) : (
                  `Pay ${fmtMoney(total)}`
                )}
              </Button>
              {paying && (
                <p className="text-xs text-center text-gray-400 mt-2">Please wait, contacting your bank…</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* PromptPay QR */}
        {method === "promptpay" && (
          <Card>
            <CardContent className="pt-5">
              {/* Not yet generated */}
              {!qrShown && !timedOut && (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-4">Click below to generate your PromptPay QR code.</p>
                  <Button onClick={handleGenerateQR}>Generate QR Code</Button>
                </div>
              )}

              {/* QR shown + counting down */}
              {qrShown && !timedOut && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <p className="text-sm text-gray-500">Scan with your banking app</p>
                  <QRCodeSVG size={180} />
                  <div className={`text-4xl font-bold tabular-nums tracking-widest ${timeLeft < 60 ? "text-red-600" : "text-gray-800"}`}>
                    {fmtCountdown(timeLeft)}
                  </div>
                  <p className="text-xs text-gray-400">Time remaining</p>
                  <p className="text-sm text-gray-600">Amount: <strong>{fmtMoney(total)}</strong></p>
                  {/* Simulate confirm payment (calls mock-pay) */}
                  <Button onClick={handlePay} disabled={paying} className="w-full mt-2">
                    {paying ? (
                      <><Loader2 className="size-4 mr-2 animate-spin" /> Confirming…</>
                    ) : (
                      "Confirm Payment"
                    )}
                  </Button>
                  {paying && (
                    <p className="text-xs text-center text-gray-400">Please wait, contacting your bank…</p>
                  )}
                </div>
              )}

              {/* Timed out */}
              {timedOut && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm text-center w-full">
                    Transaction timed out. Please generate a new QR Code.
                  </div>
                  <Button onClick={handleGenerateQR}>Generate New QR</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
