"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function RegisterSuccess() {
  const router = useRouter();

  const handleContinue = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = payload.role;
        if (role === "admin") {
          router.push("/admin");
        } else if (role === "owner") {
          router.push("/owner/hotels");
        } else {
          router.push("/hotels");
        }
      } catch {
        router.push("/hotels");
      }
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-500 p-3 rounded-full">
              <CheckCircle className="size-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Registration Successful!</CardTitle>
          <CardDescription className="text-center">
            Your account has been created successfully
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-gray-500">
            Welcome to araigodai Hotel Booking. You can now browse and book hotels.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} className="w-full">
            Continue to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
