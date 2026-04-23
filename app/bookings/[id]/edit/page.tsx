"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Hotel, LogIn, LogOut, Moon } from "lucide-react";
import { format, addDays } from "date-fns";
import { apiRequest } from "@/lib/api";

interface BookingFormData {
  checkInDate: Date;
  numberOfNights: number;
}

interface Booking {
  _id: string;
  hotel: {
    _id: string;
    name: string;
    address?: string;
    telephone?: string;
  };
  checkInDate: string;
  numberOfNights: number;
  createdAt?: string;
}

export default function EditBooking() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [numberOfNights, setNumberOfNights] = useState<string>("1");

  const { handleSubmit, setValue } = useForm<BookingFormData>();

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    setIsFetching(true);
    try {
      const data = await apiRequest(`/bookings/${bookingId}`);
      const b: Booking = data.data;
      setBooking(b);
      const date = new Date(b.checkInDate);
      setCheckInDate(date);
      setNumberOfNights(b.numberOfNights.toString());
      setValue("checkInDate", date);
      setValue("numberOfNights", b.numberOfNights);
    } catch {
      setError("Failed to load booking");
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async () => {
    if (!checkInDate) {
      setError("Please select a check-in date");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await apiRequest(`/bookings/${bookingId}`, {
        method: "PUT",
        body: JSON.stringify({
          checkInDate: format(checkInDate, "yyyy-MM-dd"),
          numberOfNights: Number(numberOfNights),
        }),
      });
      router.push("/bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking");
    } finally {
      setIsLoading(false);
    }
  };

  const checkOutDate = checkInDate ? addDays(checkInDate, Number(numberOfNights)) : null;

  if (isFetching) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-12 bg-gray-200 rounded" />
                <div className="h-12 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>Edit Booking</CardTitle>
                <CardDescription>
                  Update your check-in date and number of nights (maximum 3 nights)
                </CardDescription>
              </div>
              {booking && (
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  #{booking._id.slice(-6).toUpperCase()}
                </Badge>
              )}
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 mb-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Booking Info Summary */}
              {booking && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Hotel className="size-4 text-blue-600" />
                    {booking.hotel.name}
                  </div>
                  {booking.hotel.address && (
                    <p className="text-xs text-gray-500 pl-6">{booking.hotel.address}</p>
                  )}
                  {booking.createdAt && (
                    <p className="text-xs text-gray-400 pl-6">
                      จองเมื่อ {format(new Date(booking.createdAt), "d MMM yyyy, HH:mm")}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              {/* Check-in Date */}
              <div className="space-y-2">
                <Label>วันเช็คอิน</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {checkInDate ? format(checkInDate, "PPP") : "เลือกวันที่"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkInDate}
                      onSelect={(date) => {
                        setCheckInDate(date);
                        if (date) setValue("checkInDate", date);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Number of Nights */}
              <div className="space-y-2">
                <Label>จำนวนคืน</Label>
                <Select
                  value={numberOfNights}
                  onValueChange={(value) => {
                    setNumberOfNights(value);
                    setValue("numberOfNights", Number(value));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกจำนวนคืน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 คืน</SelectItem>
                    <SelectItem value="2">2 คืน</SelectItem>
                    <SelectItem value="3">3 คืน</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">จำนวนคืนสูงสุด 3 คืน</p>
              </div>

              {/* Updated Booking Summary */}
              {checkInDate && checkOutDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm">สรุปการจองที่อัปเดต</h4>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <LogIn className="size-3.5 text-green-600" />
                        <span>เช็คอิน</span>
                      </div>
                      <span className="font-medium">{format(checkInDate, "d MMM yyyy")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <LogOut className="size-3.5 text-red-500" />
                        <span>เช็คเอาต์</span>
                      </div>
                      <span className="font-medium">{format(checkOutDate, "d MMM yyyy")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Moon className="size-3.5 text-indigo-500" />
                        <span>จำนวนคืน</span>
                      </div>
                      <span className="font-medium">{numberOfNights} คืน</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <div className="px-6 pb-6 flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/bookings")}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !checkInDate}
              >
                {isLoading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
