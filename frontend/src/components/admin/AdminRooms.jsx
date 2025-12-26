import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState(2);
  const [images, setImages] = useState([]); // File list
  const [previewUrls, setPreviewUrls] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    // build preview urls for selected images
    if (!images || images.length === 0) {
      setPreviewUrls([]);
      return;
    }
    const urls = Array.from(images).map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [images]);

  async function fetchRooms() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/rooms/`);
      // normalize shape: expect array of { id, room_name, description, price, capacity, images: [{url}] }
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setRooms(data);
    } catch (err) {
      console.error(err);
      setError("Could not fetch rooms. Check API and CORS.");
    } finally {
      setLoading(false);
    }
  }

  function handleFiles(e) {
    const files = e.target.files;
    if (!files) return;
    setImages(files);
  }

  async function handleAddRoom(e) {
    e.preventDefault();
    setMsg("");
    setError("");
    if (!roomName || !price) {
      setError("Please fill required fields (Room name and Price).");
      return;
    }

    setSubmitting(true);
    try {
      // Prepare multipart form data
      const fd = new FormData();
      fd.append("room_name", roomName);
      fd.append("description", description);
      fd.append("price", price);
      fd.append("capacity", capacity);

      // append images[] if any
      if (images && images.length > 0) {
        Array.from(images).forEach((file) => {
          fd.append("images[]", file);
        });
      }

      // POST to backend
      const res = await axios.post(`${API_BASE}/api/rooms/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // If backend returns created room, add to list
      const created = res?.data;
      setMsg("✅ Room added successfully!");
      // clear form
      setRoomName("");
      setDescription("");
      setPrice("");
      setCapacity(2);
      setImages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPreviewUrls([]);

      // Refresh list (preferred) or optimistic update
      fetchRooms();
    } catch (err) {
      console.error(err);
      const text = err?.response?.data?.detail || JSON.stringify(err?.response?.data) || err.message || "Failed to add room";
      setError("❌ " + text);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this room? This will remove associated images.")) return;
    try {
      await axios.delete(`${API_BASE}/api/rooms/${id}/`);
      setMsg("❌ Room deleted successfully.");
      setRooms((prev) => prev.filter((r) => (r.id ?? r.room_id) !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete room.");
    }
  }

  // SAFE helper for rendering image thumbnails (handles many shapes)
  function renderPreviewImages(room) {
    // room.images may be an array of objects with url, image_path, image, or simple strings
    const imgs = room.images ?? room.room_images ?? room.images_list ?? [];

    if (Array.isArray(imgs) && imgs.length > 0) {
      return imgs.slice(0, 3).map((img, idx) => {
        let src = null;

        // If img is a plain string
        if (typeof img === "string") {
          src = img;
        } else if (img && typeof img === "object") {
          // Common possible keys
          src = img.url ?? img.image ?? img.image_path ?? img.path ?? img.src ?? null;

          // Sometimes backend nests image object like { image: { url: "/media/..." } }
          if (!src && img.image && typeof img.image === "object") {
            src = img.image.url ?? img.image.path ?? null;
          }
        }

        if (!src || typeof src !== "string") {
          // can't build usable src → placeholder
          return (
            <div
              key={idx}
              style={{
                width: 80,
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#111",
                color: "#777",
                borderRadius: 4,
                marginRight: 6,
                fontSize: 12,
              }}
            >
              No Image
            </div>
          );
        }

        // Normalize URL: absolute URLs are used as-is; leading slash paths are prefixed with API_BASE
        const finalSrc = src.startsWith("http") ? src : src.startsWith("/") ? `${API_BASE}${src}` : `${API_BASE}/${src}`;

        return (
          <img
            key={idx}
            src={finalSrc}
            alt={`room-${idx}`}
            style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4, marginRight: 6 }}
          />
        );
      });
    }

    // fallback: some APIs return preview_image / image / thumbnail fields
    const preview = room.preview_image ?? room.image ?? room.image_path ?? room.thumbnail;
    if (preview && typeof preview === "string") {
      const pSrc = preview.startsWith("http") ? preview : preview.startsWith("/") ? `${API_BASE}${preview}` : `${API_BASE}/${preview}`;
      return <img src={pSrc} alt="preview" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4, marginRight: 6 }} />;
    }

    return <em>No Images</em>;
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
        *{box-sizing:border-box;font-family:"Segoe UI",sans-serif}
        body,html,#root{height:100%}
        .page{display:flex;min-height:100vh;background:var(--bg-dark);color:var(--text-light)}
        .sidebar{width:180px;background:var(--bg-sidebar);padding:20px;display:flex;flex-direction:column;position:fixed;left:0;top:0;height:100vh}
        .sidebar h2{color:var(--accent);font-size:18px;margin-bottom:20px}
        .sidebar a{color:var(--text-muted);text-decoration:none;margin:8px 0}
        .sidebar a.active{color:var(--accent)}
        .main{flex:1;padding:28px;margin-left:200px}
        h1{color:var(--accent);margin-bottom:12px}
        form{background:var(--card-bg);padding:16px;border-radius:8px;margin-bottom:20px}
        label{display:block;color:var(--text-muted);font-size:13px;margin-top:8px}
        input[type="text"], input[type="number"], textarea {width:100%;padding:10px;margin-top:6px;border-radius:6px;border:none;background:#3e3e3e;color:var(--text-light)}
        input[type="file"]{color:var(--text-light);margin-top:8px}
        .form-actions{margin-top:12px}
        .btn{background:var(--accent);color:#111;padding:10px 14px;border-radius:6px;border:none;cursor:pointer}
        .btn:disabled{opacity:0.6;cursor:not-allowed}
        .btn-delete{background:#e53935;color:#fff;padding:6px 10px;border-radius:6px;border:none;cursor:pointer}
        table{width:100%;border-collapse:collapse;background:var(--card-bg);border-radius:8px;overflow:hidden}
        th,td{padding:12px;border-bottom:1px solid #333;text-align:left;vertical-align:middle}
        th{color:var(--accent)}
        img.thumb{width:80px;height:60px;object-fit:cover;border-radius:4px;margin-right:6px}
        .message{margin-bottom:12px;font-weight:700}
        .preview-row{display:flex;gap:8px;margin-top:8px}
        @media (max-width:900px){
          .main{margin-left:0;padding:16px}
          .sidebar{display:none}
        }
      `}</style>

      <div className="page">
        <aside className="sidebar">
        <h2>Admin</h2>
        <a href="/admin" >Dashboard</a>
        <a href="/admin/reservations">Reservations</a>
        <a href="/admin/rooms" className="active">Rooms</a>
        <a href="/admin/guest">Guest</a>
        <a href="/admin/staff">Staff</a>
        <a href="/admin/gallery">Gallery</a>
        <a href="/admin/logout">Logout</a>
      </aside>

        <main className="main">
          <h1>Manage Rooms</h1>

          {msg && <div className="message" style={{ color: msg.startsWith("❌") ? "#f97373" : "#9ef59e" }}>{msg}</div>}
          {error && <div className="message" style={{ color: "#ff8a8a" }}>{error}</div>}

          <form onSubmit={handleAddRoom} encType="multipart/form-data">
            <label>Room Name:</label>
            <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} required />

            <label>Description:</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />

            <label>Images:</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles} />

            {previewUrls.length > 0 && (
              <div className="preview-row">
                {previewUrls.map((u, i) => (
                  <img key={i} src={u} alt={`preview-${i}`} className="thumb" />
                ))}
              </div>
            )}

            <label>Price (₹):</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />

            <label>Capacity:</label>
            <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />

            <div className="form-actions">
              <button className="btn" type="submit" disabled={submitting}>{submitting ? "Adding..." : "Add Room"}</button>
            </div>
          </form>

          <h2 style={{ marginBottom: 12 }}>All Rooms</h2>

          {loading ? (
            <div className="message muted">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="message muted">No rooms found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Room Name</th>
                  <th>Description</th>
                  <th>Images</th>
                  <th>Price</th>
                  <th>Capacity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id ?? room.room_id}>
                    <td>{room.id ?? room.room_id}</td>
                    <td style={{ maxWidth: 220 }}>{room.room_name ?? room.name}</td>
                    <td style={{ maxWidth: 360 }}>{room.description ?? "-"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {renderPreviewImages(room)}
                      </div>
                    </td>
                    <td>₹{Number(room.price ?? room.rate ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>{room.capacity ?? "-"}</td>
                    <td>
                      <button className="btn-delete" onClick={() => handleDelete(room.id ?? room.room_id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>
    </div>
  );
}
