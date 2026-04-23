"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Hotel as HotelIcon, MapPin, Phone, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface Hotel {
  _id: string;
  name: string;
  address: string;
  telephone: string;
}

interface FormErrors {
  name?: string;
  address?: string;
  telephone?: string;
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
  const [formData, setFormData] = useState({ name: "", address: "", telephone: "" });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

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
      setHotels((prev) => prev.filter((h) => h._id !== hotelId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete hotel");
    }
  };

  const openCreateDialog = () => {
    setIsCreating(true);
    setEditingHotel(null);
    setFormData({ name: "", address: "", telephone: "" });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (hotel: Hotel) => {
    setIsCreating(false);
    setEditingHotel(hotel);
    setFormData({ name: hotel.name, address: hotel.address, telephone: hotel.telephone });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const validate = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) errors.name = "กรุณากรอกชื่อโรงแรม";
    if (!formData.address.trim()) errors.address = "กรุณากรอกที่อยู่";
    if (!formData.telephone.trim()) errors.telephone = "กรุณากรอกเบอร์โทรศัพท์";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveHotel = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      if (isCreating) {
        const result = await apiRequest("/hotels", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        setHotels((prev) => [...prev, result.data]);
      } else if (editingHotel) {
        const result = await apiRequest(`/hotels/${editingHotel._id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        setHotels((prev) =>
          prev.map((h) => (h._id === editingHotel._id ? result.data : h))
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin")}
              className="text-gray-500 hover:text-gray-900 -ml-2"
            >
              <ArrowLeft className="size-4 mr-1" />
              Dashboard
            </Button>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="size-4 mr-2" />
            เพิ่มโรงแรม
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <HotelIcon className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hotel Management</h1>
            <p className="text-sm text-gray-500">จัดการข้อมูลโรงแรมทั้งหมดในระบบ</p>
          </div>
        </div>

        {/* Stat */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            โรงแรมทั้งหมด {hotels.length} แห่ง
          </Badge>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {/* Hotel Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-400">
              <HotelIcon className="size-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">ยังไม่มีโรงแรมในระบบ</p>
              <p className="text-sm mt-1">กด "เพิ่มโรงแรม" เพื่อเริ่มต้น</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotels.map((hotel) => (
              <Card key={hotel._id} className="flex flex-col hover:shadow-md transition-shadow">
                {/* Card Header */}
                <CardContent className="pt-5 flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                      <HotelIcon className="size-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight truncate">{hotel.name}</p>
                      <Badge variant="outline" className="font-mono text-xs mt-1">
                        #{hotel._id.slice(-6).toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="size-3.5 mt-0.5 shrink-0 text-gray-400" />
                      <span className="line-clamp-2">{hotel.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="size-3.5 shrink-0 text-gray-400" />
                      <span>{hotel.telephone}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 pb-4 px-5 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(hotel)}
                  >
                    <Edit className="size-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Trash2 className="size-3.5 mr-1.5 text-red-500" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบโรงแรม</AlertDialogTitle>
                        <AlertDialogDescription>
                          ต้องการลบ <span className="font-semibold">{hotel.name}</span> ออกจากระบบใช่หรือไม่?
                          การกระทำนี้จะส่งผลต่อการจองทั้งหมดที่เกี่ยวข้องและไม่สามารถย้อนกลับได้
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(hotel._id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          ยืนยันลบ
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Create / Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isCreating ? "เพิ่มโรงแรมใหม่" : "แก้ไขข้อมูลโรงแรม"}
              </DialogTitle>
              <DialogDescription>
                {isCreating ? "กรอกข้อมูลโรงแรมที่ต้องการเพิ่ม" : `แก้ไขข้อมูลของ ${editingHotel?.name}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">ชื่อโรงแรม</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Grand Plaza Hotel"
                  className={formErrors.name ? "border-red-400" : ""}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">ที่อยู่</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 ถนนสุขุมวิท กรุงเทพฯ"
                  className={formErrors.address ? "border-red-400" : ""}
                />
                {formErrors.address && (
                  <p className="text-xs text-red-500">{formErrors.address}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telephone">เบอร์โทรศัพท์</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="02-xxx-xxxx"
                  className={formErrors.telephone ? "border-red-400" : ""}
                />
                {formErrors.telephone && (
                  <p className="text-xs text-red-500">{formErrors.telephone}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSaveHotel} disabled={isSaving}>
                {isSaving ? "กำลังบันทึก..." : isCreating ? "เพิ่มโรงแรม" : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
