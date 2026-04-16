import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2, User, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
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
} from "../components/ui/alert-dialog";

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
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsFetching(true);

    // Mock API call with delay
    setTimeout(() => {
      try {
        const token = localStorage.getItem("token");

        // Get user data from localStorage or create default
        const savedProfile = localStorage.getItem("userProfile");
        let data;

        if (savedProfile) {
          data = JSON.parse(savedProfile);
        } else {
          // Decode token to get basic user info
          const payload = JSON.parse(atob(token!.split('.')[1]));
          data = {
            name: payload.name || "",
            telephone: payload.telephone || "",
            houseNumber: "",
            village: "",
            lane: "",
            road: "",
            subDistrict: "",
            district: "",
            province: "",
            postalCode: "",
          };
        }

        // Pre-fill form with existing data
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
        toast.error("Failed to load profile data");
      } finally {
        setIsFetching(false);
      }
    }, 500);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setError("");
    setIsLoading(true);

    // Mock API call with delay
    setTimeout(() => {
      try {
        // Save profile data to localStorage
        localStorage.setItem("userProfile", JSON.stringify(data));

        // Update the token with new name and telephone
        const token = localStorage.getItem("token");
        const parts = token!.split('.');
        const payload = JSON.parse(atob(parts[1]));
        payload.name = data.name;
        payload.telephone = data.telephone;

        const newToken = `${parts[0]}.${btoa(JSON.stringify(payload))}.${parts[2]}`;
        localStorage.setItem("token", newToken);

        toast.success("Profile updated successfully!");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred while updating profile";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const handleDeactivateAccount = () => {
    // Clear all user data
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    toast.success("Account deactivated successfully");
    navigate("/login");
  };

  if (isFetching) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
          <Loader2 className="size-8 animate-spin text-blue-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
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

            {/* Personal Information */}
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
                      placeholder="John Doe"
                      {...register("name")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telephone" className="font-semibold">Telephone</Label>
                    <Input
                      id="telephone"
                      type="tel"
                      placeholder="081-234-5678"
                      {...register("telephone")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
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
                      placeholder="123/45"
                      {...register("houseNumber")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="village" className="font-semibold">Village</Label>
                    <Input
                      id="village"
                      type="text"
                      placeholder="หมู่บ้านสุขใจ"
                      {...register("village")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lane" className="font-semibold">Lane (Soi)</Label>
                    <Input
                      id="lane"
                      type="text"
                      placeholder="ซอย 12"
                      {...register("lane")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="road" className="font-semibold">Road (Thanon)</Label>
                    <Input
                      id="road"
                      type="text"
                      placeholder="ถนนสุขุมวิท"
                      {...register("road")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subDistrict" className="font-semibold">Sub-District (Tambon/Khwaeng)</Label>
                    <Input
                      id="subDistrict"
                      type="text"
                      placeholder="คลองตัน"
                      {...register("subDistrict")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district" className="font-semibold">District (Amphoe/Khet)</Label>
                    <Input
                      id="district"
                      type="text"
                      placeholder="คลองเตย"
                      {...register("district")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province" className="font-semibold">Province (Changwat)</Label>
                    <Input
                      id="province"
                      type="text"
                      placeholder="กรุงเทพมหานคร"
                      {...register("province")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="font-semibold">Postal Code</Label>
                    <Input
                      id="postalCode"
                      type="text"
                      placeholder="10110"
                      {...register("postalCode")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
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
                      This action will deactivate your account and log you out. All your profile data will be removed from this device. You can create a new account anytime.
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
                  onClick={() => navigate("/hotels")}
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
    </>
  );
}
