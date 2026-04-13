import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Calendar, Edit, Hotel, Moon, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { format } from "date-fns";

interface Booking {
  id: string;
  hotelId: string;
  checkInDate: string;
  numberOfNights: number;
  hotelName?: string;
}

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await response.json();
      setBookings(Array.isArray(data) ? data : data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
      // Mock data for demonstration
      setBookings([
        {
          id: "1",
          hotelId: "1",
          hotelName: "Grand Plaza Hotel",
          checkInDate: "2026-04-15",
          numberOfNights: 2,
        },
        {
          id: "2",
          hotelId: "2",
          hotelName: "Sunset Resort & Spa",
          checkInDate: "2026-05-20",
          numberOfNights: 3,
        },
        {
          id: "3",
          hotelId: "3",
          hotelName: "Mountain View Lodge",
          checkInDate: "2026-06-10",
          numberOfNights: 1,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (bookingId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete booking");
      }

      // Remove from local state
      setBookings(bookings.filter((booking) => booking.id !== bookingId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete booking");
    }
  };

  const handleEdit = (bookingId: string) => {
    navigate(`/bookings/${bookingId}/edit`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your hotel reservations</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              {error} - Showing sample data instead
            </p>
          </div>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Hotel className="size-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-4">Start planning your next trip!</p>
              <Button onClick={() => navigate("/hotels")}>Browse Hotels</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>Your Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hotel ID</TableHead>
                      <TableHead>Hotel Name</TableHead>
                      <TableHead>Check-in Date</TableHead>
                      <TableHead>Nights</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm">{booking.hotelId}</TableCell>
                        <TableCell className="font-medium">{booking.hotelName || "N/A"}</TableCell>
                        <TableCell>
                          {format(new Date(booking.checkInDate), "PPP")}
                        </TableCell>
                        <TableCell>{booking.numberOfNights}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(booking.id)}
                            >
                              <Edit className="size-4 mr-1" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="size-4 mr-1 text-red-500" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this booking? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(booking.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{booking.hotelName || `Hotel ${booking.hotelId}`}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4 text-gray-500" />
                      <span>{format(new Date(booking.checkInDate), "PPP")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Moon className="size-4 text-gray-500" />
                      <span>{booking.numberOfNights} night{booking.numberOfNights > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(booking.id)}
                      >
                        <Edit className="size-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            <Trash2 className="size-4 mr-1 text-red-500" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this booking? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(booking.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
