import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function AdminFood() {
  const [foodName, setFoodName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [foods, setFoods] = useState([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/food/`);
      setFoods(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!foodName || !category || !price || !image) {
      setError("Please fill all fields.");
      return;
    }

    const fd = new FormData();
    fd.append("name", foodName);
    fd.append("category", category);
    fd.append("price", price);
    fd.append("image", image);

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/food/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg("✅ Food item added successfully!");
      setFoodName("");
      setCategory("");
      setPrice("");
      setImage(null);
      setPreview(null);
      fetchFoods();
    } catch (err) {
      setError("❌ Failed to add food.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this food item?")) return;

    try {
      await axios.delete(`${API_BASE}/api/food/${id}/`);
      setFoods((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      alert("Failed to delete food");
    }
  };

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
        .page{display:flex;min-height:100vh;background:var(--bg-dark);color:var(--text-light)}
        .sidebar{
          width:200px;
          background:var(--bg-sidebar);
          padding:20px;
          position:fixed;
          top:0;
          left:0;
          height:100vh;
          display:flex;
          flex-direction:column;
        }
        .sidebar h2{color:var(--accent);margin-bottom:20px}
        .sidebar a{color:var(--text-muted);text-decoration:none;margin:8px 0}
        .sidebar a.active{color:var(--accent)}
        .main{
          flex:1;
          padding:28px;
          margin-left:200px;
        }
        h1,h2{color:var(--accent)}
        form, table{
          background:var(--card-bg);
          padding:16px;
          border-radius:8px;
          margin-bottom:20px;
        }
        label{
          display:block;
          color:var(--text-muted);
          font-size:13px;
          margin-top:8px;
        }
        input, select{
          width:100%;
          padding:10px;
          margin-top:6px;
          border-radius:6px;
          border:none;
          background:#3e3e3e;
          color:#fff;
        }
        .btn{
          margin-top:14px;
          background:var(--accent);
          color:#111;
          padding:10px 14px;
          border-radius:6px;
          border:none;
          cursor:pointer;
        }
        .btn-delete{
          background:#e53935;
          color:#fff;
          border:none;
          padding:6px 10px;
          border-radius:6px;
          cursor:pointer;
        }
        table{width:100%;border-collapse:collapse}
        th,td{padding:12px;border-bottom:1px solid #333}
        th{color:var(--accent);text-align:left}
        img.thumb{
          width:80px;
          height:60px;
          object-fit:cover;
          border-radius:4px;
        }
        @media (max-width:900px){
          .sidebar{display:none}
          .main{margin-left:0}
        }
      `}</style>

      <div className="page">
        <aside className="sidebar">
          <h2>Admin</h2>
          <a href="/admin">Dashboard</a>
          <a href="/admin/reservations">Reservations</a>
          <a href="/admin/rooms">Rooms</a>
          <a href="/admin/staff">Staff</a>
          <a href="/admin/food" className="active">Food</a>
          <a href="/admin/gallery">Gallery</a>
        </aside>

        <main className="main">
          <h1>Manage Food</h1>

          {msg && <div style={{ color: "#9ef59e" }}>{msg}</div>}
          {error && <div style={{ color: "#ff8a8a" }}>{error}</div>}

          {/* ADD FOOD */}
          <form onSubmit={handleSubmit}>
            <label>Food Name</label>
            <input value={foodName} onChange={(e) => setFoodName(e.target.value)} />

            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select</option>
              <option value="bread">Bread</option>
              <option value="drinks">Drinks</option>
              <option value="veg">Veg</option>
              <option value="non-veg">Non Veg</option>
              <option value="dessert">Dessert</option>
            </select>

            <label>Price (₹)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <label>Image</label>
            <input type="file" onChange={handleImageChange} />

            <button className="btn" disabled={loading}>
              {loading ? "Adding..." : "Add Food"}
            </button>
          </form>

          {/* FOOD LIST */}
          <h2>Food Items</h2>

          {foods.length === 0 ? (
            <p>No food items added.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {foods.map((f) => (
                  <tr key={f.id}>
                    <td>{f.id}</td>
                    <td>
                      <img
                        src={f.image_url || `${API_BASE}${f.image}`}
                        alt={f.name}
                        className="thumb"
                      />
                    </td>
                    <td>{f.name}</td>
                    <td>{f.category}</td>
                    <td>₹{f.price}</td>
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(f.id)}
                      >
                        Delete
                      </button>
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
