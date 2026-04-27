"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Types ─── */
interface JwtPayload { role: string; }

interface HotelForm {
  name: string;
  address: string;
  telephone: string;
  description: string;
  amenities: string[];
}

interface Toast { id: number; msg: string; type: "success" | "error" | "default" }

const ALL_AMENITIES = ["WiFi", "Pool", "Gym", "Parking"];

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
  const [form, setForm] = useState<HotelForm>({
    name: "", address: "", telephone: "", description: "", amenities: [],
  });
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [toasts, setToasts]         = useState<Toast[]>([]);

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
    if (!decoded || decoded.role !== "owner") { router.replace("/owner/hotels"); return; }

    const fetchHotel = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/hotels/${hotelId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.status === 403) { router.replace("/error/403"); return; }
        if (!res.ok) throw new Error((await res.json()).message || "Failed to load hotel");

        const body = await res.json();
        const h = body.data || body;
        setHotelName(h.name || "");
        setForm({
          name:        h.name        || "",
          address:     h.address     || "",
          telephone:   h.telephone   || "",
          description: h.description || "",
          amenities:   Array.isArray(h.amenities) ? h.amenities : [],
        });
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Failed to load hotel.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotel();
  }, [router, hotelId, addToast]);

  /* ── Amenity toggle ── */
  function toggleAmenity(a: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter(x => x !== a)
        : [...f.amenities, a],
    }));
  }

  /* ── Save ── */
  async function handleSave() {
    if (!form.name.trim() || !form.address.trim() || !form.telephone.trim()) {
      setFieldError("Please fill in all required fields.");
      return;
    }
    setFieldError("");

    const token = localStorage.getItem("token")!;
    setIsSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/hotels/${hotelId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name:        form.name.trim(),
            address:     form.address.trim(),
            telephone:   form.telephone.trim(),
            description: form.description.trim(),
            amenities:   form.amenities,
          }),
        }
      );
      if (res.status === 403) { router.replace("/error/403"); return; }
      if (!res.ok) throw new Error((await res.json()).message || "Save failed");

      setHotelName(form.name.trim());
      addToast("Hotel information updated successfully.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Save failed.", "error");
    } finally {
      setIsSaving(false);
    }
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

        {/* Form card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-8 py-7">

          {isLoading ? (
            <div className="space-y-5 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-10 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Validation error */}
              {fieldError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
                  {fieldError}
                </div>
              )}

              {/* Hotel Name */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Hotel Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFieldError(""); }}
                  placeholder="e.g. Grand Plaza Hotel"
                />
              </div>

              {/* Address */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  value={form.address}
                  onChange={e => { setForm(f => ({ ...f, address: e.target.value })); setFieldError(""); }}
                  placeholder="e.g. 123 Sukhumvit Rd, Bangkok"
                />
              </div>

              {/* Telephone */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telephone <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  value={form.telephone}
                  onChange={e => { setForm(f => ({ ...f, telephone: e.target.value })); setFieldError(""); }}
                  placeholder="e.g. 02-555-1234"
                />
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your hotel..."
                />
              </div>

              {/* Amenities */}
              <div className="mb-7">
                <label className="block text-sm font-medium text-gray-700 mb-2.5">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-4">
                  {ALL_AMENITIES.map(a => (
                    <label key={a} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer accent-blue-600"
                        checked={form.amenities.includes(a)}
                        onChange={() => toggleAmenity(a)}
                      />
                      {a}
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
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
        </div>
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
