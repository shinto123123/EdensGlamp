import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";
const WHATSAPP_NUMBER = "916282664307"; // India number (91 + your number)

export default function Menu() {
  const [foods, setFoods] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [orderItems, setOrderItems] = useState([]);
  const [showSummary, setShowSummary] = useState(false);

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

  const categories = ["all", "bread", "drinks", "veg", "non-veg", "dessert"];

  const filteredFoods =
    activeCategory === "all"
      ? foods
      : foods.filter((f) => f.category === activeCategory);

  /* ---------- ORDER LOGIC ---------- */

  const addToOrder = (food) => {
    setOrderItems((prev) => {
      const exists = prev.find((item) => item.id === food.id);
      if (exists) {
        return prev.map((item) =>
          item.id === food.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...food, qty: 1 }];
    });
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  /* ---------- WHATSAPP ORDER ---------- */

  const confirmOrder = () => {
    if (orderItems.length === 0) {
      alert("No items in order");
      return;
    }

    let message = `Hello, I would like to place a food order.%0A%0A`;

    orderItems.forEach((item) => {
      message += `• ${item.name} × ${item.qty} – ₹${
        item.price * item.qty
      }%0A`;
    });

    message += `%0A*Total Amount:* ₹${totalAmount}%0A%0AThank you.`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, "_blank");

    setOrderItems([]);
    setShowSummary(false);
  };

  return (
    <div className="menu-page">
      <style>{`
        .menu-page {
          background: #f8f4ec;
          min-height: 100vh;
          padding: 80px 24px 140px;
          font-family: 'Montserrat', 'Segoe UI', sans-serif;
        }

        .menu-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .menu-header h1 {
          color: #c89d5c;
          font-size: 42px;
        }

        .menu-header p {
          color: #555;
        }

        .category-tabs {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 40px;
        }

        .category-tabs button {
          border: 1px solid #c89d5c;
          background: transparent;
          color: #7a5a2b;
          padding: 8px 20px;
          border-radius: 20px;
          cursor: pointer;
        }

        .category-tabs button.active {
          background: #c89d5c;
          color: #111;
        }

        .menu-grid {
          max-width: 1200px;
          margin: auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 26px;
        }

        .menu-card {
          background: rgba(255, 255, 255, 0.85);
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(200, 157, 92, 0.25);
          transition: transform 0.25s ease;
        }

        .menu-card:hover {
          transform: translateY(-6px);
        }

        .menu-card img {
          width: 100%;
          height: 190px;
          object-fit: cover;
        }

        .menu-content {
          padding: 18px;
        }

        .menu-content .category {
          font-size: 12px;
          text-transform: uppercase;
          color: #c89d5c;
        }

        .menu-content h3 {
          font-size: 18px;
          margin: 6px 0;
        }

        .menu-content .price {
          font-weight: 600;
          color: #7a5a2b;
          margin-bottom: 12px;
        }

        .btn-add {
          width: 100%;
          padding: 10px;
          border-radius: 20px;
          border: 1px solid #c89d5c;
          background: transparent;
          cursor: pointer;
        }

        .btn-add:hover {
          background: rgba(200, 157, 92, 0.15);
        }

        /* ---------- ORDER BAR ---------- */

        .order-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          background: #1e1c1c;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
        }

        .order-bar button {
          background: #c89d5c;
          border: none;
          padding: 10px 24px;
          border-radius: 20px;
          cursor: pointer;
        }

        /* ---------- MODAL ---------- */

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .modal {
          background: #fff;
          border-radius: 18px;
          padding: 24px;
          width: 90%;
          max-width: 420px;
        }

        .modal h2 {
          color: #c89d5c;
          margin-bottom: 16px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .total {
          font-weight: 700;
          margin-top: 14px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .modal-actions button {
          flex: 1;
          padding: 10px;
          border-radius: 20px;
          cursor: pointer;
          border: none;
        }

        .btn-confirm {
          background: #c89d5c;
        }

        .btn-cancel {
          background: #ddd;
        }
      `}</style>

      <div className="menu-header">
        <h1>Our Menu</h1>
        <p>Carefully crafted dishes for your perfect stay</p>
      </div>

      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            className={activeCategory === cat ? "active" : ""}
            onClick={() => setActiveCategory(cat)}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {filteredFoods.map((food) => (
          <div className="menu-card" key={food.id}>
            <img
              src={food.image_url || `${API_BASE}${food.image}`}
              alt={food.name}
            />
            <div className="menu-content">
              <div className="category">{food.category}</div>
              <h3>{food.name}</h3>
              <div className="price">₹{food.price}</div>

              <button className="btn-add" onClick={() => addToOrder(food)}>
                Add to Order
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- ORDER BAR ---------- */}
      <div className="order-bar">
        <span>
          {orderItems.length} item(s) | ₹{totalAmount}
        </span>
        <button onClick={() => setShowSummary(true)}>Place Order</button>
      </div>

      {/* ---------- ORDER SUMMARY MODAL ---------- */}
      {showSummary && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Order Summary</h2>

            {orderItems.map((item) => (
              <div className="order-item" key={item.id}>
                <span>
                  {item.name} × {item.qty}
                </span>
                <span>₹{item.price * item.qty}</span>
              </div>
            ))}

            <div className="total">Total: ₹{totalAmount}</div>

            <div className="modal-actions">
              <button className="btn-confirm" onClick={confirmOrder}>
                Confirm Order (WhatsApp)
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowSummary(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
