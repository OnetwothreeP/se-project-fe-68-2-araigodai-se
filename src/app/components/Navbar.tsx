import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Hotel, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

interface User {
  id: string;
  role: string;
  name: string;
}

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      // Decode JWT to get user info (simplified - in production use a proper JWT library)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch (error) {
        console.error("Failed to decode token", error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/hotels" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Hotel className="size-6 text-white" />
            </div>
            <span className="text-xl font-semibold">Hotel Booking</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/hotels")}>
                  Hotels
                </Button>
                <Button variant="ghost" onClick={() => navigate("/bookings")}>
                  My Bookings
                </Button>
                {user?.role === "admin" && (
                  <Button variant="ghost" onClick={() => navigate("/admin")}>
                    Admin Dashboard
                  </Button>
                )}
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="size-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button onClick={() => navigate("/register")}>
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