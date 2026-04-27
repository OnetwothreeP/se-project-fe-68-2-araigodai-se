"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Error403() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="flex flex-col items-center text-center gap-3">
        <span className="text-7xl">🚫</span>
        <h1 className="text-3xl font-bold text-gray-900">403 — Forbidden</h1>
        <p className="text-gray-500 text-base">
          You do not have permission to access this page.
        </p>
        <Button className="mt-2" onClick={() => router.push("/hotels")}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
