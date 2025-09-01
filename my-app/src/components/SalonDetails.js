import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import SalonWorkers from './SalonWorkers';
import WorkerSelection from './WorkerSelection';
import './SalonDetails.css';

function SalonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  // Get date and time from URL params
  const date = queryParams.get('date') || '';
  const time = queryParams.get('time') || '';
  const service = queryParams.get('service') || '';

  // Debug log parameters
  console.log("SalonDetails - ID from URL:", id);
  console.log("SalonDetails - Date, Time, Service:", { date, time, service });

  useEffect(() => {
    const fetchSalonDetails = async () => {
      try {
        // Validate ID before making the request
        if (!id || id === 'undefined') {
          console.error('Invalid salon ID:', id);
          setError('ID de salon invalid.');
          setLoading(false);
          return;
        }

        setLoading(true);
        console.log(`Fetching salon with ID: ${id}`);

        const token = localStorage.getItem("token")

        const response = await fetch(`http://localhost:8080/api/salons/${id}`, {
          headers: {
            "Authorization" : `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Salon data received:', data);
        setSalon(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching salon details:', err);
        setError('Nu s-au putut încărca detaliile salonului.');
        setLoading(false);
      }
    };

    if (id) {
      fetchSalonDetails();
    } else {
      console.error('No salon ID provided');
      setError('ID de salon lipsă.');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const fetchWorkers = async () => {
      if (!id) return;

      try {
        setLoadingWorkers(true);
        console.log(`Fetching workers for salon ID: ${id}`);

        // Fetch workers from the salon
        const token = localStorage.getItem("token")
        const response = await fetch(`http://localhost:8080/api/workers/salon/${id}`, {
          headers: {
            "Authorization":`Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const allWorkers = await response.json();
        console.log(`Received ${allWorkers.length} workers:`, allWorkers);

        // Filter workers by service if needed
        const normalize = str => str && typeof str === 'string' ? str.normalize('NFD').replace(/[-\u0300-\u036f]/g, '').trim().toLowerCase() : '';
        const filteredWorkers = service
          ? allWorkers.filter(worker => {
            return worker.services.some(workerService => {
              let serviceName = '';
              if (typeof workerService === 'string') {
                serviceName = workerService;
              } else if (typeof workerService === 'object' && workerService !== null) {
                if (workerService.name) {
                  serviceName = workerService.name;
                }
                // Try to extract service name from object with numeric keys
                const numericKeys = Object.keys(workerService)
                  .filter(key => !isNaN(parseInt(key)) && key !== '_id')
                  .sort((a, b) => parseInt(a) - parseInt(b));
                if (numericKeys.length > 0) {
                  serviceName = numericKeys.map(key => workerService[key]).join('');
                }
              }
              return normalize(serviceName) === normalize(service);
            });
          })
          : allWorkers;

        console.log(`Filtered to ${filteredWorkers.length} workers for service: ${service}`);
        setWorkers(filteredWorkers);
        setLoadingWorkers(false);
      } catch (err) {
        console.error('Error fetching workers:', err);
        setLoadingWorkers(false);
      }
    };

    fetchWorkers();
  }, [id, service]);

  // Fetch available time slots when a worker is selected
  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      if (!selectedWorkerId || !date) return;

      try {
        setLoadingSlots(true);
        console.log(`Fetching available slots for worker ID: ${selectedWorkerId}, date: ${date}`);

        // Make sure service is either a non-empty string or undefined
        const serviceParam = service && service.trim() !== '' ? service : 'Consultație';
        console.log(`Using service parameter: ${serviceParam}`);
        const token = localStorage.getItem("token")
        const apiUrl = `http://localhost:8080/api/bookings/available-slots?workerId=${selectedWorkerId}&date=${date}&service=${encodeURIComponent(serviceParam)}`;
        console.log('API URL:', apiUrl);

        const response = await fetch(apiUrl, {
          headers: {
            "Authorization":`Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error (${response.status}):`, errorText);
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Available slots response:', data);

        if (!data.availableSlots || !Array.isArray(data.availableSlots)) {
          console.error('Invalid availableSlots data:', data.availableSlots);
          setAvailableSlots([]);
        } else {
          console.log(`Received ${data.availableSlots.length} available time slots`);
          setAvailableSlots(data.availableSlots);
        }

        setLoadingSlots(false);

        // If time from URL is in available slots, preselect it
        if (time && data.availableSlots && data.availableSlots.includes(time)) {
          setSelectedTimeSlot(time);
        } else {
          setSelectedTimeSlot('');
        }
      } catch (err) {
        console.error('Error fetching available slots:', err);
        setAvailableSlots([]);
        setLoadingSlots(false);
      }
    };

    fetchAvailableTimeSlots();
  }, [selectedWorkerId, date, time, service]);

  // Render worker section with worker cards
  const renderWorkerCards = () => {
    if (loadingWorkers) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Se încarcă experții...</p>
        </div>
      );
    }

    if (workers.length === 0) {
      return (
        <div className="no-workers-message">
          <p>Nu sunt experți disponibili pentru acest salon.</p>
        </div>
      );
    }

    return (
      <div className="workers-grid">
        {workers.map(worker => (
          <div
            key={worker._id}
            className={`worker-card ${selectedWorkerId === worker._id ? 'selected' : ''}`}
            onClick={() => handleSelectWorker(worker)}
          >
            <div className="worker-avatar">
              {worker.image ? (
                <img src={worker.image} alt={`${worker.name} ${worker.surname}`} className="worker-image" />
              ) : (
                <div className="worker-initials">
                  {worker.name.charAt(0)}{worker.surname.charAt(0)}
                </div>
              )}
            </div>

            <div className="worker-info">
              <h3 className="worker-name">{worker.name} {worker.surname}</h3>

              {worker.services && worker.services.length > 0 && (
                <div className="worker-services">
                  <div className="services-preview">
                    {worker.services.slice(0, 2).map((service, index) => {
                      let serviceName = 'Nedefinit';
                      let serviceImageUrl = '';

                      if (typeof service === 'string') {
                        serviceName = service;
                      } else if (service && typeof service === 'object') {
                        if (service.name) {
                          serviceName = service.name;
                        }
                        if (service.imageUrl) {
                          serviceImageUrl = service.imageUrl;
                        }
                      }

                      return (
                        <div key={index} className="service-preview-item">
                          {serviceImageUrl ? (
                            <div className="service-preview-image">
                              <img src={serviceImageUrl} alt={serviceName} />
                            </div>
                          ) : (
                            <div className="service-preview-placeholder">
                              <span>{serviceName.charAt(0)}</span>
                            </div>
                          )}
                          <span className="service-preview-name">{serviceName}</span>
                        </div>
                      );
                    })}
                  </div>

                  {worker.services.length > 2 && (
                    <span className="service-tag more">+{worker.services.length - 2} altele</span>
                  )}
                </div>
              )}

              {worker.experience && (
                <div className="worker-experience">
                  <span>Experiență: </span>{worker.experience} ani
                </div>
              )}
            </div>

            {selectedWorkerId === worker._id && (
              <div className="selected-indicator">
                <span>✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };


  const renderTimeSlots = () => {
    if (!selectedWorkerId) {
      return (
        <div className="time-slots-message">
          <p>Selectați un expert pentru a vedea programul disponibil</p>
        </div>
      );
    }

    if (loadingSlots) {
      return (
        <div className="loading-slots">
          <div className="loading-spinner small"></div>
          <p>Se încarcă programul disponibil...</p>
        </div>
      );
    }

    console.log('Rendering time slots with available slots:', availableSlots);

    if (!availableSlots || availableSlots.length === 0) {
      return (
        <div className="no-slots-message">
          <p>Nu există intervale orare disponibile pentru data selectată.</p>
          <p>Vă rugăm să selectați o altă dată sau un alt expert.</p>
        </div>
      );
    }

    
    if (availableSlots.length === 1 && !availableSlots[0].includes(':')) {
      console.error('Invalid time slot format detected:', availableSlots);
      return (
        <div className="error-slots-message">
          <p>Formatul intervalelor orare este invalid.</p>
          <p>Vă rugăm să contactați administratorul.</p>
          <p className="debug-info">Debug: {JSON.stringify(availableSlots)}</p>
        </div>
      );
    }

   
    const sortedSlots = [...availableSlots].sort((a, b) => {
      const timeA = parseInt(a.split(':')[0]);
      const timeB = parseInt(b.split(':')[0]);
      return timeA - timeB;
    });

 
    const morningSlots = sortedSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour >= 8 && hour < 12;
    });

    const afternoonSlots = sortedSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour >= 12 && hour < 17;
    });

    const eveningSlots = sortedSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      return hour >= 17;
    });


    if (morningSlots.length === 0 && afternoonSlots.length === 0 && eveningSlots.length === 0) {
      console.warn('No slots matched our time categories, showing all slots');
      return (
        <div className="time-slots-container">
          <h3>Intervale orare disponibile</h3>
          <div className="time-slots-grid">
            {sortedSlots.map(slot => (
              <button
                key={slot}
                className={`time-slot-btn ${selectedTimeSlot === slot ? 'selected' : ''}`}
                onClick={() => setSelectedTimeSlot(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      );
    }


    return (
      <div className="time-slots-container">
        <h3>Intervale orare disponibile</h3>

        {morningSlots.length > 0 && (
          <div className="time-slots-section">
            <h4 className="time-period">Dimineață</h4>
            <div className="time-slots-grid">
              {morningSlots.map(slot => (
                <button
                  key={slot}
                  className={`time-slot-btn ${selectedTimeSlot === slot ? 'selected' : ''}`}
                  onClick={() => setSelectedTimeSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {afternoonSlots.length > 0 && (
          <div className="time-slots-section">
            <h4 className="time-period">După-amiază</h4>
            <div className="time-slots-grid">
              {afternoonSlots.map(slot => (
                <button
                  key={slot}
                  className={`time-slot-btn ${selectedTimeSlot === slot ? 'selected' : ''}`}
                  onClick={() => setSelectedTimeSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {eveningSlots.length > 0 && (
          <div className="time-slots-section">
            <h4 className="time-period">Seară</h4>
            <div className="time-slots-grid">
              {eveningSlots.map(slot => (
                <button
                  key={slot}
                  className={`time-slot-btn ${selectedTimeSlot === slot ? 'selected' : ''}`}
                  onClick={() => setSelectedTimeSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSelectWorker = (worker) => {
    setSelectedWorkerId(worker._id);
    setSelectedWorker(worker);
    setSelectedTimeSlot('');
  };

  const handleBookAppointment = () => {
    if (!selectedWorkerId || !selectedWorker) {
      alert('Vă rugăm să selectați un angajat pentru programare.');
      return;
    }

    if (!selectedTimeSlot) {
      alert('Vă rugăm să selectați o oră pentru programare.');
      return;
    }


    const bookingDate = date || new Date().toISOString().split('T')[0];


    navigate('/booking/confirm', {
      state: {
        salon: {
          id: salon._id,
          name: salon.name
        },
        worker: {
          id: selectedWorkerId,
          name: selectedWorker.name,
          surname: selectedWorker.surname
        },
        service: service || 'Consultație',
        date: bookingDate,
        timeSlot: selectedTimeSlot
      }
    });
  };

  const getDayOfWeek = (dateString) => {
    if (!dateString) return "";

    const days = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  const dayOfWeek = getDayOfWeek(date);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Se încarcă detaliile salonului...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          Înapoi
        </button>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="error-container">
        <p className="error-message">Salonul nu a fost găsit.</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          Înapoi
        </button>
      </div>
    );
  }

  return (
    <div className="salon-details-container page-transition">
      <header className="salon-details-header">
        <button className="btn btn-text back-button" onClick={() => navigate(-1)}>
          &larr; Înapoi la rezultate
        </button>
        <h1>{salon.name}</h1>
        {date && (
          <div className="appointment-details">
            Programare pentru {service ? service : 'consultație'}, {dayOfWeek}, {date}
          </div>
        )}
      </header>

      <div className="salon-details-body">
        <div className="salon-info-card card">
          <h2>Detalii salon</h2>

          <div className="salon-info-section">
            <h3>Adresă</h3>
            <p>{salon.address.street} {salon.address.number}, Sector {salon.address.sector}</p>
          </div>

          <div className="salon-info-section">
            <h3>Servicii</h3>
            <ul className="services-list">
              {salon.services?.map((service, index) => {
                
                let serviceName = 'Serviciu Nedefinit';

                if (typeof service === 'string') {
                  serviceName = service;
                } else if (service && typeof service === 'object') {
    
                  if (typeof service.name === 'string') {
                    serviceName = service.name;
                  }


                  if (Object.keys(service).some(key => !isNaN(parseInt(key)))) {
                
                    const values = Object.keys(service)
                      .filter(key => !isNaN(parseInt(key)))
                      .map(key => service[key])
                      .filter(val => typeof val === 'string');

                    if (values.length > 0) {
                      serviceName = values.join('');
                    }
                  }
                }

                return (
                  <li key={index} className="service-item">{serviceName}</li>
                );
              })}

            </ul>
          </div>

          <div className="salon-info-section">
            <h3>Program</h3>
            <ul className="hours-list">
              {salon.workingHours?.map((wh, i) => {
       
                let dayOfWeek = 'Zi nedefinită';
                let timeFrom = '00:00';
                let timeTo = '00:00';

                if (wh && typeof wh === 'object') {
                  if (typeof wh.dayOfWeek === 'string') {
                    dayOfWeek = wh.dayOfWeek;
                  }
                  if (typeof wh.from === 'string') {
                    timeFrom = wh.from;
                  }
                  if (typeof wh.to === 'string') {
                    timeTo = wh.to;
                  }
                }

               
                const isCurrentDay = dayOfWeek === getDayOfWeek(date);

                return (
                  <li key={i} className={isCurrentDay ? "current-day" : ""}>
                    {dayOfWeek}: <span>{timeFrom} – {timeTo}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {salon.description && (
            <div className="salon-info-section">
              <h3>Descriere</h3>
              <p>{salon.description}</p>
            </div>
          )}
        </div>

        <div className="booking-section">
          <div className="salon-workers-section card">
            <h2>Alegeți un expert</h2>
            {renderWorkerCards()}
          </div>

          {selectedWorkerId && (
            <div className="time-slots-section card">
              {renderTimeSlots()}
            </div>
          )}
        </div>
      </div>

      <div className="booking-actions">
        <button
          className="btn btn-primary book-button"
          disabled={!selectedWorkerId || !selectedTimeSlot}
          onClick={handleBookAppointment}
        >
          Confirmă programarea
        </button>
      </div>
    </div>
  );
}

export default SalonDetails; 