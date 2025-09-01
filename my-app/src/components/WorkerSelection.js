import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './WorkerSelection.css';

function WorkerSelection({ salonId, service, date, workers }) {
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [salon, setSalon] = useState(null);
  
  const navigate = useNavigate();

 
  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`http://localhost:8080/api/salons/${salonId}`, {
          headers: {
            "Authorization":`Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch salon details');
        }
        
        const data = await response.json();
        setSalon(data);
      } catch (error) {
        console.error('Error fetching salon:', error);
        setError('Nu am putut încărca detaliile salonului');
      }
    };

    if (salonId) {
      fetchSalon();
    }
  }, [salonId]);

 
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedWorker) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const formattedDate = date instanceof Date 
          ? date.toISOString().split('T')[0]
          : date;
        const token = localStorage.getItem("token")
        const response = await fetch(
          `http://localhost:8080/api/bookings/available-slots?workerId=${selectedWorker._id}&date=${formattedDate}&service=${service}`, {
            headers: {
              "Authorization":`Bearer ${token}`
            }
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch available slots');
        }
        
        const data = await response.json();
        setAvailableSlots(data.availableSlots);
      } catch (error) {
        console.error('Error fetching available slots:', error);
        setError(error.message || 'Nu am putut încărca intervalele disponibile');
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedWorker, date, service]);

  const handleWorkerSelect = (worker) => {
    setSelectedWorker(worker);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleProceedToBooking = () => {
    if (!selectedWorker || !selectedTimeSlot) {
      return;
    }

    navigate('/booking/confirm', {
      state: {
        salon: {
          id: salonId,
          name: salon?.name || ''
        },
        worker: {
          id: selectedWorker._id,
          name: selectedWorker.name,
          surname: selectedWorker.surname
        },
        service,
        date,
        timeSlot: selectedTimeSlot
      }
    });
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('ro-RO', options);
  };

  return (
    <div className="worker-selection">
      <h2>Alege un specialist și o oră disponibilă</h2>
      
      <div className="booking-info">
        <div className="info-item">
          <span className="info-label">Salon:</span>
          <span className="info-value">{salon?.name}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Serviciu:</span>
          <span className="info-value">{service}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Data:</span>
          <span className="info-value">{formatDate(date)}</span>
        </div>
      </div>
      
      <div className="workers-container">
        <h3>Specialiști disponibili</h3>
        
        <div className="workers-list">
          {workers.map(worker => (
            <div 
              key={worker._id} 
              className={`worker-card ${selectedWorker?._id === worker._id ? 'selected' : ''}`}
              onClick={() => handleWorkerSelect(worker)}
            >
              <div className="worker-avatar">
                {worker.image ? (
                  <img src={worker.image} alt={`${worker.name} ${worker.surname}`} />
                ) : (
                  <div className="avatar-placeholder">
                    {worker.name[0]}{worker.surname[0]}
                  </div>
                )}
              </div>
              
              <div className="worker-info">
                <h4>{worker.name} {worker.surname}</h4>
                {worker.experience > 0 && (
                  <p className="worker-experience">
                    {worker.experience} {worker.experience === 1 ? 'an' : 'ani'} experiență
                  </p>
                )}
                <p className="worker-services">
                  {worker.services.map((workerService, index) => {
                   
                    let serviceName = 'Serviciu Nedefinit';
                    
                    if (typeof workerService === 'string') {
                      serviceName = workerService;
                    } else if (workerService && typeof workerService === 'object') {
                     
                      if (typeof workerService.name === 'string') {
                        serviceName = workerService.name;
                      }
                      
                      
                      if (Object.keys(workerService).some(key => !isNaN(parseInt(key)))) {
                     
                        const values = Object.keys(workerService)
                          .filter(key => !isNaN(parseInt(key)))
                          .map(key => workerService[key])
                          .filter(val => typeof val === 'string');
                        
                        if (values.length > 0) {
                          serviceName = values.join('');
                        }
                      }
                    }
                    
                   
                    const isHighlighted = serviceName === service;
                    
                    return (
                      <span 
                        key={index} 
                        className={`service-tag ${isHighlighted ? 'highlighted' : ''}`}
                      >
                        {serviceName}
                      </span>
                    );
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedWorker && (
        <div className="time-slots-container">
          <h3>Ore disponibile</h3>
          
          {loading ? (
            <div className="loading-indicator">Se încarcă orele disponibile...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : availableSlots.length === 0 ? (
            <div className="no-slots-message">
              Nu există intervale disponibile pentru acest specialist în data selectată.
            </div>
          ) : (
            <div className="time-slots-list">
              {availableSlots.map(timeSlot => (
                <button
                  key={timeSlot}
                  className={`time-slot-btn ${selectedTimeSlot === timeSlot ? 'selected' : ''}`}
                  onClick={() => handleTimeSlotSelect(timeSlot)}
                >
                  {timeSlot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="booking-actions">
        <button 
          className="btn btn-primary proceed-btn"
          disabled={!selectedWorker || !selectedTimeSlot}
          onClick={handleProceedToBooking}
        >
          Continuă cu rezervarea
        </button>
      </div>
    </div>
  );
}

export default WorkerSelection; 