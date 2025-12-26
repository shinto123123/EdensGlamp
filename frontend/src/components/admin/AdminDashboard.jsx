// src/components/admin/AdminDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip } from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_today: 0,
    revenue: 0,
    available_rooms: 0,
    pending: 0,
    chart_labels: [],
    chart_data: [],
  });
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    loadSummary();
    // cleanup on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSummary() {
    setLoading(true);
    setError(null);

    // Primary: try summary endpoint
    try {
      const resp = await axios.get(`${API_BASE}/api/admin/summary/`);
      if (resp?.data) {
        setSummary((s) => ({ ...s, ...resp.data }));
        setLoading(false);
        renderChart(resp.data.chart_labels || [], resp.data.chart_data || []);
        return;
      }
    } catch (err) {
      // silently continue to fallback
      console.warn("No /api/admin/summary/ or request failed — falling back to computed summary.", err?.message || err);
    }

    // Fallback: compute from available endpoints
    try {
      // fetch reservations, rooms, guest_checkins (if exist)
      const [resRes, roomsRes, checkinsRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/api/reservations/`),
        axios.get(`${API_BASE}/api/rooms/`),
        axios.get(`${API_BASE}/api/guest_checkins/`),
      ]);

      const reservations = resRes.status === "fulfilled" && Array.isArray(resRes.value.data)
        ? resRes.value.data
        : [];

      const rooms = roomsRes.status === "fulfilled" && Array.isArray(roomsRes.value.data)
        ? roomsRes.value.data
        : [];

      const checkins = checkinsRes.status === "fulfilled" && Array.isArray(checkinsRes.value.data)
        ? checkinsRes.value.data
        : [];

      // total_today: confirmed reservations created today
      const todayISO = new Date().toISOString().slice(0, 10);
      const total_today = reservations.filter((r) => {
        const created = (r.created_at || "").slice(0, 10);
        return created === todayISO && (r.status || "").toLowerCase() === "confirmed";
      }).length;

      // revenue: try to compute from guest_checkins joined with rooms data
      let revenue = 0;
      if (checkins.length > 0) {
        // if checkins include room_type/room_name and rooms array contains price
        const priceMap = {};
        rooms.forEach((room) => {
          const name = room.room_name ?? room.name ?? room.room_name;
          if (name) priceMap[name] = room.price ?? room.rate ?? 0;
        });
        for (const g of checkins) {
          if (!g.status) continue;
          const stat = (g.status || "").toLowerCase();
          if (stat === "checked-in" || stat === "checked-out") {
            const price = priceMap[g.room_type] ?? priceMap[g.room_name] ?? 0;
            const roomsCount = Number(g.rooms ?? g.quantity ?? 1);
            revenue += (price * (roomsCount || 1));
          }
        }
      }

      // total rooms and occupied
      const total_rooms = rooms.length ? rooms.length : (roomsRes.status === "fulfilled" ? roomsRes.value.data.length : 0);
      const occupied_rooms = checkins.reduce((acc, g) => {
        if ((g.status || "").toLowerCase() === "checked-in") {
          return acc + Number(g.rooms ?? g.quantity ?? 0);
        }
        return acc;
      }, 0);
      const available_rooms = Math.max((total_rooms || 0) - (occupied_rooms || 0), 0);

      // pending
      const pending = reservations.filter((r) => (r.status || "").toLowerCase() === "pending").length;

      // chart: attempt to create last 30 days counts from checkins (fallback)
      const days = 30;
      const dates = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
      }
      const countMap = Object.fromEntries(dates.map((d) => [d, 0]));
      for (const g of checkins) {
        const inDate = (g.check_in || g.checkin || "").slice(0, 10);
        if (inDate && countMap.hasOwnProperty(inDate) && (g.status || "").toLowerCase() === "checked-in") {
          countMap[inDate] = (countMap[inDate] || 0) + 1;
        }
      }
      const chart_labels = dates.map((d) => {
        const dt = new Date(d);
        return dt.toLocaleString(undefined, { month: "short", day: "2-digit" });
      });
      const chart_data = dates.map((d) => countMap[d] || 0);

      const fallbackSummary = { total_today, revenue, available_rooms, pending, chart_labels, chart_data };
      setSummary(fallbackSummary);
      renderChart(chart_labels, chart_data);
    } catch (err) {
      console.error("Fallback summary compute failed:", err);
      setError("Unable to fetch dashboard data. Check API endpoints.");
    } finally {
      setLoading(false);
    }
  }

  function renderChart(labels, data) {
    try {
      if (!chartRef.current) return;
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      chartInstanceRef.current = new Chart(chartRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Successful Check-ins",
              data,
              borderColor: "#c89d5c",
              backgroundColor: "rgba(200,157,92,0.2)",
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "#aaa", maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }, grid: { color: "#333" } },
            y: { beginAtZero: true, ticks: { color: "#aaa", stepSize: 1 }, grid: { color: "#333" } },
          },
        },
      });
    } catch (err) {
      console.error("Chart render error:", err);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwdMsg("");
    const fd = new FormData(e.target);
    const body = {
      old_password: fd.get("old_password"),
      new_password: fd.get("new_password"),
      confirm_password: fd.get("confirm_password"),
    };
    try {
      const resp = await axios.post(`${API_BASE}/api/admin/change-password/`, body);
      setPwdMsg(resp.data?.message || "Password updated");
    } catch (err) {
      console.error(err);
      setPwdMsg(err?.response?.data?.detail || "Failed to update password");
    }
  }

  const { total_today, revenue, available_rooms, pending } = summary;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#181818", color: "#f1f1f1" }}>
      <style>{`
        :root{--bg-sidebar:#202020;--card:#2a2a2a;--accent:#c89d5c;--muted:#aaa}
        .sidebar{width:220px;background:var(--bg-sidebar);padding:20px;display:flex;flex-direction:column}
        .sidebar h2{color:var(--accent);font-size:20px;margin-bottom:24px}
        .sidebar a{color:var(--muted);text-decoration:none;margin:10px 0}
        .sidebar a.active{color:var(--accent)}
        .main{flex:1;padding:28px;overflow:auto}
        .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
        .topbar h1{color:var(--accent)}
        .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:20px}
        .card{background:var(--card);padding:16px;border-radius:8px;text-align:center}
        .card h4{color:var(--muted);margin-bottom:8px}
        .card p{font-size:20px;color:var(--accent);font-weight:700}
        .content{display:grid;grid-template-columns:2fr 1fr;gap:18px}
        .box{background:var(--card);padding:16px;border-radius:8px}
        .alerts ul{list-style:none;padding-left:0}
        .alerts li{margin:8px 0;color:#e6eef8}
        @media(max-width:900px){ .cards{grid-template-columns:repeat(2,1fr)} .content{grid-template-columns:1fr} .sidebar{display:none} }
      `}</style>

      <aside className="sidebar">
  <h2>Admin</h2>
  <a href="#" className="active">Dashboard</a>
  <a href="/admin/reservations">Reservations</a>
  <a href="/admin/rooms">Rooms</a>
  <a href="/admin/guest">Guest</a>
  <a href="/admin/staff">Staff</a>
  <a href="/admin/food">Food</a>   {/* ✅ New Food Option */}
  <a href="/admin/gallery">Gallery</a>
  <a href="/admin/logout">Logout</a>
</aside>


      <main className="main">
        <div className="topbar">
          <h1>Dashboard</h1>
          <div>
            <button onClick={() => setModalOpen(true)} style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 18 }}>🔒 Change Password</button>
          </div>
        </div>

        <div className="cards">
          <div className="card">
            <h4>Total Bookings Today</h4>
            <p>{loading ? "..." : total_today}</p>
          </div>
          <div className="card">
            <h4>Revenue</h4>
            <p>₹{loading ? "..." : Number(revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="card">
            <h4>Available Rooms</h4>
            <p>{loading ? "..." : available_rooms}</p>
          </div>
          <div className="card">
            <h4>Pending Requests</h4>
            <p>{loading ? "..." : pending}</p>
          </div>
        </div>

        <div className="content">
          <div className="box">
            <h3 style={{ color: "var(--accent)", marginBottom: 12 }}>Successful Check-ins (Last 30 Days)</h3>
            <canvas ref={chartRef} id="bookingChart" style={{ width: "100%", height: 260 }}></canvas>
            {error && <div style={{ color: "#f87171", marginTop: 10 }}>{error}</div>}
          </div>

          <div className="box alerts">
            <h3 style={{ color: "var(--accent)", marginBottom: 12 }}>Alerts</h3>
            <ul>
              <li>New booking request received</li>
              <li>Guest check-in pending approval</li>
              <li>Staff schedule updated</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Password Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#2a2a2a", padding: 24, borderRadius: 8, width: 420, maxWidth: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ color: "var(--accent)" }}>Change Password</h2>
              <button onClick={() => { setModalOpen(false); setPwdMsg(""); }} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22 }}>×</button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <input name="old_password" type="password" placeholder="Current Password" required style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: "1px solid #444", background: "#1e1e1e", color: "#fff" }} />
              <input name="new_password" type="password" placeholder="New Password" required style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: "1px solid #444", background: "#1e1e1e", color: "#fff" }} />
              <input name="confirm_password" type="password" placeholder="Confirm New Password" required style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 6, border: "1px solid #444", background: "#1e1e1e", color: "#fff" }} />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => { setModalOpen(false); setPwdMsg(""); }} style={{ padding: "8px 14px", borderRadius: 6, background: "#374151", color: "#fff", border: "none" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 14px", borderRadius: 6, background: "var(--accent)", color: "#111", border: "none" }}>Update</button>
              </div>
            </form>
            {pwdMsg && <div style={{ marginTop: 10, color: pwdMsg.toLowerCase().includes("fail") ? "#ff7676" : "#9ef59e" }}>{pwdMsg}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
