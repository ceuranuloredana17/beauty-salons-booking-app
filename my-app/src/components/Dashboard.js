import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Salons from "./Salons";
import CalendarSelector from "./CalendarSelector";
import PendingBusinesses from "./PendingBusinesses";
import MyBookings from "./MyBookings";
import VoucherStore from "./VoucherStore"; 
import heroImg from '../images/coperta.jpg';
import dianaImg from '../images/woman1.jpg';
import andreeaImg from '../images/woman3.jpg';
import mihaiImg from '../images/men.jpg';

function Dashboard() {
  const [service, setService] = useState("Any Service");
  const [location, setLocation] = useState("sector1");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeAdminTab, setActiveAdminTab] = useState("pending");
  const [activeUserTab, setActiveUserTab] = useState("search"); 
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:8080/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setProfile)
      .catch(console.error);
  }, []);

  const [stats, setStats] = useState({
    activeUsers: 0,
    registeredSalons: 0,
    pendingBusinesses: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || profile?.role !== "Admin") return;
  
    fetch("http://localhost:8080/api/auth/statistics", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setStats)
      .catch((err) => {
        console.error("Eroare la încărcarea statisticilor:", err);
      });
  }, [profile]);  

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSearchSalons = async () => {
    try {
      setLoading(true);
      setError(null);
      const sectorNumber = location.replace("sector", "");
      const formattedDate = date;
      const params = new URLSearchParams({
        service,
        sector: sectorNumber,
        date: formattedDate,
        time,
      });

      const response = await fetch(
        `http://localhost:8080/api/salons/search?${params}`
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
      setLoading(false);
    } catch (err) {
      console.error("Error searching salons:", err);
      setError("A apărut o eroare la căutarea saloanelor. Vă rugăm încercați din nou.");
      setLoading(false);
    }
  };

  const isAdmin = profile?.role === "Admin";

  if (isAdmin) {
    return (
      <div className="dashboard admin-dashboard page-transition">
        <header className="dashboard-header admin-header">
          <div className="header-content">
            <h1>Admin Dashboard</h1>
            <p className="admin-subtitle">Sistem de administrare Bookly</p>
          </div>
          <div className="admin-profile">
            {profile && (
              <div className="admin-user">
                <span>{profile.prenume} {profile.nume}</span>
                <span className="admin-badge">Admin</span>
              </div>
            )}
            <button className="btn btn-primary logout-btn" onClick={handleLogout}>
              Delogare
            </button>
          </div>
        </header>

        <nav className="admin-nav">
          <ul className="admin-tabs">
            <li className={`admin-tab ${activeAdminTab === "pending" ? "active" : ""}`} onClick={() => setActiveAdminTab("pending")}>
              Conturi în așteptare
            </li>
            <li className={`admin-tab ${activeAdminTab === "statistics" ? "active" : ""}`} onClick={() => setActiveAdminTab("statistics")}>
              Statistici
            </li>
            
          </ul>
        </nav>

        <main className="dashboard-main admin-main">
          {activeAdminTab === "pending" && (
            <div className="admin-container card">
              <h2>Administrare Conturi Business</h2>
              <p className="admin-description">
                Aprobați sau respingeți cererile de înregistrare pentru conturile de business.
                După aprobare, proprietarii vor putea să-și gestioneze saloanele.
              </p>
              <PendingBusinesses />
            </div>
          )}

          {activeAdminTab === "statistics" && (
            <div className="admin-container card">
              <h2>Statistici Platformă</h2>
              <div className="stats-grid">
              <div className="stat-card">
  <div className="stat-number">{stats.activeUsers}</div>
  <div className="stat-label">Utilizatori Activi</div>
</div>
<div className="stat-card">
  <div className="stat-number">{stats.registeredSalons}</div>
  <div className="stat-label">Saloane Înregistrate</div>
</div>
<div className="stat-card">
  <div className="stat-number">{stats.pendingBusinesses}</div>
  <div className="stat-label">Conturi în așteptare</div>
</div>

              </div>
            </div>
          )}

          {activeAdminTab === "settings" && (
            <div className="admin-container card">
              <h2>Setări Sistem</h2>
              <p className="admin-description">
                Această secțiune este în curs de dezvoltare. Aici veți putea configura
                parametrii sistemului și reguli de business.
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard page-transition">
      {}
      <section
        className="dashboard-hero"
        style={{ background: `url(${heroImg}) center center/cover no-repeat` }}
      >
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">Bookly</h1>
            <p className="hero-subtitle">Programează-te acum pentru servicii de îngrijire și înfrumusețare aproape de tine!</p>
          </div>
        </div>
      </section>

 
      <button className="hero-logout-btn" onClick={handleLogout}>
        Delogare
      </button>

      <nav className="user-nav">
        <ul className="user-tabs">
          <li
            className={`user-tab ${activeUserTab === "search" ? "active" : ""}`}
            onClick={() => setActiveUserTab("search")}
          >
            <span className="tab-icon">🔍</span>
            Caută saloane
          </li>
          <li
            className={`user-tab ${activeUserTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveUserTab("bookings")}
          >
            <span className="tab-icon">📅</span>
            Programările mele
          </li>
          <li
            className={`user-tab ${activeUserTab === "vouchers" ? "active" : ""}`}
            onClick={() => setActiveUserTab("vouchers")}
          >
            <span className="tab-icon">🎁</span>
            Vouchere
          </li>
        </ul>
      </nav>

      {/* Tab Content */}
      {activeUserTab === "search" && (
        <form
          className="form-container form-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchSalons();
          }}
        >
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="service" className="form-label">Service</label>
              <select id="service" value={service} onChange={(e) => setService(e.target.value)} className="form-select">
                <option value="Any Service">Any Service</option>
                <option value="Tuns">Tuns</option>
                <option value="Coafat">Coafat</option>
                <option value="Vopsit">Vopsit</option>
                <option value="Manichiura">Manichiură</option>
                <option value="Pedichiura">Pedichiura</option>
                <option value="Tratament">Tratament facial</option>
                <option value="Masaj">Masaj</option>
                <option value="Gene">Gene</option>
                <option value="Sprancene">Sprâncene</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="location" className="form-label">Sector</label>
              <select id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="form-select">
                <option value="">Any Sector</option>
                <option value="sector1">Sector 1</option>
                <option value="sector2">Sector 2</option>
                <option value="sector3">Sector 3</option>
                <option value="sector4">Sector 4</option>
                <option value="sector5">Sector 5</option>
                <option value="sector6">Sector 6</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="date" className="form-label">Date</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="form-input" required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label htmlFor="time" className="form-label">Time</label>
              <input type="time" id="time" value={time} onChange={(e) => setTime(e.target.value)} className="form-input" required />
            </div>
            <div className="form-group form-group-btn">
              <button type="submit" className="btn btn-primary search-btn" disabled={!date || !time || loading}>
                <span role="img" aria-label="search">🔍</span> Search
              </button>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="results-container">
            <Salons salons={results} date={date} time={time} service={service} loading={loading} />
          </div>
          <div className="our-services-section">
            <h2 className="our-services-title">Our Services</h2>
            <div className="our-services-grid">
              <div className="service-card">
                <span className="service-emoji" role="img" aria-label="Coafat">💇‍♀️</span>
                <span className="service-label">Coafat</span>
              </div>
              <div className="service-card">
                <span className="service-emoji" role="img" aria-label="Nail Care">💅</span>
                <span className="service-label">Manichiură</span>
              </div>
              <div className="service-card">
                <span className="service-emoji" role="img" aria-label="Makeup">💄</span>
                <span className="service-label">Makeup</span>
              </div>
              <div className="service-card">
                <span className="service-emoji" role="img" aria-label="Spa & Massage">😺</span>
                <span className="service-label">Spa și masaj</span>
              </div>
              <div className="service-card">
                <span className="service-emoji" role="img" aria-label="Skincare">✨</span>
                <span className="service-label">Tratamente</span>
              </div>
              <div className="service-card">
                <span className="service-emoji" role="img" aria-label="Eyebrows & Lashes">👁️</span>
                <span className="service-label">Sprâncene </span>
              </div>
            </div>
          </div>
          <section className="how-it-works-section">
            <h2 className="how-it-works-title">Cum funcționează</h2>
            <div className="how-it-works-grid">
              <div className="how-card">
                <span className="how-icon" style={{ background: 'rgba(255, 107, 107, 0.13)' }}>
                  <span role="img" aria-label="Caută">🔍</span>
                </span>
                <h3 className="how-title">Caută</h3>
                <p className="how-desc">Alege una din categoriile de mai sus sau cauți după salonul favorit și selectează serviciul dorit.</p>
              </div>
              <div className="how-card">
                <span className="how-icon" style={{ background: 'rgba(98, 0, 238, 0.13)' }}>
                  <span role="img" aria-label="Book">📅</span>
                </span>
                <h3 className="how-title">Programează-te</h3>
                <p className="how-desc">Programează-te în câteva minute la salonul ales.</p>
              </div>
              <div className="how-card">
                <span className="how-icon" style={{ background: 'rgba(0, 238, 174, 0.13)' }}>
                  <span role="img" aria-label="Enjoy">✂️</span>
                </span>
                <h3 className="how-title">Relaxează-te</h3>
                <p className="how-desc">Bucură-te de vizita la salon.</p>
              </div>
            </div>
            <section className="testimonials-section">
              <h2 className="testimonials-title">Ce spun clienții noștri</h2>
              <div className="testimonials-grid">
                <div className="testimonial-card">
                  <img src={dianaImg} alt="Diana" className="testimonial-avatar" />

                  <strong className="testimonial-name">Diana M.</strong>
                  <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
                  <p className="testimonial-text">
                    "Bookly made it so easy to find a great salon near me. I booked my appointment in minutes and loved the service I received!"
                  </p>
                </div>

                <div className="testimonial-card">
                  <img src={andreeaImg} alt="Andreea" className="testimonial-avatar" />
                  <strong className="testimonial-name">Andreea C.</strong>
                  <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
                  <p className="testimonial-text">
                    "As a salon owner, this platform has increased my bookings by 30%. The interface is user-friendly and the support team is excellent."
                  </p>
                </div>

                <div className="testimonial-card">
                  <img src={mihaiImg} alt="Mihai" className="testimonial-avatar" />
                  <strong className="testimonial-name">Mihai D.</strong>
                  <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
                  <p className="testimonial-text">
                    "I've tried several booking platforms and Bookly is by far the best. The ability to filter by sector in Bucharest saved me so much time!"
                  </p>
                </div>
              </div>
            </section>

          </section>
        </form>
      )}

      {activeUserTab === "bookings" && <MyBookings />}

      {activeUserTab === "vouchers" && (
        <div className="voucher-tab-container">
          <VoucherStore />
        </div>
      )}
    </div>
  );
}

export default Dashboard;