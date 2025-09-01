import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadWithFallback } from '../firebase';
import './WorkerDashboard.css';

function WorkerDashboard() {
  const [worker, setWorker] = useState(null);
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);
  
  // New states for services management
  const [newService, setNewService] = useState({ name: '', price: '', image: null });
  const [serviceImage, setServiceImage] = useState(null);
  const [serviceImagePreview, setServiceImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [serviceError, setServiceError] = useState(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token")
  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        setLoading(true);
      
        if (!token) {
          navigate('/worker-login');
          return;
        }
        
    
        const workerResponse = await fetch('http://localhost:8080/api/worker-auth/me', {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!workerResponse.ok) {
          throw new Error('Failed to fetch worker profile');
        }
        
        const workerData = await workerResponse.json();
        console.log('WorkerUser data:', workerData);
        setWorker(workerData);
        
 
        try {
          const workerModelResponse = await fetch(`http://localhost:8080/api/workers/email/${workerData.email}`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (workerModelResponse.ok) {
            const workerModelData = await workerModelResponse.json();
            console.log('Worker model data:', workerModelData);
            
           
            setWorker(prev => ({
              ...prev,
              workerId: workerModelData._id
            }));
          }
        } catch (workerModelError) {
          console.error('Error fetching Worker model:', workerModelError);
        }
      
        const salonResponse = await fetch(`http://localhost:8080/api/salons/${workerData.salonId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!salonResponse.ok) {
          throw new Error('Failed to fetch salon details');
        }
        
        const salonData = await salonResponse.json();
        setSalon(salonData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching worker data:', error);
        setError(error.message || 'An error occurred');
        setLoading(false);
      }
    };
    
    fetchWorkerData();
  }, [navigate]);
  

  useEffect(() => {
    const fetchBookings = async () => {
      if (!worker) return;
      
      try {
        setBookingsLoading(true);
        setBookingsError(null);
        
        if (!token) return;
        
        console.log('Fetching bookings for worker:', worker);
        
  
        const workerId = worker.workerId || worker._id;
        console.log('Using worker ID:', workerId);
        
        const response = await fetch(`http://localhost:8080/api/bookings/worker/${workerId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        console.log('Bookings API response status:', response.status);
        
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        
        const bookingsData = await response.json();
        console.log('Bookings data received:', bookingsData);
        setBookings(bookingsData);
        setBookingsLoading(false);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookingsError(error.message || 'An error occurred while fetching bookings');
        setBookingsLoading(false);
      }
    };
    
    fetchBookings();
  }, [worker]);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/worker-login');
  };
  
 
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ro-RO', options);
  };
  
  
  const groupBookingsByDate = () => {
    const grouped = {};
    
    bookings.forEach(booking => {
      const date = new Date(booking.date).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(booking);
    });
    
   
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        return a.timeSlot.localeCompare(b.timeSlot);
      });
    });
    
    return grouped;
  };
  

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setServiceImage(e.target.files[0]);
      setServiceImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };
  
  
  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService(prev => ({ ...prev, [name]: value }));
  };
  

  const uploadServiceImage = async (file, serviceName, workerId) => {
    if (!file) return null;
    
    try {
      console.log('Starting image upload with params:', { serviceName, workerId });
      
      
      const path = `services/${workerId}/${serviceName}.${file.name.split('.').pop()}`;
      console.log('Attempting upload with path:', path);
      
      const downloadUrl = await uploadWithFallback(file, path);
      console.log('Upload successful:', downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
     
      return null;
    }
  };
  
  
  const handleAddService = async (e) => {
    e.preventDefault();
    
    if (!newService.name || !newService.price) {
      setServiceError('Please provide both service name and price');
      return;
    }
    
    try {
      setUploading(true);
      setServiceError(null);
      
      if (!token) return;
      
    
      let imageUrl = null;
      if (serviceImage) {
        try {
          const workerId = worker._id;
          imageUrl = await uploadServiceImage(serviceImage, newService.name, workerId);
        } catch (uploadError) {
          console.error('Image upload failed, continuing without image:', uploadError);

        }
      }
      

      const serviceData = {
        name: newService.name,
        price: parseFloat(newService.price),
        imageUrl: imageUrl || '' 
      };
      
      console.log('Adding service to worker with data:', {
        workerId: worker._id,
        serviceData
      });
      

      const updateResponse = await fetch('http://localhost:8080/api/worker-auth/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          services: [...(worker.services || []), serviceData]
        })
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add service');
      }
      

      const updatedWorker = await updateResponse.json();
      setWorker(updatedWorker);
      

      setNewService({ name: '', price: '', image: null });
      setServiceImage(null);
      setServiceImagePreview(null);
      setUploading(false);
    } catch (error) {
      console.error('Error adding service:', error);
      setServiceError(error.message || 'Failed to add service');
      setUploading(false);
    }
  };
  

  const handleDeleteService = async (serviceName) => {
    if (!window.confirm(`Are you sure you want to delete ${serviceName}?`)) {
      return;
    }
    
    try {
      if (!token) return;
      

      const updatedServices = worker.services.filter(service => {
        if (typeof service === 'string') {
          return service !== serviceName;
        } else if (service && typeof service === 'object') {
          return service.name !== serviceName;
        }
        return true;
      });
      

      const updateResponse = await fetch('http://localhost:8080/api/worker-auth/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          services: updatedServices
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to delete service');
      }
      

      const updatedWorker = await updateResponse.json();
      setWorker(updatedWorker);
    } catch (error) {
      console.error('Error deleting service:', error);
      setServiceError(error.message || 'Failed to delete service');
    }
  };
  
  if (loading) {
    return (
      <div className="worker-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Se încarcă datele...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="worker-dashboard error">
        <h2>Eroare</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/worker-login')}>
          Înapoi la autentificare
        </button>
      </div>
    );
  }
  
  return (
    <div className="worker-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Panou de control angajat</h1>
          {worker && salon && (
            <p className="salon-info">
              {worker.name} {worker.surname} | {salon.name}
            </p>
          )}
        </div>
        <button className="btn btn-primary logout-btn" onClick={handleLogout}>
          Delogare
        </button>
      </header>
      
      <nav className="dashboard-nav">
        <ul className="dashboard-tabs">
          <li 
            className={`dashboard-tab ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            Programări
          </li>
          <li 
            className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profil
          </li>
          <li 
            className={`dashboard-tab ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            Servicii
          </li>
          <li 
            className={`dashboard-tab ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            Disponibilitate
          </li>
        </ul>
      </nav>
      
      <main className="dashboard-main">
        {activeTab === 'schedule' && (
          <div className="schedule-container card">
            <h2>Programările mele</h2>
            
            {bookingsLoading ? (
              <div className="bookings-loading">
                <div className="loading-spinner"></div>
                <p>Se încarcă programările...</p>
              </div>
            ) : bookingsError ? (
              <div className="error-message">
                <p>{bookingsError}</p>
              </div>
            ) : bookings.length === 0 ? (
              <p className="no-bookings-message">
                Nu aveți programări înregistrate momentan.
              </p>
            ) : (
              <div className="bookings-list">
                {Object.entries(groupBookingsByDate()).map(([date, dayBookings]) => (
                  <div key={date} className="bookings-date-group">
                    <h3 className="booking-date-header">
                      {formatDate(date)}
                    </h3>
                    <div className="day-bookings">
                      {dayBookings.map(booking => (
                        <div key={booking._id} className="booking-card">
                          <div className="booking-time">{booking.timeSlot}</div>
                          <div className="booking-details">
                            <div className="booking-service">
                              {typeof booking.service === 'object' 
                                ? booking.service.name 
                                : booking.service}
                            </div>
                            <div className="booking-client">
                              <strong>Client:</strong> {booking.clientName}
                            </div>
                            <div className="client-contacts">
                              <div className="client-phone">
                                <span>Tel:</span> {booking.clientPhone}
                              </div>
                              <div className="client-email">
                                <span>Email:</span> {booking.clientEmail}
                              </div>
                            </div>
                          </div>
                          <div className={`booking-status ${booking.status}`}>
                            {booking.status === 'confirmed' ? 'Confirmată' : 
                             booking.status === 'cancelled' ? 'Anulată' : 
                             booking.status === 'completed' ? 'Finalizată' : 
                             'În așteptare'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'profile' && worker && (
          <div className="profile-container card">
            <h2>Profil personal</h2>
            <div className="profile-details">
              <div className="profile-info">
                <h3>Informații personale</h3>
                <div className="info-group">
                  <label>Nume complet:</label>
                  <p>{worker.name} {worker.surname}</p>
                </div>
                <div className="info-group">
                  <label>Email:</label>
                  <p>{worker.email}</p>
                </div>
                <div className="info-group">
                  <label>Telefon:</label>
                  <p>{worker.phoneNumber}</p>
                </div>
                <div className="info-group">
                  <label>Experiență:</label>
                  <p>{worker.experience} ani</p>
                </div>
              </div>
              
              <div className="profile-services">
                <h3>Servicii oferite</h3>
                {worker.services && worker.services.length > 0 ? (
                  <div className="services-list">
                    {worker.services.map((service, index) => {
                     
                      let serviceName = 'Serviciu Nedefinit';
                      
                      if (typeof service === 'string') {
                        serviceName = service;
                      } else if (service && typeof service === 'object') {
                  
                        if (typeof service.name === 'string') {
                          serviceName = service.name;
                        } 
                        
                        else if (Object.keys(service).some(key => !isNaN(parseInt(key)))) {
                         
                          const values = Object.keys(service)
                            .filter(key => !isNaN(parseInt(key)))
                            .map(key => service[key]);
                          
                          if (values.length > 0 && typeof values[0] === 'string') {
                            serviceName = values.join('');
                          }
                        }
                       
                        else if (service.price || service.imageUrl) {
                        
                          if (service._id && typeof service._id === 'string') {
                      
                            if (service._id.includes('vopsit')) {
                              serviceName = 'Vopsit';
                            } else if (service._id.includes('tuns')) {
                              serviceName = 'Tuns';
                            } else if (service._id.includes('coafat')) {
                              serviceName = 'Coafat';
                            } else if (service._id.includes('manichiura')) {
                              serviceName = 'Manichiura';
                            } else if (service._id.includes('pedichiura')) {
                              serviceName = 'Pedichiura';
                            } else {
                              serviceName = `Serviciu ${index + 1}`;
                            }
                          } else {
                            serviceName = `Serviciu ${index + 1}`;
                          }
                        }
                      }
                      
                      return (
                        <span key={index} className="service-tag">
                          {serviceName}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p>Nu există servicii configurate</p>
                )}
              </div>
              
              {worker.bio && (
                <div className="profile-bio">
                  <h3>Descriere</h3>
                  <p>{worker.bio}</p>
                </div>
              )}
            </div>
            
            <button className="btn btn-primary edit-profile-btn">
              Editare profil
            </button>
          </div>
        )}
        
        {activeTab === 'services' && worker && (
          <div className="services-container card">
            <h2>Gestionare servicii</h2>
            
            <div className="services-grid">
              {worker.services && worker.services.length > 0 ? (
                worker.services.map((service, index) => {
                  
                  let serviceName = 'Serviciu Nedefinit';
                  let servicePrice = null;
                  let serviceImageUrl = '';
                  let serviceId = `service-${index}`;
                  
                  if (typeof service === 'string') {
                    serviceName = service;
                  } else if (service && typeof service === 'object') {
                   
                    if (typeof service.name === 'string') {
                      serviceName = service.name;
                    } 
                 
                    else if (Object.keys(service).some(key => !isNaN(parseInt(key)))) {
                    
                      const values = Object.keys(service)
                        .filter(key => !isNaN(parseInt(key)))
                        .map(key => service[key]);
                      
                      if (values.length > 0 && typeof values[0] === 'string') {
                        serviceName = values.join('');
                      }
                    }
                    
                    else if (service.price || service.imageUrl) {
                      
                      if (service._id && typeof service._id === 'string') {
                        
                        if (service._id.includes('vopsit')) {
                          serviceName = 'Vopsit';
                        } else if (service._id.includes('tuns')) {
                          serviceName = 'Tuns';
                        } else if (service._id.includes('coafat')) {
                          serviceName = 'Coafat';
                        } else if (service._id.includes('manichiura')) {
                          serviceName = 'Manichiura';
                        } else if (service._id.includes('pedichiura')) {
                          serviceName = 'Pedichiura';
                        } else {
                          serviceName = `Serviciu ${index + 1}`;
                        }
                      } else {
                        serviceName = `Serviciu ${index + 1}`;
                      }
                    }
                    
                  
                    if (service.price && (typeof service.price === 'number' || typeof service.price === 'string')) {
                      servicePrice = service.price;
                    }
                    
                 
                    if (service.imageUrl && typeof service.imageUrl === 'string') {
                      serviceImageUrl = service.imageUrl;
                    }
                    
                  
                    if (service._id) {
                      serviceId = service._id;
                    }
                  }
                  
                  return (
                    <div key={index} className="service-card">
                      <div className="service-img-container">
                        {serviceImageUrl ? (
                          <img 
                            src={serviceImageUrl} 
                            alt={serviceName} 
                            className="service-img" 
                          />
                        ) : (
                          <div className="service-img-placeholder">
                            <span>Fără imagine</span>
                          </div>
                        )}
                      </div>
                      <div className="service-details">
                        <h3>{serviceName}</h3>
                        {servicePrice && <p className="service-price">{servicePrice} RON</p>}
                      </div>
                      <button 
                        className="btn btn-danger delete-service-btn" 
                        onClick={() => handleDeleteService(serviceName)}
                      >
                        Șterge
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="no-services-message">Nu aveți servicii configurate</p>
              )}
            </div>
            
            <div className="add-service-form">
              <h3>Adaugă serviciu nou</h3>
              {serviceError && <div className="error-message">{serviceError}</div>}
              
              <form onSubmit={handleAddService}>
                <div className="form-group">
                  <label htmlFor="serviceName">Nume serviciu</label>
                  <input 
                    type="text" 
                    id="serviceName" 
                    name="name" 
                    value={newService.name} 
                    onChange={handleServiceChange} 
                    required 
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="servicePrice">Preț (RON)</label>
                  <input 
                    type="number" 
                    id="servicePrice" 
                    name="price" 
                    value={newService.price} 
                    onChange={handleServiceChange} 
                    required 
                    className="form-control"
                    min="0" 
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="serviceImage">Imagine (opțional)</label>
                  <input 
                    type="file" 
                    id="serviceImage" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="form-control"
                  />
                  
                  {serviceImagePreview && (
                    <div className="image-preview">
                      <img src={serviceImagePreview} alt="Service preview" />
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary add-service-btn" 
                  disabled={uploading}
                >
                  {uploading ? 'Se încarcă...' : 'Adaugă serviciu'}
                </button>
              </form>
            </div>
          </div>
        )}
        
        {activeTab === 'availability' && worker && (
          <div className="availability-container card">
            <h2>Program de lucru</h2>
            {worker.availability && worker.availability.length > 0 ? (
              <div className="availability-list">
                <div className="availability-header">
                  <span>Zi</span>
                  <span>De la</span>
                  <span>Până la</span>
                </div>
                {worker.availability.map((day, index) => (
                  <div key={index} className="availability-item">
                    <span className="day-name">{day.dayOfWeek}</span>
                    <span>{day.from}</span>
                    <span>{day.to}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>Nu există program configurat</p>
            )}
            
            <button className="btn btn-primary edit-availability-btn">
              Editare program
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default WorkerDashboard; 