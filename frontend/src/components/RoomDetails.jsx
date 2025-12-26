import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";


const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export default function RoomDetails() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [index, setIndex] = useState(0);
  const galleryRef = useRef(null);

  useEffect(() => {
    fetchRoom();
  }, [id]);

  async function fetchRoom() {
    try {
      const res = await axios.get(`${API_BASE}/api/rooms/`);
      const found = res.data.find((r) => r.id === Number(id));
      if (found) {
        setRoom(found);
        setImages(found.images || []);
      }
    } catch (err) {
      console.error("Failed to load room", err);
    } finally {
      setLoading(false);
    }
  }

  const moveGallery = (dir) => {
    if (!images.length) return;
    setIndex((prev) => (prev + dir + images.length) % images.length);
  };

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>;
  if (!room) return <p style={{ padding: 40 }}>Room not found</p>;

  return (
    <>
      {/* NAV */}
      <header className="nav fade-in">
        <div className="nav-inner">
          <div className="brand">
            <img src="/assets/images/glamp_logo.png" alt="Logo" className="logo" />
          </div>
          <nav className="menu">
            <Link to="/">Home</Link>
            <a href="#gallery">Rooms</a>
            <Link to="/reservation">Reservation</Link>
            <a className="reserve" href="/reservation">Reserve</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section
        className="hero fade-up"
        style={{
          background: `url(${images[0]?.image}) center/cover no-repeat`,
        }}
      >
        <div className="hero-overlay">
          <h1>{room.room_name}</h1>
          <p>Experience nature with unmatched comfort & elegance</p>
          <div className="breadcrumb">
            <Link to="/">Home</Link> / Room Details
          </div>
        </div>
      </section>

      {/* DETAILS */}
      <section className="room-details fade-up">
        <div className="room-container">
          <h2 className="room-title">{room.room_name}</h2>

          <div className="room-price-box">
            <div className="price">₹{Number(room.price).toFixed(2)} / night</div>
            <Link to="/reservation" className="reserve-btn">
              RESERVE NOW
            </Link>
          </div>

          <p className="room-description">{room.description}</p>

          {/* IMAGE GALLERY */}
          {images.length > 0 && (
            <div className="room-gallery" id="gallery">
              <div
                className="gallery-wrapper"
                ref={galleryRef}
                style={{ transform: `translateX(-${index * 100}%)` }}
              >
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img.image}
                    alt="Room"
                  />
                ))}
              </div>
              <button className="gallery-btn left" onClick={() => moveGallery(-1)}>‹</button>
              <button className="gallery-btn right" onClick={() => moveGallery(1)}>›</button>
            </div>
          )}
        </div>
      </section>

      {/* AMENITIES */}
      <section className="room-amenities fade-up">
        <div className="amenities-container">
          <div className="amenity"><i className="fas fa-users"></i> {room.capacity} Guests</div>
          <div className="amenity"><i className="fas fa-bed"></i> King Bed</div>
          <div className="amenity"><i className="fas fa-wifi"></i> Free WiFi</div>
          <div className="amenity"><i className="fas fa-bath"></i> Bathtub</div>
          <div className="amenity"><i className="fas fa-city"></i> Scenic View</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer fade-in">
        <div className="footer-inner">
          <div>
            <h4>Address</h4>
            <p>Adimali, Idukki, Kerala</p>
          </div>
          <div>
            <h2>THE PARADISE GLAMP</h2>
            ★★★★★
          </div>
          <div>
            <h4>Contact</h4>
            <p>+91 9497185771</p>
          </div>
        </div>
      </footer>
    </>
  );
}
