"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/app/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/src/app/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/app/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/app/components/ui/dialog";
import { Label } from "@/src/app/components/ui/label";
import { Input } from "@/src/app/components/ui/input";
import { Calendar } from "@/src/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/app/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/app/components/ui/select";
import { CalendarIcon, Edit, Plus, Shield, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/api";

interface Booking {
  _id: string;
  user: string | {
    _id: string;
    name: string;
    email: string;
  };
  hotel: string | {
    _id: string;
    name: string;
  };
  checkInDate: string;
  numberOfNights: number;
}

interface Hotel {
  _id: string;
  name: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [numberOfNights, setNumberOfNights] = useState<string>("1");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    fetchAllBookings();
    fetchHotels();
  }, []);

  const fetchAllBookings = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiRequest("/bookings");
      setBookings(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const data = await apiRequest("/hotels");
      setHotels(data.data || []);
    } catch (err) {
      console.error("Failed to fetch hotels", err);
    }
  };

  const handleDelete = async (bookingId: string) => {
    try {
      await apiRequest(`/bookings/${bookingId}`, { method: "DELETE" });
      setBookings(bookings.filter((booking) => booking._id !== bookingId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete booking");
    }
  };

  const openCreateDialog = () => {
    setIsCreating(true);
    setEditingBooking(null);
    setCheckInDate(undefined);
    setNumberOfNights("1");
    setSelectedHotelId("");
    setSelectedUserId("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (booking: Booking) => {
    setIsCreating(false);
    setEditingBooking(booking);
    setCheckInDate(new Date(booking.checkInDate));
    setNumberOfNights(booking.numberOfNights.toString());
    setIsDialogOpen(true);
  };

  const handleSaveBooking = async () => {
    if (!checkInDate) {
      alert("Please select a check-in date");
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        // Create new booking - Note: API creates booking for authenticated user only
        if (!selectedHotelId) {
          alert("Please select a hotel");
          return;
        }

        const result = await apiRequest(`/hotels/${selectedHotelId}/bookings`, {
          method: "POST",
          body: JSON.stringify({
            checkInDate: format(checkInDate, "yyyy-MM-dd"),
            numberOfNights: Number(numberOfNights),
          }),
        });

        // Refresh bookings list
        await fetchAllBookings();
      } else if (editingBooking) {
        // Update existing booking
        await apiRequest(`/bookings/${editingBooking._id}`, {
          method: "PUT",
          body: JSON.stringify({
            checkInDate: format(checkInDate, "yyyy-MM-dd"),
            numberOfNights: Number(numberOfNights),
          }),
        });

        setBookings(
          bookings.map((booking) =>
            booking._id === editingBooking._id
              ? {
                  ...booking,
                  checkInDate: format(checkInDate, "yyyy-MM-dd"),
                  numberOfNights: Number(numberOfNights),
                }
              : booking
          )
        );
      }

      setIsDialogOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${isCreating ? "create" : "update"} booking`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="size-8 text-blue-600" />
              <h1 className="text-3xl font-bold">All Bookings</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/admin/hotels")}>
                Manage Hotels
              </Button>
              <Button onClick={openCreateDialog}>
                <Plus className="size-4 mr-2" />
                Create Booking
              </Button>
            </div>
          </div>
          <p className="text-gray-600">View and manage all hotel bookings across the system</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">{error}</p>
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
                      <TableHead>Hotel ID</TableHead>
                      <TableHead>Hotel Name</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Nights</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell className="font-mono text-sm">{booking._id}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {typeof booking.user === 'object' ? booking.user._id : booking.user}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {typeof booking.hotel === 'object' ? booking.hotel._id : booking.hotel}
                        </TableCell>
                        <TableCell>
                          {typeof booking.hotel === 'object' ? booking.hotel.name : "N/A"}
                        </TableCell>
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
                                    onClick={() => handleDelete(booking._id)}
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

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isCreating ? "Create New Booking" : "Edit Booking"}</DialogTitle>
              <DialogDescription>
                {isCreating ? "Create a booking (max 3 nights)" : "Update the booking details (max 3 nights)"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingBooking && !isCreating && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                  <p>
                    <span className="text-gray-600">Booking ID:</span>{" "}
                    <span className="font-mono font-medium">{editingBooking._id}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">User:</span>{" "}
                    <span className="font-medium font-mono text-xs">
                      {typeof editingBooking.user === 'object' ? editingBooking.user._id : editingBooking.user}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Hotel:</span>{" "}
                    <span className="font-medium">
                      {typeof editingBooking.hotel === 'object' ? editingBooking.hotel.name : editingBooking.hotel}
                    </span>
                  </p>
                </div>
              )}

              {isCreating && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="hotelId">Hotel</Label>
                    <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hotels.map((hotel) => (
                          <SelectItem key={hotel._id} value={hotel._id}>
                            {hotel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p className="text-blue-800">
                      Note: The booking will be created for the currently logged-in admin user.
                    </p>
                  </div>
                </>
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

              {checkInDate && numberOfNights && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <h4 className="font-semibold mb-1">Booking Summary</h4>
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
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveBooking} disabled={isSaving || !checkInDate}>
                {isSaving ? "Saving..." : isCreating ? "Create Booking" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
