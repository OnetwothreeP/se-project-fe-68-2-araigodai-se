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
import { Edit, Hotel as HotelIcon, Plus, Shield, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface Hotel {
  _id: string;
  name: string;
  address: string;
  telephone: string;
}

export default function AdminHotels() {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    telephone: "",
  });

  useEffect(() => {
    fetchAllHotels();
  }, []);

  const fetchAllHotels = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiRequest("/hotels");
      setHotels(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hotels");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (hotelId: string) => {
    try {
      await apiRequest(`/hotels/${hotelId}`, { method: "DELETE" });
      setHotels(hotels.filter((hotel) => hotel._id !== hotelId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete hotel");
    }
  };

  const openCreateDialog = () => {
    setIsCreating(true);
    setEditingHotel(null);
    setFormData({ name: "", address: "", telephone: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (hotel: Hotel) => {
    setIsCreating(false);
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      address: hotel.address,
      telephone: hotel.telephone,
    });
    setIsDialogOpen(true);
  };

  const handleSaveHotel = async () => {
    if (!formData.name || !formData.address || !formData.telephone) {
      alert("All fields are required");
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        // Create new hotel
        const result = await apiRequest("/hotels", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        setHotels([...hotels, result.data]);
      } else if (editingHotel) {
        // Update existing hotel
        const result = await apiRequest(`/hotels/${editingHotel._id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        setHotels(
          hotels.map((hotel) =>
            hotel._id === editingHotel._id ? result.data : hotel
          )
        );
      }

      setIsDialogOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${isCreating ? "create" : "update"} hotel`);
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
              <h1 className="text-3xl font-bold">Hotel Management</h1>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="size-4 mr-2" />
              Add Hotel
            </Button>
          </div>
          <p className="text-gray-600">Create, update, and delete hotels</p>
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
              <CardTitle>All Hotels</CardTitle>
              <CardDescription>
                Total hotels: {hotels.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hotel ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Telephone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotels.map((hotel) => (
                      <TableRow key={hotel._id}>
                        <TableCell className="font-mono text-sm">{hotel._id}</TableCell>
                        <TableCell className="font-medium">{hotel.name}</TableCell>
                        <TableCell>{hotel.address}</TableCell>
                        <TableCell>{hotel.telephone}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(hotel)}
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
                                  <AlertDialogTitle>Delete Hotel</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this hotel? This action cannot be undone and will affect all related bookings.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(hotel._id)}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isCreating ? "Create New Hotel" : "Edit Hotel"}</DialogTitle>
              <DialogDescription>
                {isCreating ? "Add a new hotel to the system" : "Update hotel information"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hotel Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Grand Plaza Hotel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street, City, State 12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Telephone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveHotel} disabled={isSaving}>
                {isSaving ? "Saving..." : isCreating ? "Create Hotel" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
