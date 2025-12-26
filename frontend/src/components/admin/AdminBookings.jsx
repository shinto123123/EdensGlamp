 // src/components/admin/AdminBookings.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI state for details modal
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchReservations() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/reservations/`);
      setReservations(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error(err);
      setError("Could not fetch reservations. Check API and CORS.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id, toStatus) {
    setActionLoading(true);
    try {
      await axios.patch(`${API_BASE}/api/reservations/${id}/`, { status: toStatus });
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: toStatus } : r)));
      // if details modal open for this id, update it too
      setSelected((s) => (s && s.id === id ? { ...s, status: toStatus } : s));
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteBooking(id) {
    if (!window.confirm("Delete this booking? This action cannot be undone.")) return;
    setActionLoading(true);
    try {
      await axios.delete(`${API_BASE}/api/reservations/${id}/`);
      setReservations((prev) => prev.filter((r) => r.id !== id));
      if (selected && selected.id === id) setSelected(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete booking");
    } finally {
      setActionLoading(false);
    }
  }

  // Small helper to pretty-format date/time if present
  function prettyDate(s) {
    if (!s) return "-";
    try {
      const d = new Date(s);
      if (isNaN(d)) return s;
      return d.toLocaleString();
    } catch {
      return s;
    }
  }

  function ActionButtons({ row }) {
    if (!row) return null;
    return (
      <>
        <button
          className="btn btn-view"
          onClick={() => setSelected(row)}
          title="View details"
          style={{ marginRight: 6 }}
        >
          View
        </button>

        {row.status === "Pending" ? (
          <>
            <button
              className="btn btn-accept"
              onClick={() => {
                if (window.confirm("Accept this reservation?")) changeStatus(row.id, "Confirmed");
              }}
              disabled={actionLoading}
            >
              Accept
            </button>
            <button
              className="btn btn-decline"
              onClick={() => {
                if (window.confirm("Decline this reservation?")) changeStatus(row.id, "Cancelled");
              }}
              disabled={actionLoading}
            >
              Decline
            </button>
          </>
        ) : (
          <em>✔</em>
        )}

        <button
          className="btn btn-delete"
          onClick={() => deleteBooking(row.id)}
          style={{ marginLeft: 6 }}
          disabled={actionLoading}
        >
          Delete
        </button>
      </>
    );
  }

  return (
    <div>
      <style>{`
        :root {
          --bg-dark: #181818;
          --bg-sidebar: #202020;
          --text-light: #f1f1f1;
          --text-muted: #aaa;
          --accent: #c89d5c;
          --card-bg: #2a2a2a;
        }
        *{box-sizing:border-box;font-family:Segoe UI, Roboto, system-ui, sans-serif}
        body,html,#root{height:100%}
        .page{display:flex;min-height:100vh;background:var(--bg-dark);color:var(--text-light)}
        .sidebar{width:220px;background:var(--bg-sidebar);padding:20px;display:flex;flex-direction:column}
        .sidebar h2{color:var(--accent);font-size:20px;margin-bottom:24px}
        .sidebar a{color:var(--text-muted);text-decoration:none;margin:10px 0}
        .sidebar a.active{color:var(--accent)}
        .main{flex:1;padding:30px}
        h1{color:var(--accent);margin-bottom:16px}
        .controls{display:flex;gap:8px;align-items:center;margin-bottom:12px}
        table{width:100%;border-collapse:collapse;background:var(--card-bg);border-radius:8px;overflow:hidden}
        th,td{padding:10px;border-bottom:1px solid #333;text-align:left;vertical-align:middle}
        th{background:#2a2a2a;color:var(--accent)}
        tr:hover{background:#252525}
        .btn{padding:6px 10px;border-radius:4px;border:none;cursor:pointer;margin-right:6px}
        .btn-view{background:#3b82f6;color:white}
        .btn-accept{background:#4caf50;color:#fff}
        .btn-decline{background:#e53935;color:#fff}
        .btn-delete{background:#9b2c2c;color:#fff}
        .btn-refresh{background:#111827;color:#fff;padding:8px 12px}
        .status-pending{color:#e6c34d;font-weight:bold}
        .status-confirmed{color:#4caf50;font-weight:bold}
        .muted{color:var(--text-muted)}
        .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:60}
        .modal{background:#111;padding:18px;border-radius:8px;max-width:800px;width:94%;color:var(--text-light);box-shadow:0 8px 30px rgba(0,0,0,0.6)}
        .modal h3{margin:0 0 12px;color:var(--accent)}
        .modal pre{white-space:pre-wrap;background:#0f1724;padding:12px;border-radius:6px;color:#cbd5e1}
        @media (max-width:900px){
          .sidebar{display:none}
          .main{padding:16px}
          table,thead,tbody,tr,th,td{display:block}
          tr{margin-bottom:12px}
          th{display:none}
          td{padding:8px}
        }
      `}</style>

      <div className="page">
        <aside className="sidebar">
        <h2>Admin</h2>
        <a href="/admin" >Dashboard</a>
        <a href="/admin/reservations" className="active">Reservations</a>
        <a href="/admin/rooms">Rooms</a>
        <a href="/admin/guest">Guest</a>
        <a href="/admin/staff">Staff</a>
        <a href="/admin/gallery">Gallery</a>
        <a href="/admin/logout">Logout</a>
      </aside>

        <main className="main">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1>Reservations (Pending + Confirmed)</h1>
            <div className="controls">
              <button className="btn-refresh" onClick={fetchReservations} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {loading ? (
            <p className="muted">Loading...</p>
          ) : error ? (
            <p className="muted">{error}</p>
          ) : reservations.length === 0 ? (
            <p className="muted">No reservations found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Guest</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Room</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Adults</th>
                  <th>Rooms</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td style={{ minWidth: 140 }}>{r.name}</td>
                    <td style={{ minWidth: 160 }}>{r.email}</td>
                    <td>{r.phone || "-"}</td>
                    <td>{r.room_type || "-"}</td>
                    <td>{r.check_in || "-"}</td>
                    <td>{r.check_out || "-"}</td>
                    <td>{r.adults ?? "-"}</td>
                    <td>{r.rooms ?? "-"}</td>
                    <td style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis" }}>{r.message || "-"}</td>
                    <td>
                      {r.status === "Confirmed" ? (
                        <span className="status-confirmed">Confirmed</span>
                      ) : (
                        <span className="status-pending">Pending</span>
                      )}
                    </td>
                    <td>
                      <ActionButtons row={r} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Booking #{selected.id} — {selected.name}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-accept"
                  onClick={() => {
                    if (window.confirm("Confirm booking?")) changeStatus(selected.id, "Confirmed");
                  }}
                >
                  Confirm
                </button>
                <button
                  className="btn btn-decline"
                  onClick={() => {
                    if (window.confirm("Cancel booking?")) changeStatus(selected.id, "Cancelled");
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn-delete" onClick={() => deleteBooking(selected.id)}>
                  Delete
                </button>
                <button className="btn" onClick={() => setSelected(null)} style={{ background: "#374151", color: "#fff" }}>
                  Close
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <strong>Contact</strong>
              <div>Email: {selected.email || "-"}</div>
              <div>Phone: {selected.phone || "-"}</div>

              <hr style={{ borderColor: "#222", margin: "10px 0" }} />

              <strong>Stay</strong>
              <div>Room: {selected.room_type || "-"}</div>
              <div>Rooms: {selected.rooms ?? "-"}</div>
              <div>Check-in: {selected.check_in || "-"}</div>
              <div>Check-out: {selected.check_out || "-"}</div>
              <div>Adults: {selected.adults ?? "-"}</div>

              <hr style={{ borderColor: "#222", margin: "10px 0" }} />

              <strong>Message</strong>
              <pre style={{ whiteSpace: "pre-wrap" }}>{selected.message || "-"}</pre>

              <hr style={{ borderColor: "#222", margin: "10px 0" }} />

              <strong>Raw JSON</strong>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(selected, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
