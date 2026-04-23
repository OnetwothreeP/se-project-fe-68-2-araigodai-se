import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { CalendarIcon, Check, Hotel, MapPin, Phone } from "lucide-react";
import { format } from "date-fns";
import Navbar from "../components/Navbar";

interface BookingFormData {
  checkInDate: Date;
  numberOfNights: number;
}

interface HotelData {
  id: string;
  name: string;
  address: string;
  telephone: string;
}

interface RoomType {
  id: string;
  name: string;
  pricePerNight: number;
  imageUrl: string;
  amenities: string[];
}

// Static room types — replace with API data when backend supports it
const ROOM_TYPES: RoomType[] = [
  {
    id: "standard",
    name: "Standard Room",
    pricePerNight: 1200,
    imageUrl: "https://picsum.photos/seed/room-standard/600/400",
    amenities: [
      "เตียงเดี่ยว 1 หลัง",
      "ห้องน้ำในตัว",
      "TV 32 นิ้ว",
      "Wi-Fi ฟรี",
      "เครื่องปรับอากาศ",
    ],
  },
  {
    id: "deluxe",
    name: "Deluxe Room",
    pricePerNight: 2500,
    imageUrl: "https://picsum.photos/seed/room-deluxe/600/400",
    amenities: [
      "เตียงคู่ Queen Size",
      "ห้องน้ำในตัว",
      "TV 43 นิ้ว",
      "Wi-Fi ฟรี",
      "เครื่องปรับอากาศ",
      "วิวเมือง",
      "ตู้เย็น & Minibar",
    ],
  },
  {
    id: "suite",
    name: "Suite Room",
    pricePerNight: 5000,
    imageUrl: "https://picsum.photos/seed/room-suite/600/400",
    amenities: [
      "เตียง King Size",
      "ห้องน้ำในตัว + อ่างอาบน้ำ",
      "TV 55 นิ้ว",
      "Wi-Fi ฟรี",
      "เครื่องปรับอากาศ",
      "วิวพาโนรามา",
      "ห้องนั่งเล่นแยก",
      "ตู้เย็น & Minibar",
      "อาหารเช้าฟรี 2 ท่าน",
    ],
  },
];

export default function BookHotel() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hotel, setHotel] = useState<HotelData | null>(null);
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
      const token = localStorage.getItem("token");
      const response = await fetch(`/hotels/${hotelId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch hotel details");
      const data = await response.json();
      setHotel(data);
    } catch {
      setHotel({
        id: hotelId || "1",
        name: "Grand Plaza Hotel",
        address: "123 Main Street, New York, NY 10001",
        telephone: "+1 (555) 123-4567",
      });
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
      setError("กรุณาเลือกวันเช็คอิน");
      return;
    }
    if (!selectedRoom) {
      setError("กรุณาเลือกประเภทห้อง");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/hotels/${hotelId}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          checkInDate: format(checkInDate, "yyyy-MM-dd"),
          numberOfNights: Number(numberOfNights),
          roomType: selectedRoom.id,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Booking failed");
      navigate("/bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during booking");
    } finally {
      setIsLoading(false);
    }
  };

  const totalPrice = selectedRoom
    ? selectedRoom.pricePerNight * Number(numberOfNights)
    : 0;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hotel Info */}
        {hotel && (
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
        )}

        {/* Room Type Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-4">เลือกประเภทห้อง</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROOM_TYPES.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              return (
                <Card
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className={`cursor-pointer transition-all duration-200 overflow-hidden hover:shadow-lg ${
                    isSelected
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : "hover:ring-1 hover:ring-blue-300"
                  }`}
                >
                  {/* Room Image */}
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

                  <CardContent className="p-4 space-y-3">
                    {/* Name & Price */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base leading-tight">{room.name}</h3>
                      <Badge
                        variant="secondary"
                        className="text-blue-700 bg-blue-100 whitespace-nowrap shrink-0"
                      >
                        ฿{room.pricePerNight.toLocaleString()}/คืน
                      </Badge>
                    </div>

                    <Separator />

                    {/* Amenities Checklist */}
                    <ul className="space-y-1.5">
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
                      className="w-full mt-2"
                      variant={isSelected ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRoom(room);
                      }}
                    >
                      {isSelected ? "เลือกแล้ว" : "เลือกห้องนี้"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Booking Form — shown after room selected */}
        {selectedRoom && (
          <div ref={bookingFormRef}>
            <Card>
              <CardHeader>
                <CardTitle>รายละเอียดการจอง</CardTitle>
                <CardDescription>
                  ห้องที่เลือก: <span className="font-medium text-blue-700">{selectedRoom.name}</span>
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

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

                  {/* Booking Summary */}
                  {checkInDate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-sm">สรุปการจอง</h4>
                      <Separator />
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">ประเภทห้อง</span>
                          <span className="font-medium">{selectedRoom.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">เช็คอิน</span>
                          <span className="font-medium">{format(checkInDate, "PPP")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">เช็คเอาต์</span>
                          <span className="font-medium">
                            {format(
                              new Date(checkInDate.getTime() + Number(numberOfNights) * 86400000),
                              "PPP"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">จำนวนคืน</span>
                          <span className="font-medium">{numberOfNights} คืน</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">ราคาต่อคืน</span>
                          <span className="font-medium">
                            ฿{selectedRoom.pricePerNight.toLocaleString()}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-base font-bold">
                          <span>ราคารวม</span>
                          <span className="text-blue-700">฿{totalPrice.toLocaleString()}</span>
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
                    onClick={() => navigate("/hotels")}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading || !checkInDate}
                  >
                    {isLoading ? "กำลังจอง..." : "ยืนยันการจอง"}
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
