import React, { useEffect, useState } from "react";
import "./PendingBusinesses.css";

function PendingBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8080/api/auth/pending-businesses", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error("Eroare la încărcarea datelor");
        }
        
        const data = await res.json();
        setBusinesses(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchPending();
  }, []);

  const approveBusiness = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/auth/approve-business/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error("Eroare la aprobarea contului");
      }
      
      setBusinesses(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Se încarcă...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="pending-businesses">
      <h3 className="section-title">Conturi business în așteptare ({businesses.length})</h3>
      
      {businesses.length === 0 ? (
        <div className="empty-state">
          <p>Nu există conturi în așteptare de aprobare</p>
        </div>
      ) : (
        <div className="business-list">
          {businesses.map(b => (
            <div key={b._id} className="business-card card">
              <div className="business-info">
                <h4>{b.numeSalon || `${b.prenume} ${b.nume}`}</h4>
                <p><strong>Email:</strong> {b.email}</p>
                {b.telefon && <p><strong>Telefon:</strong> {b.telefon}</p>}
                {b.adresa && (
                  <p><strong>Adresa:</strong> {b.adresa.strada} {b.adresa.numar}, {b.adresa.sector}</p>
                )}
              </div>
              <div className="action-buttons">
                <button 
                  className="btn btn-primary approve-btn" 
                  onClick={() => approveBusiness(b._id)}
                >
                  Aprobă
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PendingBusinesses;
