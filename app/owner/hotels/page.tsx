"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Hotel as HotelIcon, MapPin, Phone, BedDouble, Save } from "lucide-react";import { apiRequest } from "@/lib/api";

interface Hotel {
  _id: string;
  name: string;
  address: string;
  telephone: string;
  description?: string;
  amenities?: string[];
  pricePerNight?: number;
  roomTypes?: RoomTypeDef[];
}

interface RoomTypeDef {
  id: "standard" | "deluxe" | "suite";
  name: string;
  pricePerNight: number;
  totalRooms: number;
  amenities: string[];
}

interface FormErrors {
  name?: string;
  address?: string;
  telephone?: string;
}

export default function OwnerHotelsManagement() {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    telephone: "",
    description: "",
    amenities: [] as string[],
    pricePerNight: 0,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Room types state
  const DEFAULT_ROOM_TYPES: RoomTypeDef[] = [
    {
      id: "standard",
      name: "Standard Room",
      pricePerNight: 1200,
      totalRooms: 10,
      amenities: ["Single Bed", "Private Bathroom", "32\" TV", "Free Wi-Fi", "Air Conditioning"],
    },
    {
      id: "deluxe",
      name: "Deluxe Room",
      pricePerNight: 2500,
      totalRooms: 8,
      amenities: [
        "Queen Size Bed",
        "Private Bathroom",
        "43\" TV",
        "Free Wi-Fi",
        "Air Conditioning",
        "City View",
        "Minibar",
      ],
    },
    {
      id: "suite",
      name: "Suite Room",
      pricePerNight: 5000,
      totalRooms: 4,
      amenities: [
        "King Size Bed",
        "Private Bathroom + Bathtub",
        "55\" TV",
        "Free Wi-Fi",
        "Air Conditioning",
        "Panoramic View",
        "Living Room",
        "Free Breakfast for 2",
      ],
    },
  ];
  const [roomTypes, setRoomTypes] = useState<RoomTypeDef[]>(DEFAULT_ROOM_TYPES);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchMyHotels();
  }, [router]);

  async function fetchMyHotels() {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiRequest("/hotels/my-hotels");
      setHotels(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hotels");
    } finally {
      setIsLoading(false);
    }
  }

  function openEditDialog(hotel: Hotel) {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      address: hotel.address,
      telephone: hotel.telephone,
      description: hotel.description || "",
      amenities: hotel.amenities || [],
      pricePerNight: hotel.pricePerNight || 0,
    });
    setFormErrors({});
    setRoomTypes(
      hotel.roomTypes && hotel.roomTypes.length > 0 ? hotel.roomTypes : DEFAULT_ROOM_TYPES
    );
    setIsDialogOpen(true);
  }

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!formData.name.trim()) errors.name = "Hotel name is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.telephone.trim()) errors.telephone = "Telephone is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSaveHotel() {
    if (!validate() || !editingHotel) return;
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        telephone: formData.telephone,
        description: formData.description,
        amenities: formData.amenities,
        pricePerNight: formData.pricePerNight,
        roomTypes,
      };

      const result = await apiRequest(`/hotels/${editingHotel._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setHotels((prev) =>
        prev.map((h) => (h._id === editingHotel._id ? result.data : h))
      );
      setIsDialogOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update hotel");
    } finally {
      setIsSaving(false);
    }
  }

  const getHotelImage = (index: number) => {
    const images = [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop",
    ];
    return images[index % images.length];
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/owner")}
            className="text-gray-500 hover:text-gray-900 -ml-2 w-fit"
          >
            <ArrowLeft className="size-4 mr-1" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <HotelIcon className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Hotels</h1>
            <p className="text-sm text-gray-500">
              Manage your hotel information, pricing, and room types
            </p>
          </div>
        </div>

        <Badge variant="secondary" className="text-sm px-3 py-1">
          {hotels.length} {hotels.length === 1 ? "hotel" : "hotels"}
        </Badge>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {/* Hotel Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200" />
                <CardContent className="pt-6 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-400">
              <HotelIcon className="size-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No hotels assigned</p>
              <p className="text-sm mt-1">Contact admin to assign a hotel to your account</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hotels.map((hotel, index) => (
              <Card
                key={hotel._id}
                className="flex flex-col hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={getHotelImage(index)}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="pt-5 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-lg leading-tight">{hotel.name}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="size-3.5 mt-0.5 shrink-0 text-gray-400" />
                      <span className="line-clamp-2">{hotel.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="size-3.5 shrink-0 text-gray-400" />
                      <span>{hotel.telephone}</span>
                    </div>
                  </div>
                                </CardContent>
                <CardFooter className="pt-0 pb-4 px-5">
                  <Button className="w-full" onClick={() => openEditDialog(hotel)}>
                    <Edit className="size-4 mr-2" />
                    Edit Hotel Information
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Hotel Information</DialogTitle>
              <DialogDescription>
                Update your hotel details, pricing, and room configurations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    Hotel Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Grand Plaza Hotel"
                    className={formErrors.name ? "border-red-400" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-500">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Sukhumvit Road, Bangkok"
                    className={formErrors.address ? "border-red-400" : ""}
                  />
                  {formErrors.address && (
                    <p className="text-xs text-red-500">{formErrors.address}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telephone">
                    Telephone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="02-xxx-xxxx"
                    className={formErrors.telephone ? "border-red-400" : ""}
                  />
                  {formErrors.telephone && (
                    <p className="text-xs text-red-500">{formErrors.telephone}</p>
                  )}
                </div>
              </div>

              {/* Room Types */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <BedDouble className="size-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-700">Room Types & Pricing</h3>
                </div>
                <div className="space-y-3">
                  {roomTypes.map((rt, idx) => (
                    <div
                      key={rt.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{rt.name}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {rt.id}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Price / Night (฿)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={rt.pricePerNight}
                            onChange={(e) => {
                              const updated = [...roomTypes];
                              updated[idx] = {
                                ...updated[idx],
                                pricePerNight: Number(e.target.value),
                              };
                              setRoomTypes(updated);
                            }}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Total Rooms</Label>
                          <Input
                            type="number"
                            min={1}
                            value={rt.totalRooms}
                            onChange={(e) => {
                              const updated = [...roomTypes];
                              updated[idx] = {
                                ...updated[idx],
                                totalRooms: Number(e.target.value),
                              };
                              setRoomTypes(updated);
                            }}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">
                          Room Amenities (comma-separated)
                        </Label>
                        <Input
                          value={rt.amenities?.join(", ") ?? ""}
                          onChange={(e) => {
                            const updated = [...roomTypes];
                            updated[idx] = {
                              ...updated[idx],
                              amenities: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            };
                            setRoomTypes(updated);
                          }}
                          placeholder="Free Wi-Fi, Air Conditioning, TV"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveHotel} disabled={isSaving}>
                <Save className="size-4 mr-2" />
                {isSaving ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
