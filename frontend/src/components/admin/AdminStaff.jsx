// src/components/admin/AdminStaff.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  // form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/staff/`);
      // normalize: expect array
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setStaff(data);
    } catch (err) {
      console.error("Failed to load staff:", err);
      setError("Could not fetch staff. Check API and CORS.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStaff(e) {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!username || !password || !email) {
      setError("Please fill username, password and email.");
      return;
    }

    setSubmitting(true);
    try {
      // If your backend expects form-data or hashed password on server side,
      // this JSON POST should work if backend accepts it.
      const payload = { username, password, email, phone, address };
      const res = await axios.post(`${API_BASE}/api/staff/`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const created = res?.data;
      setMsg("✅ Staff added successfully.");
      // clear form
      setUsername("");
      setPassword("");
      setEmail("");
      setPhone("");
      setAddress("");

      // Refresh list (preferred)
      fetchStaff();
    } catch (err) {
      console.error("Add staff failed:", err);
      const text = err?.response?.data?.detail || JSON.stringify(err?.response?.data) || err.message || "Failed to add staff";
      setError("❌ " + text);
    } finally {
      setSubmitting(false);
    }
  }

  // mark staff as resigned by setting resign_date to today
  async function handleRemove(id) {
    if (!window.confirm("Remove this staff? This will set their resign date.")) return;

    try {
      const resign_date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      // We use PATCH to update resign_date; adapt if your API uses DELETE or separate endpoint.
      await axios.patch(`${API_BASE}/api/staff/${id}/`, { resign_date }, {
        headers: { "Content-Type": "application/json" },
      });

      setMsg("❌ Staff removed (resign_date set).");
      // optimistic update
      setStaff((prev) => prev.map((s) => (s.id === id || s.pk === id ? { ...s, resign_date } : s)));
    } catch (err) {
      console.error("Remove staff failed:", err);
      setError("Failed to remove staff.");
    }
  }

  // simple client-side search
  const filtered = staff.filter((s) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      String(s.username ?? s.user ?? "").toLowerCase().includes(q) ||
      String(s.email ?? "").toLowerCase().includes(q) ||
      String(s.phone ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#181818", color: "#f1f1f1" }}>
      <style>{`
        :root{--bg-sidebar:#202020;--card:#2a2a2a;--accent:#c89d5c;--muted:#aaa}
        *{box-sizing:border-box;font-family:Segoe UI, Roboto, system-ui, sans-serif}
        .sidebar{width:220px;background:var(--bg-sidebar);padding:20px;display:flex;flex-direction:column}
        .sidebar h2{color:var(--accent);font-size:20px;margin-bottom:24px}
        .sidebar a{color:var(--muted);text-decoration:none;margin:10px 0}
        .sidebar a.active{color:var(--accent)}
        .main{flex:1;padding:28px;overflow:auto}
        .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
        .form-box{background:var(--card);padding:16px;border-radius:8px;margin-bottom:20px}
        input, textarea{width:100%;padding:10px;margin-top:8px;border-radius:6px;border:none;background:#2e2e2e;color:#fff}
        button{background:var(--accent);color:#111;padding:10px 14px;border-radius:6px;border:none;cursor:pointer}
        table{width:100%;border-collapse:collapse;background:var(--card);border-radius:8px;overflow:hidden}
        th,td{padding:12px;border-bottom:1px solid #333;text-align:left;vertical-align:middle}
        th{color:var(--accent)}
        .remove-btn{background:transparent;border:none;color:#ff6b6b;cursor:pointer;font-weight:700}
        .muted{color:var(--muted)}
        @media(max-width:900px){ .sidebar{display:none} .main{padding:16px} }
      `}</style>

      <aside className="sidebar">
        <h2>Admin</h2>
        <a href="/admin" >Dashboard</a>
        <a href="/admin/reservations">Reservations</a>
        <a href="/admin/rooms">Rooms</a>
        <a href="/admin/guest">Guest</a>
        <a href="/admin/staff" className="active">Staff</a>
        <a href="/admin/gallery">Gallery</a>
        <a href="/admin/logout">Logout</a>
      </aside>

      <main className="main">
        <div className="topbar">
          <h1 style={{ color: "var(--accent)" }}>Manage Staff</h1>
          <input
            className="muted"
            placeholder="Search staff..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: 10, borderRadius: 6, border: "none", background: "#2a2a2a", color: "#ddd" }}
          />
        </div>

        <div className="form-box">
          <h2 style={{ color: "var(--accent)", marginBottom: 8 }}>Add Staff</h2>
          {msg && <div style={{ marginBottom: 8, color: msg.startsWith("❌") ? "#ff8a8a" : "#9ef59e" }}>{msg}</div>}
          {error && <div style={{ marginBottom: 8, color: "#ff8a8a" }}>{error}</div>}
          <form onSubmit={handleAddStaff}>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input type="email" placeholder="Email ID" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <textarea placeholder="Address" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
            <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="submit" disabled={submitting}>{submitting ? "Adding..." : "Add Staff"}</button>
            </div>
          </form>
        </div>

        <h2 style={{ marginBottom: 12 }}>Current Staff</h2>

        {loading ? (
          <div className="muted">Loading staff...</div>
        ) : staff.length === 0 ? (
          <div className="muted">No staff members yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Entry Date</th>
                <th>Resign Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const id = s.id ?? s.pk ?? s.staff_id;
                return (
                  <tr key={id ?? JSON.stringify(s)}>
                    <td>{id}</td>
                    <td>{s.username ?? s.user ?? "-"}</td>
                    <td>{s.email ?? "-"}</td>
                    <td>{s.phone ?? "-"}</td>
                    <td style={{ maxWidth: 300 }}>{s.address ?? "-"}</td>
                    <td>{(s.entry_date ?? s.created_at ?? "").slice(0, 10) || "-"}</td>
                    <td>{(s.resign_date ?? "-") || "-"}</td>
                    <td>
                      {!s.resign_date ? (
                        <button className="remove-btn" onClick={() => handleRemove(id)}>Remove</button>
                      ) : (
                        <span style={{ color: "#aaa" }}>Resigned</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
