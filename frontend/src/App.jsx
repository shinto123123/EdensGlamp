// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";
import Booking from "./components/booking";
import AdminReservations from "./components/admin/AdminBookings";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminRooms from "./components/admin/AdminRooms"; // <-- add this
import AdminStaff from "./components/admin/AdminStaff";
import AdminGallery from "./components/admin/AdminGallery";
import RoomDetails from "./components/RoomDetails";
import AdminFood from "./components/admin/AdminFood";
import Menu from "./components/Menu";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/reservation" element={<Booking />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/reservations" element={<AdminReservations />} />
      <Route path="/admin/rooms" element={<AdminRooms />} /> {/* <-- add this */}
      <Route path="/admin/staff" element={<AdminStaff />} />
      <Route path="/admin/gallery" element={<AdminGallery />} />
      <Route path="/room/:id" element={<RoomDetails />} />
      <Route path="/admin/food" element={<AdminFood />} />
      <Route path="/menu" element={<Menu />} />

    </Routes>
  );
}
