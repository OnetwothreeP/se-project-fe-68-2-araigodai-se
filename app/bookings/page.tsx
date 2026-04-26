"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Edit, Hotel, LogIn, LogOut, Moon, Trash2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { apiRequest } from "@/lib/api";

interface Booking {
  _id: string;
  hotel: {
    _id: string;
    name: string;
    address?: string;
    telephone?: string;
  };
  checkInDate: string;
  numberOfNights: number;
  createdAt?: string;
}

function getCheckOutDate(checkInDate: string, numberOfNights: number): Date {
  return addDays(new Date(checkInDate), numberOfNights);
}

function shortId(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

export default function MyBookings() {
  const router = useRouter();
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
      const data = await apiRequest("/bookings");
      setBookings(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (bookingId: string) => {
    try {
      await apiRequest(`/bookings/${bookingId}`, { method: "DELETE" });
      setBookings(bookings.filter((b) => b._id !== bookingId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete booking");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your hotel reservations</p>
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
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded" />
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
              <Button onClick={() => router.push("/hotels")}>Browse Hotels</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>Your Reservations ({bookings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Booking</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead className="text-center">Nights</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const checkOut = getCheckOutDate(booking.checkInDate, booking.numberOfNights);
                      return (
                        <TableRow key={booking._id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {shortId(booking._id)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{booking.hotel.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <LogIn className="size-3.5 text-green-600" />
                              {format(new Date(booking.checkInDate), "d MMM yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <LogOut className="size-3.5 text-red-500" />
                              {format(checkOut, "d MMM yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1 text-sm">
                              <Moon className="size-3.5 text-indigo-500" />
                              {booking.numberOfNights}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/bookings/${booking._id}/edit`)}
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
                                    <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to cancel your booking at{" "}
                                      <span className="font-semibold">{booking.hotel.name}</span>{" "}
                                      (check-in {format(new Date(booking.checkInDate), "d MMM yyyy")})?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(booking._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Confirm Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {bookings.map((booking) => {
                const checkOut = getCheckOutDate(booking.checkInDate, booking.numberOfNights);
                return (
                  <Card key={booking._id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{booking.hotel.name}</CardTitle>
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                          {shortId(booking._id)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <LogIn className="size-4 text-green-600 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Check-in</p>
                            <p className="font-medium">{format(new Date(booking.checkInDate), "d MMM yyyy")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <LogOut className="size-4 text-red-500 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Check-out</p>
                            <p className="font-medium">{format(checkOut, "d MMM yyyy")}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Moon className="size-4 text-indigo-500 shrink-0" />
                        <span>{booking.numberOfNights} {booking.numberOfNights === 1 ? "night" : "nights"}</span>
                      </div>
                      {booking.createdAt && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CalendarDays className="size-3.5 shrink-0" />
                          <span>Booked on {format(new Date(booking.createdAt), "d MMM yyyy")}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/bookings/${booking._id}/edit`)}
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
                              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel your booking at{" "}
                                <span className="font-semibold">{booking.hotel.name}</span>{" "}
                                (check-in {format(new Date(booking.checkInDate), "d MMM yyyy")})?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(booking._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Confirm Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
