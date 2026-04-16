import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import Navbar from "../components/Navbar";

interface BookingFormData {
  checkInDate: Date;
  numberOfNights: number;
}

interface Booking {
  id: string;
  hotelId: string;
  checkInDate: string;
  numberOfNights: number;
}

export default function EditBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [numberOfNights, setNumberOfNights] = useState<string>("1");

  const {
    handleSubmit,
    setValue,
  } = useForm<BookingFormData>();

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    setIsFetching(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/bookings/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch booking");
      }

      const data = await response.json();
      setBooking(data);
      
      // Pre-fill form
      const date = new Date(data.checkInDate);
      setCheckInDate(date);
      setNumberOfNights(data.numberOfNights.toString());
      setValue("checkInDate", date);
      setValue("numberOfNights", data.numberOfNights);
    } catch (err) {
      // Mock booking data for demonstration
      const mockBooking = {
        id: id || "1",
        hotelId: "1",
        checkInDate: "2026-04-15",
        numberOfNights: 2,
      };
      setBooking(mockBooking);
      const date = new Date(mockBooking.checkInDate);
      setCheckInDate(date);
      setNumberOfNights(mockBooking.numberOfNights.toString());
      setValue("checkInDate", date);
      setValue("numberOfNights", mockBooking.numberOfNights);
    } finally {
      setIsFetching(false);
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
      const token = localStorage.getItem("token");
      const response = await fetch(`/bookings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          checkInDate: format(checkInDate, "yyyy-MM-dd"),
          numberOfNights: Number(numberOfNights),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Update failed");
      }

      // Redirect to bookings page
      navigate("/bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while updating");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Booking</CardTitle>
            <CardDescription>
              Update your check-in date and number of nights (maximum 3 nights)
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {booking && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Booking ID: <span className="font-mono font-medium">{booking.id}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Hotel ID: <span className="font-mono font-medium">{booking.hotelId}</span>
                  </p>
                </div>
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold mb-2">Updated Booking Summary</h4>
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
                onClick={() => navigate("/bookings")}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || !checkInDate}>
                {isLoading ? "Updating..." : "Update Booking"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
