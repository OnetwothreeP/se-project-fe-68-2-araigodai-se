import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { CalendarIcon, Edit, Shield, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { format } from "date-fns";

interface Booking {
  id: string;
  userId: string;
  hotelId: string;
  checkInDate: string;
  numberOfNights: number;
  userName?: string;
  hotelName?: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [numberOfNights, setNumberOfNights] = useState<string>("1");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== "admin") {
          navigate("/hotels");
          return;
        }
      } catch (error) {
        navigate("/hotels");
        return;
      }
    } else {
      navigate("/login");
      return;
    }

    fetchAllBookings();
  }, []);

  const fetchAllBookings = async () => {
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
      // Mock admin data for demonstration
      setBookings([
        {
          id: "1",
          userId: "user_123",
          hotelId: "1",
          userName: "John Doe",
          hotelName: "Grand Plaza Hotel",
          checkInDate: "2026-04-15",
          numberOfNights: 2,
        },
        {
          id: "2",
          userId: "user_456",
          hotelId: "2",
          userName: "Jane Smith",
          hotelName: "Sunset Resort & Spa",
          checkInDate: "2026-05-20",
          numberOfNights: 3,
        },
        {
          id: "3",
          userId: "user_789",
          hotelId: "3",
          userName: "Bob Johnson",
          hotelName: "Mountain View Lodge",
          checkInDate: "2026-06-10",
          numberOfNights: 1,
        },
        {
          id: "4",
          userId: "user_123",
          hotelId: "4",
          userName: "John Doe",
          hotelName: "Downtown Business Hotel",
          checkInDate: "2026-07-05",
          numberOfNights: 2,
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

  const openEditDialog = (booking: Booking) => {
    setEditingBooking(booking);
    setCheckInDate(new Date(booking.checkInDate));
    setNumberOfNights(booking.numberOfNights.toString());
    setIsDialogOpen(true);
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking || !checkInDate) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/bookings/${editingBooking.id}`, {
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

      if (!response.ok) {
        throw new Error("Failed to update booking");
      }

      // Update local state
      setBookings(
        bookings.map((booking) =>
          booking.id === editingBooking.id
            ? {
                ...booking,
                checkInDate: format(checkInDate, "yyyy-MM-dd"),
                numberOfNights: Number(numberOfNights),
              }
            : booking
        )
      );

      setIsDialogOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update booking");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="size-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage all hotel bookings across the system</p>
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
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>
                Total bookings: {bookings.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>User Name</TableHead>
                      <TableHead>Hotel ID</TableHead>
                      <TableHead>Hotel Name</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Nights</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm">{booking.id}</TableCell>
                        <TableCell className="font-mono text-sm">{booking.userId}</TableCell>
                        <TableCell>{booking.userName || "N/A"}</TableCell>
                        <TableCell className="font-mono text-sm">{booking.hotelId}</TableCell>
                        <TableCell>{booking.hotelName || "N/A"}</TableCell>
                        <TableCell>
                          {format(new Date(booking.checkInDate), "PP")}
                        </TableCell>
                        <TableCell>{booking.numberOfNights}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(booking)}
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
                                    Are you sure you want to delete this booking? This action cannot be undone.
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Booking</DialogTitle>
              <DialogDescription>
                Update the booking details (max 3 nights)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingBooking && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                  <p>
                    <span className="text-gray-600">Booking ID:</span>{" "}
                    <span className="font-mono font-medium">{editingBooking.id}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">User:</span>{" "}
                    <span className="font-medium">{editingBooking.userName || editingBooking.userId}</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Check-in Date</Label>
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
                      onSelect={(date) => setCheckInDate(date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Number of Nights</Label>
                <Select value={numberOfNights} onValueChange={setNumberOfNights}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Night</SelectItem>
                    <SelectItem value="2">2 Nights</SelectItem>
                    <SelectItem value="3">3 Nights</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateBooking} disabled={isSaving || !checkInDate}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
