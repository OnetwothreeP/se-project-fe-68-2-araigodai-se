"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

/* ─── Types ─── */
interface JwtPayload { role: string; }

interface RoomTypeDef {
  id: "standard" | "deluxe" | "suite";
  name: string;
  pricePerNight: number;
  totalRooms: number;
  amenities: string[];
}

interface HotelForm {
  name: string;
  address: string;
  telephone: string;
}

interface Toast { id: number; msg: string; type: "success" | "error" | "default" }

const DEFAULT_ROOM_TYPES: RoomTypeDef[] = [
  { id: "standard", name: "Standard Room", pricePerNight: 1200, totalRooms: 10,
    amenities: ["Single Bed", "Private Bathroom", "32\" TV", "Free Wi-Fi", "Air Conditioning"] },
  { id: "deluxe",   name: "Deluxe Room",   pricePerNight: 2500, totalRooms: 8,
    amenities: ["Queen Size Bed", "Private Bathroom", "43\" TV", "Free Wi-Fi", "Air Conditioning", "City View", "Minibar"] },
  { id: "suite",    name: "Suite Room",    pricePerNight: 5000, totalRooms: 4,
    amenities: ["King Size Bed", "Private Bathroom + Bathtub", "55\" TV", "Free Wi-Fi", "Air Conditioning", "Panoramic View", "Living Room", "Free Breakfast for 2"] },
];

/* ─── Helpers ─── */
function decodeToken(token: string): JwtPayload | null {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

/* ─── Page ─── */
export default function OwnerEditHotel() {
  const router = useRouter();
  const params = useParams();
  const hotelId = params.hotelId as string;

  const [hotelName, setHotelName] = useState("");
  const [form, setForm] = useState<HotelForm>({ name: "", address: "", telephone: "" });
  const [formErrors, setFormErrors] = useState<Partial<HotelForm>>({});
  const [roomTypes, setRoomTypes] = useState<RoomTypeDef[]>(DEFAULT_ROOM_TYPES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving,  setIsSaving]  = useState(false);
  const [toasts,    setToasts]    = useState<Toast[]>([]);

  const addToast = useCallback((msg: string, type: Toast["type"] = "default") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  /* ── Auth + pre-fill ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    const decoded = decodeToken(token);
    if (!decoded || decoded.role !== "owner") { router.replace("/owner"); return; }

    const fetchHotel = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/hotels/${hotelId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.status === 403) { router.replace("/403"); return; }
        if (!res.ok) throw new Error((await res.json()).message || "Failed to load hotel");

        const body = await res.json();
        const h = body.data || body;
        setHotelName(h.name || "");
        setForm({ name: h.name || "", address: h.address || "", telephone: h.telephone || "" });
        setRoomTypes(h.roomTypes && h.roomTypes.length > 0 ? h.roomTypes : DEFAULT_ROOM_TYPES);
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Failed to load hotel.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotel();
  }, [router, hotelId, addToast]);

  /* ── Validate ── */
  function validate(): boolean {
    const errors: Partial<HotelForm> = {};
    if (!form.name.trim())      errors.name      = "Hotel name is required";
    if (!form.address.trim())   errors.address   = "Address is required";
    if (!form.telephone.trim()) errors.telephone = "Telephone is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /* ── Save ── */
  async function handleSave() {
    if (!validate()) return;

    const token = localStorage.getItem("token")!;
    setIsSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/hotels/${hotelId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name:      form.name.trim(),
            address:   form.address.trim(),
            telephone: form.telephone.trim(),
            roomTypes,
          }),
        }
      );
      if (res.status === 403) { router.replace("/403"); return; }
      if (!res.ok) throw new Error((await res.json()).message || "Save failed");

      setHotelName(form.name.trim());
      addToast("Hotel information updated successfully.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Save failed.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  /* ── Update room type field ── */
  function updateRoom(idx: number, field: keyof RoomTypeDef, value: string | number | string[]) {
    setRoomTypes(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  }

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-2xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/owner/dashboard/${hotelId}`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 mb-3 bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏨</span>
            <div>
              {isLoading
                ? <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
                : <h1 className="text-2xl font-bold text-gray-900">{hotelName || "Hotel"}</h1>
              }
              <p className="text-sm text-gray-500 mt-0.5">Edit Hotel Info</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-8 py-7 space-y-5 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-10 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── Basic Info ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-8 py-7 mb-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-5">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Hotel Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    className={`mt-1.5 ${formErrors.name ? "border-red-400" : ""}`}
                    value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(f => ({ ...f, name: undefined })); }}
                    placeholder="e.g. Grand Plaza Hotel"
                  />
                  {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="address"
                    className={`mt-1.5 ${formErrors.address ? "border-red-400" : ""}`}
                    value={form.address}
                    onChange={e => { setForm(f => ({ ...f, address: e.target.value })); setFormErrors(f => ({ ...f, address: undefined })); }}
                    placeholder="e.g. 123 Sukhumvit Rd, Bangkok"
                  />
                  {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
                </div>

                <div>
                  <Label htmlFor="telephone">Telephone <span className="text-red-500">*</span></Label>
                  <Input
                    id="telephone"
                    className={`mt-1.5 ${formErrors.telephone ? "border-red-400" : ""}`}
                    value={form.telephone}
                    onChange={e => { setForm(f => ({ ...f, telephone: e.target.value })); setFormErrors(f => ({ ...f, telephone: undefined })); }}
                    placeholder="e.g. 02-555-1234"
                  />
                  {formErrors.telephone && <p className="text-xs text-red-500 mt-1">{formErrors.telephone}</p>}
                </div>
              </div>
            </div>

            {/* ── Room Types ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-8 py-7 mb-6">
              <div className="flex items-center gap-2 mb-5">
                <BedDouble className="size-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-700">Room Types & Pricing</h2>
              </div>

              <div className="space-y-4">
                {roomTypes.map((rt, idx) => (
                  <div key={rt.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{rt.name}</span>
                      <Badge variant="outline" className="text-xs font-mono">{rt.id}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500">Price / Night (฿)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={rt.pricePerNight}
                          onChange={e => updateRoom(idx, "pricePerNight", Number(e.target.value))}
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Total Rooms</Label>
                        <Input
                          type="number"
                          min={1}
                          value={rt.totalRooms}
                          onChange={e => updateRoom(idx, "totalRooms", Number(e.target.value))}
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">Amenities (comma-separated)</Label>
                      <Input
                        value={rt.amenities?.join(", ") ?? ""}
                        onChange={e => updateRoom(idx, "amenities",
                          e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                        )}
                        placeholder="Free Wi-Fi, Air Conditioning, TV"
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => router.push(`/owner/dashboard/${hotelId}`)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="size-4 mr-1.5" />
                {isSaving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </>
        )}
      </main>

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2.5">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl text-sm text-white shadow-lg max-w-xs animate-in slide-in-from-bottom-2 duration-200 ${
              t.type === "success" ? "bg-green-600" : t.type === "error" ? "bg-red-600" : "bg-gray-800"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
