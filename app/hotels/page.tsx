"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, MapPin, Phone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/api";

interface HotelType {
  _id: string;
  name: string;
  address: string;
  telephone: string;
}

interface JwtPayload {
  role: string;
}

function decodeToken(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function Hotels() {
  const router = useRouter();
  const [allHotels, setAllHotels] = useState<HotelType[]>([]); // Store all hotels
  const [hotels, setHotels] = useState<HotelType[]>([]); // Display hotels for current page
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>("name");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check user role first before doing anything
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded) {
      router.replace("/login");
      return;
    }

    // Redirect owners and admins away from hotels page
    if (decoded.role === "owner") {
      router.replace("/owner/hotels");
      return;
    }
    if (decoded.role === "admin") {
      router.replace("/admin");
      return;
    }

    // Only regular users can proceed (any role that's not owner or admin)
    setUserRole(decoded.role);
    setIsCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (!isCheckingAuth) {
      fetchHotels();
    }
  }, [sortBy, isCheckingAuth]);

  useEffect(() => {
    // Update displayed hotels when page or limit changes
    paginateHotels();
  }, [page, limit, allHotels]);

  const fetchHotels = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Fetch all hotels (backend doesn't paginate properly)
      const data = await apiRequest(`/hotels?sort=${sortBy}`);
      
      console.log("API Response:", data);
      
      if (data.data && Array.isArray(data.data)) {
        setAllHotels(data.data);
      } else {
        setAllHotels([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch hotels");
      setAllHotels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const paginateHotels = () => {
    // Client-side pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedHotels = allHotels.slice(startIndex, endIndex);
    
    setHotels(paginatedHotels);
    setTotalPages(Math.ceil(allHotels.length / limit));
  };

  const handleBookNow = (hotelId: string) => {
    router.push(`/hotels/${hotelId}/book`);
  };

  const getHotelImage = (index: number) => {
    const images = [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop",
    ];
    return images[index % images.length];
  };

  // Don't render anything while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Available Hotels</h1>
          <p className="text-gray-600">Browse and book your perfect stay</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select 
              value={sortBy} 
              onValueChange={(val) => {
                setSortBy(val);
                setPage(1); // Reset to page 1 when changing sort
              }}
            >
              <SelectTrigger className="w-40 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="address">Address</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Per page:</span>
            <Select 
              value={limit.toString()} 
              onValueChange={(val) => {
                setLimit(Number(val));
                setPage(1); // Reset to page 1 when changing limit
              }}
            >
              <SelectTrigger className="w-20 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="9">9</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <span className="font-semibold">Note:</span> {error}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel, index) => (
                <Card key={hotel._id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="relative w-full h-48 bg-gray-100">
                    <img
                      src={getHotelImage(index)}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-start gap-2">
                      <Hotel className="size-5 text-blue-600 mt-1 flex-shrink-0" />
                      {hotel.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="size-4 mt-0.5 flex-shrink-0" />
                      <span>{hotel.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="size-4 flex-shrink-0" />
                      <span>{hotel.telephone}</span>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => handleBookNow(hotel._id)}
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {hotels.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-500">No hotels available at the moment.</p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || isLoading}
                className="bg-white"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || isLoading}
                className="bg-white"
              >
                Next
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
