import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import RegisterModal from "./RegisterModal";
import BusinessRegisterModal from "./BusinessRegisterModal";
import bgImage from "../images/loginbackground.jpg";



 

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showBizModal, setShowBizModal] = useState(false);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");


  if (username.trim().length < 3) {
    setError("Username-ul trebuie să aibă cel puțin 4 caractere");
    return;
  }

  if (password.length < 3) {
    setError("Parola trebuie să aibă cel puțin 6 caractere");
    return;
  }

  try {
    const res = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Eroare la autentificare");
      return;
    }

    if (data.user) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
      return;
    }

    if (data.business) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("business", JSON.stringify(data.business));

      if (data.business.role === "owner") {
        navigate("/owner-dashboard");
      } else if (data.business.role === "expert") {
        navigate("/expert-dashboard");
      }

      return;
    }

    setError("Răspuns neașteptat de la server");
  } catch (err) {
    console.error(err);
    setError("Eroare de rețea");
  }
};


  const navigateToWorkerLogin = () => {
    navigate("/worker-login");
  };

  return (
    <div
    className="login-container page-transition"
    style={{
      backgroundImage: `url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}
  >
  
      <form onSubmit={handleSubmit} className="login-form card">
      <div className="logo-bookly"></div>
        <h2>LOGIN</h2>
        <div className="form-control">
          <label className="form-label">
          
            <input
              type="text"
              
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="Username"
              className="form-input"
            />
          </label>
        </div>
        <div className="form-control">
          <label className="form-label">
            
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="form-input"
            />
          </label>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="btn btn-primary">Intră în cont</button>
        <p className="forgot-password">Ai uitat parola?</p>

      </form>

      <p className="no-account">
        Nu ai cont?{" "}
        <button
          className="btn btn-text create-account-btn"
          onClick={() => setShowRegisterModal(true)}
        >
          Creează cont
        </button>
      </p>

      <div className="link-row">
        <button
          className="btn btn-text link-btn"
          onClick={() => setShowBizModal(true)}
        >
          Înregistrează-ţi salonul
        </button>
        
        <button
          className="btn btn-text link-btn"
          onClick={navigateToWorkerLogin}
        >
          Autentificare angajat
        </button>
      </div>

      {showRegisterModal && (
        <RegisterModal closeModal={() => setShowRegisterModal(false)} />
      )}
      {showBizModal && (
        <BusinessRegisterModal close={() => setShowBizModal(false)} />
      )}
    </div>
  );
}

export default Login;
