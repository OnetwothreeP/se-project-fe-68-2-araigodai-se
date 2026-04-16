import { createBrowserRouter } from "react-router";
import Register from "./pages/Register";
import RegisterSuccess from "./pages/RegisterSuccess";
import Login from "./pages/Login";
import Hotels from "./pages/Hotels";
import BookHotel from "./pages/BookHotel";
import MyBookings from "./pages/MyBookings";
import EditBooking from "./pages/EditBooking";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Register,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/register-success",
    Component: RegisterSuccess,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/hotels",
    Component: Hotels,
  },
  {
    path: "/hotels/:hotelId/book",
    Component: BookHotel,
  },
  {
    path: "/bookings",
    Component: MyBookings,
  },
  {
    path: "/bookings/:id/edit",
    Component: EditBooking,
  },
  {
    path: "/admin",
    Component: AdminDashboard,
  },
  {
    path: "/profile",
    Component: Profile,
  },
]);