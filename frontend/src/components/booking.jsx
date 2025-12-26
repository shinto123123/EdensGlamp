import React, { useEffect, useRef, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import "../styles/booking.css"; // reuse/merge with your existing booking.css

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function Reservation() {
  const [rooms, setRooms] = useState([]);
  const [reservedRanges, setReservedRanges] = useState([]); // {from, to}
  const [errorMsg, setErrorMsg] = useState("");
  const dateInputRef = useRef(null);
  const fpRef = useRef(null);

  // Form state
  const [selectedRoom, setSelectedRoom] = useState(null); // full object
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);
  const [adults, setAdults] = useState(1);
  const [numRooms, setNumRooms] = useState(1);
  const [form, setForm] = useState({
    reservation_dates: "",
    room_type: "",
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // fetch rooms and reservations (to build disabled ranges)
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        // fetch rooms
        const rRes = await fetch(`${API_BASE}/api/rooms/`);
        const rJson = rRes.ok ? await rRes.json() : [];
        // normalize rooms to have image and price keys similar to your php
        const roomsNormalized = Array.isArray(rJson)
          ? rJson.map((r) => ({
              room_id: r.id ?? r.room_id ?? "",
              room_name: r.room_name ?? r.name ?? `Room ${r.id ?? ""}`,
              price: r.price ?? r.rate ?? 0,
              image:
                r.image && typeof r.image === "string"
                  ? // if API returns relative path like "/media/...", prepend host
                    (r.image.startsWith("http") ? r.image : `${API_BASE}${r.image}`)
                  : "/assets/images/uploads/default.jpg",
              raw: r,
            }))
          : [];

        // fetch reservations to build disabled ranges
        const rvRes = await fetch(`${API_BASE}/api/reservations/`);
        const rvJson = rvRes.ok ? await rvRes.json() : [];

        // build disabled ranges in {from,to} where to = checkout - 1 day
        const ranges = Array.isArray(rvJson)
          ? rvJson
              .filter((it) => {
                // try to ignore cancelled if backend provided status
                return it.status ? it.status.toLowerCase() !== "cancelled" : true;
              })
              .map((it) => {
                const checkin = it.checkin ?? it.check_in ?? it.start ?? null;
                const checkout = it.checkout ?? it.check_out ?? it.end ?? null;
                if (!checkin || !checkout) return null;
                // calculate to = checkout - 1 day
                const toDate = new Date(checkout);
                toDate.setDate(toDate.getDate() - 1);
                const to = toDate.toISOString().slice(0, 10);
                const from = checkin;
                return { from, to };
              })
              .filter(Boolean)
          : [];

        if (!mounted) return;
        setRooms(roomsNormalized);
        setReservedRanges(ranges);

        // set default selected room if available
        if (roomsNormalized.length > 0 && !selectedRoom) {
          setSelectedRoom(roomsNormalized[0]);
          setForm((f) => ({ ...f, room_type: roomsNormalized[0].room_name }));
        }
      } catch (err) {
        console.error("Failed to load rooms/reservations:", err);
        setErrorMsg("Failed to load data from server.");
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize flatpickr on the date input with disabled ranges
  useEffect(() => {
    const el = dateInputRef.current;
    if (!el) return;

    // destroy existing instance
    if (fpRef.current) {
      try {
        fpRef.current.destroy();
      } catch (e) {}
      fpRef.current = null;
    }

    // transform reservedRanges into flatpickr disable ranges
    const disable = (reservedRanges || []).map((r) => {
      // flatpickr accepts { from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
      return { from: r.from, to: r.to };
    });

    fpRef.current = flatpickr(el, {
      mode: "range",
      dateFormat: "Y-m-d",
      minDate: "today",
      disable,
      onClose: function (selectedDates, dateStr) {
        setForm((f) => ({ ...f, reservation_dates: dateStr }));
      },
    });

    return () => {
      if (fpRef.current) {
        try {
          fpRef.current.destroy();
        } catch (e) {}
        fpRef.current = null;
      }
    };
  }, [reservedRanges]);

  // animation observer (same as your PHP script)
  useEffect(() => {
    const animated = document.querySelectorAll(".fade-in, .fade-up, .fade-left, .fade-right");
    if (!animated.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const parentChildren = entry.target.parentNode ? [...entry.target.parentNode.children] : [];
            const delay = parentChildren.indexOf(entry.target) * 120;
            setTimeout(() => entry.target.classList.add("show"), delay);
          }
        });
      },
      { threshold: 0.2 }
    );
    animated.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // room dropdown toggle + outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest(".custom-select")) {
        setRoomDropdownOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleRoomCardClick = (room) => {
    setSelectedRoom(room);
    setForm((f) => ({ ...f, room_type: room.room_name }));
    setRoomDropdownOpen(false);
  };

  const inc = (setter, value) => setter((v) => Math.max(0, v + value));
  const dec = (setter, value) => setter((v) => Math.max(0, v - value));

  // form input handler
  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // basic validation
    const dates = form.reservation_dates.split(" to ");
    const check_in = dates[0] ?? null;
    const check_out = dates[1] ?? null;
    if (!check_in || !check_out) {
      setErrorMsg("Please select check-in and check-out dates.");
      return;
    }
    if (!form.name || !form.email || !form.phone) {
      setErrorMsg("Please fill name, email and phone.");
      return;
    }

    // prepare payload - match the PHP form names so backend can accept
    const payload = {
      reservation_dates: form.reservation_dates,
      checkin: check_in,
      checkout: check_out,
      adults,
      rooms: numRooms,
      room_type: form.room_type,
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: form.message,
    };

    try {
      const resp = await fetch(`${API_BASE}/api/reservations/`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    adults: Number(payload.adults),
    children: 0,
    // <-- use serializer field names expected by DRF
    check_in: payload.checkin,   // YYYY-MM-DD
    check_out: payload.checkout, // YYYY-MM-DD
    message: payload.message,
    // optional extra data
    extra: {
      room_type: payload.room_type,
      rooms_count: payload.rooms,
    },
  }),
});

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => null);
        throw new Error(errBody?.detail || JSON.stringify(errBody) || `Server error (${resp.status})`);
      }

      // success - you can redirect or show a success UI
      // here we'll redirect to a success route if you have one, otherwise show alert
      const data = await resp.json();
      // if you want to navigate, use react-router's useNavigate (not used here)
      alert("Reservation successful! Reference: " + (data.id ?? ""));
      // reset form (similar to PHP redirect behavior)
      setForm({
        reservation_dates: "",
        room_type: selectedRoom ? selectedRoom.room_name : "",
        name: "",
        email: "",
        phone: "",
        message: "",
      });
      setAdults(1);
      setNumRooms(1);
      if (fpRef.current) fpRef.current.clear();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit reservation");
    }
  };

  return (
    <div>
      {/* Navbar (you probably have a shared Navbar component — keep or remove) */}
      <nav className="nav fade-in">
        <div className="nav-inner">
          <div className="brand">
            <img src="/assets/images/glamp_logo.png" alt="Resort Logo" className="logo" />
          </div>
          <div className="menu">
            <a href="/">Home</a>
            <a href="#rooms">Rooms</a>
            <a href="#contact">Contact</a>
            <a href="/reservation" className="reserve">
              Reserve
            </a>
          </div>
        </div>
      </nav>

      <section
        className="hero fade-up"
        style={{
            background: "url('/assets/images/reservation.jpg') center/cover no-repeat"
        }}
        >


        <div className="hero-overlay fade-in">
          <h1>Book Your Stay</h1>
          <p>Experience luxury in nature with THE PARADISE GLAMP</p>
          <div className="breadcrumb">
            <a href="/">Home</a> / Reservation
          </div>
        </div>
      </section>

      <section className="reservation-section fade-up">
        <div className="reservation-container">
          {errorMsg && <p style={{ color: "red", fontWeight: 700 }}>❌ {errorMsg}</p>}

          <form id="reservationForm" className="fade-in" onSubmit={handleSubmit}>
            <div className="form-group fade-up">
              <label htmlFor="datePicker">Select Dates</label>
              <input
                type="text"
                id="datePicker"
                ref={dateInputRef}
                name="reservation_dates"
                placeholder="Select check-in — check-out"
                autoComplete="off"
                value={form.reservation_dates}
                readOnly
              />
            </div>

            {/* Room selector */}
            <div className="form-group custom-select fade-up">
              <div id="selectedRoom" className="selected-room" onClick={(e) => { e.stopPropagation(); setRoomDropdownOpen((s) => !s); }}>
                {selectedRoom ? (
                  <>
                    <img src={selectedRoom.image} alt={selectedRoom.room_name} />
                    <div>
                      <h4>{selectedRoom.room_name}</h4>
                      <p>₹{Number(selectedRoom.price).toLocaleString(undefined, { maximumFractionDigits: 2 })} / night</p>
                    </div>
                    <i className="fa fa-chevron-down" style={{ marginLeft: "auto", transform: roomDropdownOpen ? "rotate(180deg)" : "rotate(0)" }} />
                  </>
                ) : (
                  <span>No rooms available</span>
                )}
              </div>

              <div id="roomOptions" className={"room-options" + (roomDropdownOpen ? " show" : "")}>
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <div
                      key={room.room_id}
                      className="room-card"
                      data-value={room.room_name}
                      data-img={room.image}
                      onClick={() => handleRoomCardClick(room)}
                    >
                      <img src={room.image} alt={room.room_name} />
                      <div>
                        <h4>{room.room_name}</h4>
                        <p>₹{Number(room.price).toLocaleString(undefined, { maximumFractionDigits: 2 })} / night</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 12 }}>No rooms available</div>
                )}
              </div>
            </div>

            <input type="hidden" id="roomType" name="room_type" value={form.room_type} readOnly />

            <div className="counters">
              <div className="counter fade-up">
                <label>Adults</label>
                <div className="counter-controls">
                  <button type="button" className="minus" onClick={() => dec(() => {}, 0) /* noop to keep structure */} disabled>
                    -
                  </button>
                  <button
                    type="button"
                    className="minus"
                    onClick={() => dec(setAdults, 1)}
                    aria-label="Decrease adults"
                  >
                    -
                  </button>
                  <span>{adults}</span>
                  <button type="button" className="plus" onClick={() => inc(setAdults, 1)} aria-label="Increase adults">
                    +
                  </button>
                  <input type="hidden" name="adults" id="inputAdults" value={adults} readOnly />
                </div>
              </div>

              <div className="counter fade-up">
                <label>Rooms</label>
                <div className="counter-controls">
                  <button type="button" className="minus" onClick={() => dec(setNumRooms, 1)} aria-label="Decrease rooms">
                    -
                  </button>
                  <span>{numRooms}</span>
                  <button type="button" className="plus" onClick={() => inc(setNumRooms, 1)} aria-label="Increase rooms">
                    +
                  </button>
                  <input type="hidden" name="rooms" id="inputRooms" value={numRooms} readOnly />
                </div>
              </div>
            </div>

            <div className="details-grid">
              <div className="left">
                <input type="text" name="name" placeholder="Full Name" required className="fade-up" value={form.name} onChange={(e) => handleInput(e)} />
                <input type="email" name="email" placeholder="Email Address" required className="fade-up" value={form.email} onChange={(e) => handleInput(e)} />
                <input type="text" name="phone" placeholder="Phone Number" required className="fade-up" value={form.phone} onChange={(e) => handleInput(e)} />
              </div>

              <div className="right">
                <textarea name="message" placeholder="Special Requests" className="fade-up" value={form.message} onChange={(e) => handleInput(e)} />
              </div>
            </div>

            <button type="submit" className="check-btn fade-up">
              Book Now
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
