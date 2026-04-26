"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/api";

interface ProfileFormData {
  name: string;
  telephone: string;
  houseNumber: string;
  village?: string;
  lane?: string;
  road: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
}

export default function Profile() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsFetching(true);

    try {
      const token = localStorage.getItem("token");
      const result = await apiRequest("/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = result.data;
      setValue("name", data.name || "");
      setValue("telephone", data.telephone || "");
      setValue("houseNumber", data.houseNumber || "");
      setValue("village", data.village || "");
      setValue("lane", data.lane || "");
      setValue("road", data.road || "");
      setValue("subDistrict", data.subDistrict || "");
      setValue("district", data.district || "");
      setValue("province", data.province || "");
      setValue("postalCode", data.postalCode || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      await apiRequest("/auth/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      setSuccessMessage("Profile updated successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while updating profile";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      const token = localStorage.getItem("token");
      await apiRequest("/auth/deactivate", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem("token");
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate account");
      setShowDeactivateDialog(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account information</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your basic account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    {...register("name")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone" className="font-semibold">Telephone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    {...register("telephone")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>
                Update your residential address details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="houseNumber" className="font-semibold">House Number</Label>
                  <Input
                    id="houseNumber"
                    type="text"
                    {...register("houseNumber")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village" className="font-semibold">Village</Label>
                  <Input
                    id="village"
                    type="text"
                    {...register("village")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lane" className="font-semibold">Lane (Soi)</Label>
                  <Input
                    id="lane"
                    type="text"
                    {...register("lane")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="road" className="font-semibold">Road (Thanon)</Label>
                  <Input
                    id="road"
                    type="text"
                    {...register("road")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subDistrict" className="font-semibold">Sub-District (Khwaeng/Tambon)</Label>
                  <Input
                    id="subDistrict"
                    type="text"
                    {...register("subDistrict")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district" className="font-semibold">District (Khet/Amphoe)</Label>
                  <Input
                    id="district"
                    type="text"
                    {...register("district")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province" className="font-semibold">Province (Changwat)</Label>
                  <Input
                    id="province"
                    type="text"
                    {...register("province")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="font-semibold">Postal Code</Label>
                  <Input
                    id="postalCode"
                    type="text"
                    {...register("postalCode")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center gap-4">
            <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deactivate Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will deactivate your account and log you out. You can create a new account anytime.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeactivateAccount}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Deactivate Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/hotels")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
