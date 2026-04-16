import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Hotel, MapPin, Phone } from "lucide-react";
import Navbar from "../components/Navbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

interface Hotel {
  id: string;
  name: string;
  address: string;
  telephone: string;
}

export default function Hotels() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>("name");

  useEffect(() => {
    fetchHotels();
  }, [page, limit, sortBy]);

  const fetchHotels = async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/hotels?page=${page}&limit=${limit}&sortBy=${sortBy}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch hotels");
      }

      const data = await response.json();
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(data)) {
        setHotels(data);
      } else {
        setHotels(data.hotels || data.data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hotels");
      // Mock data for demonstration
      setHotels([
        {
          id: "1",
          name: "Grand Plaza Hotel",
          address: "123 Main Street, New York, NY 10001",
          telephone: "+1 (555) 123-4567",
        },
        {
          id: "2",
          name: "Sunset Resort & Spa",
          address: "456 Beach Boulevard, Miami, FL 33139",
          telephone: "+1 (555) 234-5678",
        },
        {
          id: "3",
          name: "Mountain View Lodge",
          address: "789 Alpine Road, Denver, CO 80202",
          telephone: "+1 (555) 345-6789",
        },
        {
          id: "4",
          name: "Downtown Business Hotel",
          address: "321 Commerce Street, Chicago, IL 60601",
          telephone: "+1 (555) 456-7890",
        },
        {
          id: "5",
          name: "Coastal Paradise Inn",
          address: "654 Ocean Drive, San Diego, CA 92101",
          telephone: "+1 (555) 567-8901",
        },
        {
          id: "6",
          name: "Historic City Hotel",
          address: "987 Heritage Lane, Boston, MA 02108",
          telephone: "+1 (555) 678-9012",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookNow = (hotelId: string) => {
    navigate(`/hotels/${hotelId}/book`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Available Hotels</h1>
          <p className="text-gray-600">Browse and book your perfect stay</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
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
            <Select value={limit.toString()} onValueChange={(val) => setLimit(Number(val))}>
              <SelectTrigger className="w-20">
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
              <span className="font-semibold">Note:</span> {error}. Showing sample data for demonstration.
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
              {hotels.map((hotel) => (
                <Card key={hotel.id} className="hover:shadow-lg transition-shadow">
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
                      onClick={() => handleBookNow(hotel.id)}
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
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