"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Check, Hotel, MapPin, Phone } from "lucide-react";
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
  roomTypes?: {
    id: string;
    name: string;
    pricePerNight: number;
    totalRooms: number;
  }[];
}

interface RoomType {
  id: string;
  name: string;
  pricePerNight: number;
  totalRooms: number;
  imageUrl: string;
  amenities: string[];
}

// Fallback static room types used when hotel has no roomTypes defined
const ROOM_TYPE_DEFAULTS: Record<string, { imageUrl: string; amenities: string[] }> = {
  standard: {
    imageUrl: "https://picsum.photos/seed/room-standard/600/400",
    amenities: ["Single Bed", "Private Bathroom", "32\" TV", "Free Wi-Fi", "Air Conditioning"],
  },
  deluxe: {
    imageUrl: "https://picsum.photos/seed/room-deluxe/600/400",
    amenities: ["Queen Size Bed", "Private Bathroom", "43\" TV", "Free Wi-Fi", "Air Conditioning", "City View", "Minibar & Refrigerator"],
  },
  suite: {
    imageUrl: "https://picsum.photos/seed/room-suite/600/400",
    amenities: ["King Size Bed", "Private Bathroom + Bathtub", "55\" TV", "Free Wi-Fi", "Air Conditioning", "Panoramic View", "Separate Living Room", "Minibar & Refrigerator", "Free Breakfast for 2"],
  },
};

const FALLBACK_ROOM_TYPES: RoomType[] = [
  { id: "standard", name: "Standard Room", pricePerNight: 1200, totalRooms: 10, ...ROOM_TYPE_DEFAULTS.standard },
  { id: "deluxe",   name: "Deluxe Room",   pricePerNight: 2500, totalRooms: 8,  ...ROOM_TYPE_DEFAULTS.deluxe  },
  { id: "suite",    name: "Suite Room",    pricePerNight: 5000, totalRooms: 4,  ...ROOM_TYPE_DEFAULTS.suite   },
];

export default function BookHotel() {
  const router = useRouter();
  const params = useParams();
  const hotelId = params.hotelId as string;

  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(FALLBACK_ROOM_TYPES);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [numberOfNights, setNumberOfNights] = useState<string>("1");
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const bookingFormRef = useRef<HTMLDivElement>(null);

  const { handleSubmit, setValue } = useForm<BookingFormData>();

  useEffect(() => {
    fetchHotelDetails();
  }, [hotelId]);

  const fetchHotelDetails = async () => {
    try {
      const data = await apiRequest(`/hotels/${hotelId}`);
      const h: HotelData = data.data;
      setHotel(h);
      // Build room types from hotel data, merging with static images/amenities
      if (h.roomTypes && h.roomTypes.length > 0) {
        const merged: RoomType[] = h.roomTypes.map((rt) => ({
          ...rt,
          imageUrl: ROOM_TYPE_DEFAULTS[rt.id]?.imageUrl ?? `https://picsum.photos/seed/room-${rt.id}/600/400`,
          amenities: ROOM_TYPE_DEFAULTS[rt.id]?.amenities ?? [],
        }));
        setRoomTypes(merged);
      } else {
        setRoomTypes(FALLBACK_ROOM_TYPES);
      }
    } catch {
      setError("Failed to load hotel details");
    }
  };

  const handleSelectRoom = (room: RoomType) => {
    setSelectedRoom(room);
    setTimeout(() => {
      bookingFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const onSubmit = async () => {
    if (!checkInDate) {
      setError("Please select a check-in date");
      return;
    }
    if (!selectedRoom) {
      setError("Please select a room type");
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
          roomType: selectedRoom.id,
        }),
      });
      router.push("/bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setIsLoading(false);
    }
  };

  const totalPrice = selectedRoom
    ? selectedRoom.pricePerNight * Number(numberOfNights)
    : 0;

  if (!hotel) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Hotel Info */}
        <Card>
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

        {/* Room Type Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Room Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roomTypes.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              return (
                <Card
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className={`cursor-pointer transition-all duration-200 overflow-hidden hover:shadow-lg flex flex-col ${
                    isSelected
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : "hover:ring-1 hover:ring-blue-300"
                  }`}
                >
                  <div className="relative h-44 overflow-hidden bg-gray-100">
                    <img
                      src={room.imageUrl}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                        <Check className="size-4" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base leading-tight">{room.name}</h3>
                      <Badge
                        variant="secondary"
                        className="text-blue-700 bg-blue-100 whitespace-nowrap shrink-0"
                      >
                        ฿{room.pricePerNight.toLocaleString()}/night
                      </Badge>
                    </div>

                    <Separator className="my-3" />

                    <ul className="space-y-1.5 flex-1">
                      {room.amenities.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="size-3.5 text-green-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      type="button"
                      size="sm"
                      className="w-full mt-4"
                      variant={isSelected ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRoom(room);
                      }}
                    >
                      {isSelected ? "Selected" : "Select Room"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Booking Form */}
        {selectedRoom && (
          <div ref={bookingFormRef}>
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>
                  Selected room: <span className="font-medium text-blue-700">{selectedRoom.name}</span>
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
                    <Label>Number of Nights</Label>
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

                  {checkInDate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-sm">Booking Summary</h4>
                      <Separator />
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Room Type</span>
                          <span className="font-medium">{selectedRoom.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Check-in</span>
                          <span className="font-medium">{format(checkInDate, "PPP")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Check-out</span>
                          <span className="font-medium">
                            {format(
                              new Date(checkInDate.getTime() + Number(numberOfNights) * 86400000),
                              "PPP"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nights</span>
                          <span className="font-medium">{numberOfNights} {Number(numberOfNights) === 1 ? "night" : "nights"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price per Night</span>
                          <span className="font-medium">฿{selectedRoom.pricePerNight.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-base font-bold">
                          <span>Total Price</span>
                          <span className="text-blue-700">฿{totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>

                <div className="px-6 pb-6 flex gap-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => router.push("/hotels")}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading || !checkInDate}>
                    {isLoading ? "Booking..." : "Confirm Booking"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
