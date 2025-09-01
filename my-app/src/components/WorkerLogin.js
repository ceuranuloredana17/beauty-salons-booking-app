import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./WorkerLogin.css";

function WorkerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
  
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Te rugăm să completezi toate câmpurile");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("http://localhost:8080/api/worker-auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Autentificare eșuată");
      }
      

      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", "worker");
      
   
      navigate("/worker-dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "A apărut o eroare la autentificare");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="worker-login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Autentificare angajat</h2>
          <p>Conectează-te pentru a-ți gestiona programările</p>
        </div>
        
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Parolă</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? "Se procesează..." : "Autentificare"}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            <Link to="/login" className="alternate-login">
              Autentificare client
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default WorkerLogin; 