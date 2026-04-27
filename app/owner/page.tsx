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
    if (!decoded || decoded.role !== "hotel_owner") {
      router.replace("/hotels");
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
          <div className="flex flex-col gap-3">
            {hotels.map((hotel) => (
              <div
                key={hotel._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🏨</span>
                  <div>
                    <div className="text-base font-semibold text-gray-900">{hotel.name}</div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <MapPin className="size-3.5 shrink-0" />
                      {hotel.address}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <Phone className="size-3.5 shrink-0" />
                      {hotel.telephone}
                    </div>
                  </div>
                </div>
                <Button onClick={() => router.push(`/owner/dashboard/${hotel._id}`)}>
                  View Dashboard →
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
