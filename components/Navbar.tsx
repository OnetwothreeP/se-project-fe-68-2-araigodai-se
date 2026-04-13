"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/src/app/components/ui/button";
import { Hotel, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

interface User {
  id: string;
  role: string;
  name: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        setIsAuthenticated(true);
        try {
          // Fetch user data from /auth/me endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log("User data from API:", result.data); // Debug log
            setUser(result.data);
          } else {
            // Fallback to JWT token payload
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("Token payload (fallback):", payload); // Debug log
            setUser(payload);
          }
        } catch (error) {
          console.error("Failed to fetch user data", error);
          // Fallback to JWT token payload
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser(payload);
          } catch (e) {
            console.error("Failed to decode token", e);
          }
        }
      }
    };
    
    fetchUser();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    router.push("/login");
  };

  // Don't show navbar on login/register pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/") {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/hotels" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Hotel className="size-6 text-white" />
            </div>
            <span className="text-xl font-semibold">Hotel Booking</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button 
                  variant={pathname === "/hotels" ? "default" : "ghost"} 
                  onClick={() => router.push("/hotels")}
                >
                  Hotels
                </Button>
                {user?.role === "admin" ? (
                  <>
                    <Button 
                      variant={pathname === "/admin" ? "default" : "ghost"} 
                      onClick={() => router.push("/admin")}
                    >
                      All Bookings
                    </Button>
                    <Button 
                      variant={pathname === "/admin/hotels" ? "default" : "ghost"} 
                      onClick={() => router.push("/admin/hotels")}
                    >
                      Manage Hotels
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant={pathname === "/bookings" ? "default" : "ghost"} 
                    onClick={() => router.push("/bookings")}
                  >
                    My Bookings
                  </Button>
                )}
                {/* Debug: Show user role */}
                {/* {user && <span className="text-xs text-gray-500">Role: {user.role}</span>} */}
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="size-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  Login
                </Button>
                <Button onClick={() => router.push("/register")}>
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
