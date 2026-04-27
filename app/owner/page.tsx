"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Hotel, MapPin, Phone } from "lucide-react";

interface HotelItem {
  _id: string;
  name: string;
  address: string;
  telephone: string;
  description?: string;
  pricePerNight?: number;
  amenities?: string[];
}

interface JwtPayload {
  role: string;
  name?: string;
  id?: string;
}

function decodeToken(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function OwnerHotelList() {
  const router = useRouter();
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded || decoded.role !== "owner") {
      router.replace("/owner/hotels");
      return;
    }

    setOwnerName(decoded.name || "Owner");

    const fetchHotels = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/hotels/my-hotels`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.status === 403) {
          router.replace("/error/403");
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load hotels");
        }

        const data = await res.json();
        setHotels(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load hotels");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotels();
  }, [router]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-1">Welcome back,</p>
          <h1 className="text-3xl font-bold text-gray-900">{ownerName}</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your hotel properties</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-3 text-sm font-semibold text-gray-700">Your Hotels</div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <Hotel className="size-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">You have no hotels to manage.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hotels.map((hotel, index) => (
              <div
                key={hotel._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={getHotelImage(index)}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-semibold text-blue-600">
                    {hotel.pricePerNight ? `฿${hotel.pricePerNight.toLocaleString()}/night` : 'Price not set'}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="size-4 shrink-0 mt-0.5" />
                    <span>{hotel.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Phone className="size-4 shrink-0" />
                    <span>{hotel.telephone}</span>
                  </div>
                  {hotel.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{hotel.description}</p>
                  )}
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hotel.amenities.slice(0, 3).map((amenity, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          +{hotel.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  <Button 
                    onClick={() => router.push(`/owner/dashboard/${hotel._id}`)}
                    className="w-full"
                  >
                    Manage Hotel →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
