"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Edit, Hotel, LogIn, LogOut, Moon, Plus, Shield, Trash2 } from "lucide-react";
import { format, addDays, isAfter } from "date-fns";
import { apiRequest } from "@/lib/api";

interface Booking {
  _id: string;
  user: string | { _id: string; name: string; email: string };
  hotel: string | { _id: string; name: string; address: string };
  checkInDate: string;
  numberOfNights: number;
  createdAt?: string;
}

interface Hotel {
  _id: string;
  name: string;
}

function shortId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

function getCheckOut(checkInDate: string, nights: number) {
  return addDays(new Date(checkInDate), nights);
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
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
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
    if (!checkInDate) return;
    setIsSaving(true);
    try {
      if (isCreating) {
        if (!selectedHotelId) { alert("Please select a hotel"); return; }
        await apiRequest(`/hotels/${selectedHotelId}/bookings`, {
          method: "POST",
          body: JSON.stringify({
            checkInDate: format(checkInDate, "yyyy-MM-dd"),
            numberOfNights: Number(numberOfNights),
          }),
        });
        await fetchAllBookings();
      } else if (editingBooking) {
        await apiRequest(`/bookings/${editingBooking._id}`, {
          method: "PUT",
          body: JSON.stringify({
            checkInDate: format(checkInDate, "yyyy-MM-dd"),
            numberOfNights: Number(numberOfNights),
          }),
        });
        setBookings((prev) =>
          prev.map((b) =>
            b._id === editingBooking._id
              ? { ...b, checkInDate: format(checkInDate, "yyyy-MM-dd"), numberOfNights: Number(numberOfNights) }
              : b
          )
        );
      }
      setIsDialogOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save booking");
    } finally {
      setIsSaving(false);
    }
  };

  const upcomingCount = bookings.filter((b) =>
    isAfter(new Date(b.checkInDate), new Date())
  ).length;

  const checkOutDate = checkInDate ? addDays(checkInDate, Number(numberOfNights)) : null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">จัดการการจองทั้งหมดในระบบ</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/hotels")}>
              <Hotel className="size-4 mr-2" />
              Manage Hotels
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="size-4 mr-2" />
              Create Booking
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">{bookings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-green-600">{upcomingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-1">Total Hotels</p>
              <p className="text-3xl font-bold text-indigo-600">{hotels.length}</p>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {/* Bookings Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              All Bookings
              <span className="ml-2 text-sm font-normal text-gray-500">({bookings.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Hotel className="size-10 mx-auto mb-3 opacity-40" />
                <p>ยังไม่มีการจอง</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
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
                      const hotelName = typeof booking.hotel === "object" ? booking.hotel.name : "—";
                      const checkOut = getCheckOut(booking.checkInDate, booking.numberOfNights);
                      const isUpcoming = isAfter(new Date(booking.checkInDate), new Date());
                      return (
                        <TableRow key={booking._id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="font-mono text-xs w-fit">
                                {shortId(booking._id)}
                              </Badge>
                              {isUpcoming && (
                                <Badge className="text-xs bg-green-100 text-green-700 border-0 w-fit">
                                  Upcoming
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{hotelName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <LogIn className="size-3.5 text-green-600 shrink-0" />
                              {format(new Date(booking.checkInDate), "d MMM yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <LogOut className="size-3.5 text-red-500 shrink-0" />
                              {format(checkOut, "d MMM yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1 text-sm">
                              <Moon className="size-3.5 text-indigo-400" />
                              {booking.numberOfNights}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(booking)}
                              >
                                <Edit className="size-3.5 mr-1" />
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="size-3.5 mr-1 text-red-500" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>ยืนยันการลบการจอง</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ต้องการลบการจอง {shortId(booking._id)} ที่{" "}
                                      <span className="font-semibold">{hotelName}</span>{" "}
                                      (เช็คอิน {format(new Date(booking.checkInDate), "d MMM yyyy")}) ใช่หรือไม่?
                                      การกระทำนี้ไม่สามารถย้อนกลับได้
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(booking._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      ยืนยันลบ
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create / Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isCreating ? "Create Booking" : "Edit Booking"}</DialogTitle>
              <DialogDescription>
                {isCreating ? "สร้างการจองใหม่ (สูงสุด 3 คืน)" : "แก้ไขรายละเอียดการจอง (สูงสุด 3 คืน)"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Current booking info (edit mode) */}
              {editingBooking && !isCreating && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {shortId(editingBooking._id)}
                    </Badge>
                  </div>
                  <p className="text-gray-600">
                    Hotel:{" "}
                    <span className="font-medium text-gray-900">
                      {typeof editingBooking.hotel === "object" ? editingBooking.hotel.name : editingBooking.hotel}
                    </span>
                  </p>
                </div>
              )}

              {/* Hotel select (create mode) */}
              {isCreating && (
                <div className="space-y-2">
                  <Label>Hotel</Label>
                  <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกโรงแรม" />
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
              )}

              {/* Check-in Date */}
              <div className="space-y-2">
                <Label>Check-in Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 size-4" />
                      {checkInDate ? format(checkInDate, "PPP") : "เลือกวันที่"}
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

              {/* Number of Nights */}
              <div className="space-y-2">
                <Label>จำนวนคืน</Label>
                <Select value={numberOfNights} onValueChange={setNumberOfNights}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 คืน</SelectItem>
                    <SelectItem value="2">2 คืน</SelectItem>
                    <SelectItem value="3">3 คืน</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Summary */}
              {checkInDate && checkOutDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold">สรุปการจอง</p>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <LogIn className="size-3.5 text-green-600" />
                        เช็คอิน
                      </div>
                      <span className="font-medium">{format(checkInDate, "d MMM yyyy")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <LogOut className="size-3.5 text-red-500" />
                        เช็คเอาต์
                      </div>
                      <span className="font-medium">{format(checkOutDate, "d MMM yyyy")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Moon className="size-3.5 text-indigo-500" />
                        จำนวนคืน
                      </div>
                      <span className="font-medium">{numberOfNights} คืน</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSaveBooking} disabled={isSaving || !checkInDate}>
                {isSaving ? "กำลังบันทึก..." : isCreating ? "สร้างการจอง" : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
