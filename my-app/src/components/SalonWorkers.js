import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './SalonWorkers.css';

function SalonWorkers() {
  const { salonId } = useParams();
  const [workers, setWorkers] = useState([]);
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => {
    const fetchSalonAndWorkers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token")
       
        const salonResponse = await fetch(`http://localhost:8080/api/salons/${salonId}`, {
          headers: {
            "Authorization" : `Bearer ${token}`
          }
        });
        if (!salonResponse.ok) {
          throw new Error('Failed to fetch salon data');
        }
        const salonData = await salonResponse.json();
        setSalon(salonData);
        
       
        const workersResponse = await fetch(`http://localhost:8080/api/workers/salon/${salonId}`, {
          headers: {
            "Authorization" : `Bearer ${token}`
          }
        });
        if (!workersResponse.ok) {
          throw new Error('Failed to fetch workers data');
        }
        const workersData = await workersResponse.json();
        setWorkers(workersData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'An error occurred while fetching data');
        setLoading(false);
      }
    };
    
    fetchSalonAndWorkers();
  }, [salonId]);

  const openWorkerDetails = (worker) => {
    setSelectedWorker(worker);
  };

  const closeWorkerDetails = () => {
    setSelectedWorker(null);
  };

  if (loading) {
    return (
      <div className="salon-workers-container loading">
        <div className="loading-spinner"></div>
        <p>Se încarcă datele...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="salon-workers-container error">
        <h2>Eroare</h2>
        <p>{error}</p>
        <Link to="/salons" className="btn btn-primary">
          Înapoi la lista de saloane
        </Link>
      </div>
    );
  }

  return (
    <div className="salon-workers-container">
      <div className="salon-header">
        <Link to={`/salons/${salonId}`} className="back-link">
          &larr; Înapoi la salon
        </Link>
        <h1>Experții la {salon?.name}</h1>
        <p className="subtitle">Alege expertul potrivit pentru tine</p>
      </div>

      <div className="workers-grid">
        {workers.length > 0 ? (
          workers.map(worker => (
            <div key={worker._id} className="worker-card" onClick={() => openWorkerDetails(worker)}>
              <div className="worker-image">
                {worker.image ? (
                  <img src={worker.image} alt={`${worker.name} ${worker.surname}`} />
                ) : (
                  <div className="worker-image-placeholder">
                    <span>{worker.name.charAt(0)}{worker.surname.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="worker-info">
                <h3 className="worker-name">{worker.name} {worker.surname}</h3>
                <div className="worker-services">
                  {worker.services && worker.services.map((service, index) => (
                    <span key={index} className="service-tag">
                      {typeof service === 'object' && service !== null 
                        ? (typeof service.name === 'string' ? service.name : `Serviciu ${index}`) 
                        : (typeof service === 'string' ? service : `Serviciu ${index}`)}
                    </span>
                  ))}
                </div>
                {worker.experience && (
                  <p className="worker-experience">
                    <span>Experiență: </span>{worker.experience} ani
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="no-workers-message">Nu există experți disponibili pentru acest salon.</p>
        )}
      </div>

      {selectedWorker && (
        <div className="worker-modal">
          <div className="worker-modal-content">
            <button className="close-modal" onClick={closeWorkerDetails}>×</button>
            
            <div className="worker-modal-header">
              <div className="worker-modal-image">
                {selectedWorker.image ? (
                  <img src={selectedWorker.image} alt={`${selectedWorker.name} ${selectedWorker.surname}`} />
                ) : (
                  <div className="worker-image-placeholder large">
                    <span>{selectedWorker.name.charAt(0)}{selectedWorker.surname.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="worker-modal-info">
                <h2>{selectedWorker.name} {selectedWorker.surname}</h2>
                {selectedWorker.experience && (
                  <p className="worker-experience">
                    <span>Experiență: </span>{selectedWorker.experience} ani
                  </p>
                )}
                <p className="worker-contact">
                  <span>Email: </span>{selectedWorker.email}
                </p>
                <p className="worker-contact">
                  <span>Telefon: </span>{selectedWorker.phoneNumber}
                </p>
              </div>
            </div>
            
            {selectedWorker.bio && (
              <div className="worker-bio">
                <h3>Despre mine</h3>
                <p>{selectedWorker.bio}</p>
              </div>
            )}
            
            <div className="worker-services-list">
              <h3>Servicii oferite</h3>
              {selectedWorker.services && selectedWorker.services.length > 0 ? (
                <div className="services-grid">
                  {selectedWorker.services.map((service, index) => (
                    <div key={index} className="service-card">
                      <div className="service-img-container">
                        {typeof service === 'object' && service !== null && service.imageUrl ? (
                          <img 
                            src={service.imageUrl} 
                            alt={typeof service === 'object' && service !== null 
                              ? (typeof service.name === 'string' ? service.name : `Serviciu ${index}`) 
                              : (typeof service === 'string' ? service : `Serviciu ${index}`)} 
                            className="service-img" 
                          />
                        ) : (
                          <div className="service-img-placeholder">
                            <span>Fără imagine</span>
                          </div>
                        )}
                      </div>
                      <div className="service-details">
                        <h4>
                          {typeof service === 'object' && service !== null 
                            ? (typeof service.name === 'string' ? service.name : `Serviciu ${index}`) 
                            : (typeof service === 'string' ? service : `Serviciu ${index}`)}
                        </h4>
                        {typeof service === 'object' && service !== null && typeof service.price !== 'undefined' && 
                          <p className="service-price">{service.price} RON</p>
                        }
                      </div>
                      <Link 
                        to={`/booking/${salonId}/${selectedWorker._id}/${encodeURIComponent(
                          typeof service === 'object' && service !== null 
                            ? (typeof service.name === 'string' ? service.name : `service-${index}`) 
                            : (typeof service === 'string' ? service : `service-${index}`)
                        )}`} 
                        className="book-service-btn"
                      >
                        Programează
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Nu există servicii disponibile</p>
              )}
            </div>
            
            {selectedWorker.availability && selectedWorker.availability.length > 0 && (
              <div className="worker-availability">
                <h3>Program de lucru</h3>
                <div className="availability-list">
                  {selectedWorker.availability.map((day, index) => (
                    <div key={index} className="availability-item">
                      <span className="day-name">{day.dayOfWeek}</span>
                      <span className="day-hours">{day.from} - {day.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeWorkerDetails}>
                Închide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalonWorkers; 