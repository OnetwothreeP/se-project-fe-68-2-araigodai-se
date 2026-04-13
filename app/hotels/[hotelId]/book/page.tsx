"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/src/app/components/ui/button";
import { Label } from "@/src/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/app/components/ui/card";
import { Alert, AlertDescription } from "@/src/app/components/ui/alert";
import { Calendar } from "@/src/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/app/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/app/components/ui/select";
import { CalendarIcon, Hotel, MapPin, Phone } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/api";

interface BookingFormData {
  checkInDate: Date;
  numberOfNights: number;
}

interface HotelData {
  _id: string;
  name: string;
  address: string;
  telephone: string;
}

export default function BookHotel() {
  const router = useRouter();
  const params = useParams();
  const hotelId = params.hotelId as string;
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [numberOfNights, setNumberOfNights] = useState<string>("1");

  const {
    handleSubmit,
    setValue,
  } = useForm<BookingFormData>();

  useEffect(() => {
    fetchHotelDetails();
  }, [hotelId]);

  const fetchHotelDetails = async () => {
    try {
      const data = await apiRequest(`/hotels/${hotelId}`);
      setHotel(data.data);
    } catch (err) {
      setError("Failed to load hotel details");
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!checkInDate) {
      setError("Please select a check-in date");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await apiRequest(`/hotels/${hotelId}/bookings`, {
        method: "POST",
        body: JSON.stringify({
          checkInDate: format(checkInDate, "yyyy-MM-dd"),
          numberOfNights: Number(numberOfNights),
        }),
      });

      router.push("/bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setIsLoading(false);
    }
  };

  if (!hotel) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="size-6 text-blue-600" />
              {hotel.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="size-4 mt-0.5 flex-shrink-0" />
              <span>{hotel.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="size-4 flex-shrink-0" />
              <span>{hotel.telephone}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Book Your Stay</CardTitle>
            <CardDescription>
              Select your check-in date and number of nights (maximum 3 nights)
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 mb-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="checkInDate">Check-in Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {checkInDate ? format(checkInDate, "PPP") : "Pick a date"}
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

              <div className="space-y-2">
                <Label htmlFor="numberOfNights">Number of Nights</Label>
                <Select
                  value={numberOfNights}
                  onValueChange={(value) => {
                    setNumberOfNights(value);
                    setValue("numberOfNights", Number(value));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select number of nights" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Night</SelectItem>
                    <SelectItem value="2">2 Nights</SelectItem>
                    <SelectItem value="3">3 Nights</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Maximum stay is 3 nights</p>
              </div>

              {checkInDate && numberOfNights && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Booking Summary</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-600">Check-in:</span>{" "}
                      <span className="font-medium">{format(checkInDate, "PPP")}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Nights:</span>{" "}
                      <span className="font-medium">{numberOfNights}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Check-out:</span>{" "}
                      <span className="font-medium">
                        {format(
                          new Date(checkInDate.getTime() + Number(numberOfNights) * 24 * 60 * 60 * 1000),
                          "PPP"
                        )}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            <div className="px-6 pb-6 flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/hotels")}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || !checkInDate}>
                {isLoading ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
