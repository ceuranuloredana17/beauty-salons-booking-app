import React from "react";
import { useNavigate } from "react-router-dom";
import "./Salons.css";

function Salons({ salons = [], date, time, loading = false, service = "" }) {
  const navigate = useNavigate();


  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Se caută saloane disponibile...</p>
      </div>
    );
  }


  if (!salons.length) {
    return (
      <div className="empty-state">
        <p>Nu s-au găsit saloane care să corespundă criteriilor.</p>
        <p className="empty-suggestion">Încercați să modificați serviciul, locația sau data căutată.</p>
      </div>
    );
  }


  const getDayOfWeek = (dateString) => {
    if (!dateString) return "";
    
    const days = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  const dayOfWeek = getDayOfWeek(date);


  const handleSalonClick = (salonId) => {

    if (!salonId || salonId === 'undefined') {
      console.error('Invalid salon ID:', salonId);
      return;
    }
    
    console.log('Navigating to salon details, ID:', salonId);
    
  
    const serviceParam = service && service !== "Any Service" 
      ? `&service=${encodeURIComponent(service)}` 
      : '';

    navigate(`/salon/${salonId}?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}${serviceParam}`);
  };

  return (
    <div className="salon-list">
      <h3 className="section-title">
        Saloane disponibile ({salons.length})
        {date && time && (
          <span className="search-details">
            pentru {dayOfWeek}, {date} la ora {time}
          </span>
        )}
      </h3>
      
      <div className="salon-grid">
        {salons.map((s) => {
          console.log('Salon services:', s.services);
          return (
            <div 
              key={s._id} 
              className="salon-card card clickable"
              onClick={() => handleSalonClick(s._id)}
            >
              <h4>{s.name}</h4>
              <div className="salon-info">
                <p>
                  <strong>Adresă:</strong> {s.address.street} {s.address.number}, sector{" "}
                  {s.address.sector}
                </p>
                {s.services?.length > 0 && (
                  <p>
                    <strong>Servicii:</strong> {s.services.map(service => {
                      if (typeof service === 'object' && service !== null) {
                        if (service.name) return service.name;
                        if (service.title) return service.title;
                        if (service.serviceName) return service.serviceName;
                        
                        const chars = Object.keys(service)
                          .filter(key => !isNaN(key))
                          .sort((a, b) => a - b)
                          .map(key => service[key])
                          .join('');
                        if (chars) return chars;
                        return JSON.stringify(service);
                      }
                      return service;
                    }).join(', ')}
                  </p>
                )}
                {s.workingHours?.length > 0 && (
                  <div className="working-hours">
                    <strong>Program:</strong>
                    <ul>
                      {s.workingHours.map((wh, i) => (
                        <li key={i} className={wh.dayOfWeek === dayOfWeek ? "current-day" : ""}>
                          {wh.dayOfWeek}: <span>{wh.from} – {wh.to}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="view-details-hint">Click pentru detalii</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Salons;
