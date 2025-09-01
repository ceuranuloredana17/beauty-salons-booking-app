import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerDashboard.css";
import WorkerInvite from "./WorkerInvite";
import { uploadWithFallback } from "../firebase";

function OwnerDashboard() {
  const navigate = useNavigate();
  const workerInviteRef = useRef();
  const [business, setBusiness] = useState(null);
  const [about, setAbout] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showSalonForm, setShowSalonForm] = useState(false);
  const [salon, setSalon] = useState(null);
  const [salonData, setSalonData] = useState({
    name: "",
    description: "",
    street: "",
    number: "",
    sector: "",
    lat: "",
    lng: "",
    services: [],      
    workingHours: [] 
  });
  

  const [showServiceManager, setShowServiceManager] = useState(false);
  const [currentService, setCurrentService] = useState({ name: "", imageUrl: "" });
  const [serviceImage, setServiceImage] = useState(null);
  const [serviceImagePreview, setServiceImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [serviceError, setServiceError] = useState(null);


  const availableServices = [
    "Tuns", 
    "Vopsit", 
    "Coafat", 
    "Manichiura", 
    "Pedichiura", 
    "Tratament facial",
    "Masaj",
    "Gene",
    "Sprâncene"
  ];
  
  const weekdays = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];
  
  const [showWorkers, setShowWorkers] = useState(false);
  const [workers, setWorkers] = useState([]);
  
  const fetchWorkers = async () => {
    if (!salon || !salon._id) return;
  
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/workers/salon/${salon._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
  
      if (res.ok) {
        setWorkers(data);
        setShowWorkers(true);
      } else {
        alert(data.message || "Eroare la preluarea experților");
      }
    } catch (err) {
      console.error("Eroare la fetch workers:", err);
      alert("Eroare server");
    }
  };
  

  const fetchSalon = async (ownerId) => {
    try {
      const token = localStorage.getItem("token");
  
      const res = await fetch(`http://localhost:8080/api/salons/owner/${ownerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
  
      const data = await res.json();
      if (res.ok) {
        setSalon(data);
        setSalonData({
          name: data.name || "",
          description: data.description || "",
          street: data.address?.street || "",
          number: data.address?.number || "",
          sector: data.address?.sector || "",
          lat: data.location?.lat?.toString() || "",
          lng: data.location?.lng?.toString() || "",
          services: data.services || [],
          workingHours: data.workingHours && data.workingHours.length > 0 
            ? data.workingHours 
            : [{ dayOfWeek: "Luni", from: "09:00", to: "18:00" }]
        });
      } else {
        console.warn("Salonul nu a fost găsit.");
      }
    } catch (err) {
      console.error("Eroare la fetch salon:", err);
    }
  };
  
  

  useEffect(() => {
    const stored = localStorage.getItem("business");
    if (stored) {
      const parsed = JSON.parse(stored);
      setBusiness(parsed);
      setAbout(parsed.about || "");
      fetchSalon(parsed.username);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("business");
    navigate("/login");
  };

  const handleSaveAbout = () => {
    if (business) {
      const updatedBusiness = { ...business, about };
      setBusiness(updatedBusiness);
      localStorage.setItem("business", JSON.stringify(updatedBusiness));
      setIsEditing(false);
    }
  };

  const handleSalonInputChange = (e) => {
    setSalonData({ ...salonData, [e.target.name]: e.target.value });
  };

  const handleSalonSubmit = async (e) => {
    e.preventDefault();

    const ownerId = business?.username;
    const body = {
      name: salonData.name,
      description: salonData.description,
      address: {
        street: salonData.street,
        number: salonData.number,
        sector: salonData.sector
      },
      location: {
        lat: parseFloat(salonData.lat),
        lng: parseFloat(salonData.lng)
      },
      ownerId: ownerId,
      services: salonData.services,
      workingHours: salonData.workingHours
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/salons", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Salonul a fost salvat cu succes!");
        setShowSalonForm(false);
        fetchSalon(ownerId);

        if (workerInviteRef.current) {
          workerInviteRef.current.refreshServices();
        }
      } else {
        alert(data.message || "Eroare la salvare");
      }
    } catch (err) {
      console.error("Eroare la salvare salon:", err);
      alert("Eroare la conectare cu serverul");
    }
  };

  const addWorkingHour = () => {
    setSalonData(prev => ({
      ...prev,
      workingHours: [
        ...prev.workingHours,
        { dayOfWeek: "Luni", from: "09:00", to: "18:00" }
      ]
    }));
  };

  const removeWorkingHour = (idx) => {
    setSalonData(prev => ({
      ...prev,
      workingHours: prev.workingHours.filter((_, i) => i !== idx)
    }));
  };

  const updateWorkingHour = (idx, field, value) => {
    setSalonData(prev => {
      const updatedHours = [...prev.workingHours];
      updatedHours[idx] = {
        ...updatedHours[idx],
        [field]: value
      };
      return {
        ...prev,
        workingHours: updatedHours
      };
    });
  };
  

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setServiceImage(e.target.files[0]);
      setServiceImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };
  
  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setCurrentService(prev => ({ ...prev, [name]: value }));
  };
  

  const uploadServiceImage = async (file, serviceName) => {
    if (!file) return null;
    
    try {
      console.log('Starting service image upload:', { serviceName, fileSize: file.size });
      

      const path = `services/salon/${salon._id}/${serviceName}.${file.name.split('.').pop()}`;
      console.log('Upload path:', path);
      
      const downloadUrl = await uploadWithFallback(file, path);
      console.log('Upload successful:', downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
  
      return null;
    }
  };
  

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentService.name) {
      setServiceError('Vă rugăm să introduceți un nume pentru serviciu');
      return;
    }
    
    try {
      setUploading(true);
      setServiceError(null);
      

      let imageUrl = currentService.imageUrl;
      let uploadError = null;
      
      if (serviceImage) {
        try {
          const uploadResult = await uploadServiceImage(serviceImage, currentService.name);
          
          if (uploadResult) {
            imageUrl = uploadResult;
          } else {
            uploadError = 'Imaginea nu a putut fi încărcată, dar serviciul va fi creat fără imagine.';
          }
        } catch (uploadErr) {
          console.error('Image upload failed, continuing without image:', uploadErr);
          uploadError = 'Imaginea nu a putut fi încărcată, dar serviciul va fi creat fără imagine.';
        }
      }
      
  
      const serviceData = {
        name: currentService.name,
        imageUrl: imageUrl || '' 
      };
      
      console.log('Submitting service data:', serviceData);
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/salons/${salon._id}/services`, {
        method: 'POST',
        headers: {
          'Authorization':`Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serviceData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Adăugarea serviciului a eșuat');
      }
      
 
      const updatedSalon = await response.json();
      setSalon(updatedSalon);
      
     
      setCurrentService({ name: '', imageUrl: '' });
      setServiceImage(null);
      setServiceImagePreview(null);
      setShowServiceManager(false);
      setUploading(false);
      

      if (workerInviteRef.current) {
        console.log('Refreshing services in WorkerInvite...');
        workerInviteRef.current.refreshServices();
      }
      
    
      if (uploadError) {
        alert(`Serviciul a fost adăugat cu succes, dar ${uploadError.toLowerCase()}`);
      } else {
        alert('Serviciul a fost adăugat cu succes!');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      setServiceError(error.message || 'Adăugarea serviciului a eșuat');
      setUploading(false);
    }
  };
  

  const handleDeleteService = async (serviceName) => {
    if (!window.confirm(`Are you sure you want to delete ${serviceName}?`)) {
      return;
    }
    
    try {
   
      if (!serviceName || typeof serviceName !== 'string') {
        throw new Error('Invalid service name');
      }

      const response = await fetch(`http://localhost:8080/api/salons/${salon._id}/services/${encodeURIComponent(serviceName)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete service');
      }
      

      fetchSalon(business.username);
      

      if (workerInviteRef.current) {
        console.log('Refreshing services in WorkerInvite after deletion...');
        workerInviteRef.current.refreshServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service: ' + error.message);
    }
  };
  

  const editService = (service) => {

    const safeService = {
      name: '',
      imageUrl: ''
    };
    
    if (service && typeof service === 'object') {
      if (typeof service.name === 'string') {
        safeService.name = service.name;
      }
      
      if (typeof service.imageUrl === 'string') {
        safeService.imageUrl = service.imageUrl;
      }
    } else if (typeof service === 'string') {
      safeService.name = service;
    }
    
    setCurrentService(safeService);
    setServiceImagePreview(safeService.imageUrl || null);
    setShowServiceManager(true);
  };
  

  const addNewService = () => {
    setCurrentService({ name: '', imageUrl: '' });
    setServiceImage(null);
    setServiceImagePreview(null);
    setShowServiceManager(true);
  };

  const renderSalonPreview = () => {
    if (!salon) return null;
    
    return (
      <div className="salon-preview">
        <h3>
          <span>Salonul Meu:</span>
        </h3>
        <p><strong>Nume:</strong> {salon.name || 'Fără nume'}</p>
        <p>
          <strong>Adresă:</strong> 
          {salon.address && typeof salon.address === 'object' ? 
            `${salon.address.street || ''} ${salon.address.number || ''}, sector ${salon.address.sector || ''}` : 
            'Adresă nedisponibilă'}
        </p>
        <p><strong>Descriere:</strong> {salon.description || "Nicio descriere"}</p>
        
        {Array.isArray(salon.services) && salon.services.length > 0 && (
          <div className="salon-services">
            <strong>Servicii:</strong>
            <div className="services-grid">
              {salon.services.map((service, index) => {
           
                let serviceName = 'Serviciu Nedefinit';
                let serviceImageUrl = '';
                
                if (typeof service === 'string') {
                  serviceName = service;
                } else if (service && typeof service === 'object') {
               
                  if (typeof service.name === 'string') {
                    serviceName = service.name;
                  }
         
                  if (typeof service.imageUrl === 'string') {
                    serviceImageUrl = service.imageUrl;
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
                      <h4>{serviceName}</h4>
                    </div>
                    <div className="service-actions">
                      <button 
                        className="btn btn-secondary edit-service-btn" 
                        onClick={() => editService({
                          name: serviceName,
                          imageUrl: serviceImageUrl
                        })}
                      >
                        Editează
                      </button>
                      <button 
                        className="btn btn-danger delete-service-btn" 
                        onClick={() => handleDeleteService(serviceName)}
                      >
                        Șterge
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="service-card add-card" onClick={addNewService}>
                <div className="add-service-placeholder">
                  <span>+</span>
                  <p>Adaugă serviciu</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {Array.isArray(salon.workingHours) && salon.workingHours.length > 0 && (
          <div>
            <strong>Program de lucru:</strong>
            <ul>
              {salon.workingHours.map((wh, i) => {
            
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
                
                return (
                  <li key={i}>
                    {dayOfWeek}: <span>{timeFrom} – {timeTo}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <button className="btn btn-primary" onClick={() => setShowSalonForm(true)}>
          Editează Salonul
        </button>
        
        {/* Worker Invitation Component */}
        <WorkerInvite ref={workerInviteRef} salonId={salon._id} />
      </div>
    );
  };

  return (
    <div className="owner-dashboard">
      <aside className="sidebar">
        <h2>Bookly</h2>
        <ul>
          <li onClick={() => setShowSalonForm(true)}>Editează Salon</li>
         
          <li onClick={fetchWorkers}>Experții mei</li>
         
          {salon && (
            <li onClick={addNewService}>Administrare Servicii</li>
          )}
        </ul>
        <button className="btn btn-primary logout-btn" onClick={handleLogout}>Delogare</button>
      </aside>

      <main className="main-content">
        <h1>Profilul meu</h1>

        {business ? (
          <div className="profile-section">
            <p><strong>Nume:</strong> {business.prenume} {business.nume}</p>
            <p><strong>Email:</strong> {business.email}</p>
            <p><strong>Telefon:</strong> {business.telefon}</p>

           
            
            {salon && renderSalonPreview()}

            <div className="map-placeholder">
              <p>Bookly - beauty app</p>
            </div>
          </div>
        ) : (
          <p>Se încarcă datele profilului...</p>
        )}

        {showSalonForm && (
          <div className="salon-form">
            <form onSubmit={handleSalonSubmit}>
              <button 
                type="button" 
                className="close-btn" 
                onClick={() => setShowSalonForm(false)}
              >
                ×
              </button>
              
              <h2>Editează Salonul Tău</h2>
              
              <div className="form-section">
                <div className="form-section-title">Informații de bază</div>
                <label>Nume salon</label>
                <input 
                  name="name" 
                  placeholder="Nume salon" 
                  value={salonData.name} 
                  onChange={handleSalonInputChange} 
                  required 
                />
                
                <label>Descriere</label>
                <textarea 
                  name="description" 
                  placeholder="Descriere servicii, facilități și atmosferă" 
                  value={salonData.description} 
                  onChange={handleSalonInputChange} 
                  rows="3" 
                />
              </div>
              
              <div className="form-section">
                <div className="form-section-title">Adresă și locație</div>
                <div className="grid-2">
                  <div>
                    <label>Stradă</label>
                    <input 
                      name="street" 
                      placeholder="Stradă" 
                      value={salonData.street} 
                      onChange={handleSalonInputChange} 
                    />
                  </div>
                  <div>
                    <label>Număr</label>
                    <input 
                      name="number" 
                      placeholder="Număr" 
                      value={salonData.number} 
                      onChange={handleSalonInputChange} 
                    />
                  </div>
                </div>
                
                <label>Sector</label>
                <select 
                  name="sector" 
                  value={salonData.sector} 
                  onChange={handleSalonInputChange}
                >
                  <option value="">Selectează sector</option>
                  <option value="1">Sector 1</option>
                  <option value="2">Sector 2</option>
                  <option value="3">Sector 3</option>
                  <option value="4">Sector 4</option>
                  <option value="5">Sector 5</option>
                  <option value="6">Sector 6</option>
                </select>
                
                <div className="grid-2">
                  <div>
                    <label>Latitudine</label>
                    <input 
                      name="lat" 
                      placeholder="Latitudine" 
                      value={salonData.lat} 
                      onChange={handleSalonInputChange} 
                      required 
                    />
                  </div>
                  <div>
                    <label>Longitudine</label>
                    <input 
                      name="lng" 
                      placeholder="Longitudine" 
                      value={salonData.lng} 
                      onChange={handleSalonInputChange} 
                      required 
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <div className="form-section-title">Program de lucru</div>
                
                {salonData.workingHours.map((wh, idx) => (
                  <div key={idx} className="work-hour-row">
                    <select
                      value={wh.dayOfWeek}
                      onChange={e => updateWorkingHour(idx, 'dayOfWeek', e.target.value)}
                    >
                      {weekdays.map(day => 
                        <option key={day} value={day}>{day}</option>
                      )}
                    </select>

                    <input
                      type="time"
                      value={wh.from}
                      onChange={e => updateWorkingHour(idx, 'from', e.target.value)}
                    />

                    <input
                      type="time"
                      value={wh.to}
                      onChange={e => updateWorkingHour(idx, 'to', e.target.value)}
                    />

                    <button 
                      type="button" 
                      onClick={() => removeWorkingHour(idx)}
                    >
                      ×
                    </button>
                  </div>
                ))}

                <button 
                  type="button" 
                  className="add-interval-btn"
                  onClick={addWorkingHour}
                >
                  + Adaugă interval orar
                </button>
              </div>
              
              <button type="submit" className="submit-btn">Salvează salonul</button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowSalonForm(false)}
              >
                Anulează
              </button>
            </form>
          </div>
        )}
        
        {showServiceManager && salon && (
          <div className="service-manager-modal">
            <div className="service-form">
              <button 
                type="button" 
                className="close-btn" 
                onClick={() => setShowServiceManager(false)}
              >
                ×
              </button>
              
              <h2>{currentService.name ? `Editare serviciu: ${currentService.name}` : 'Adaugă serviciu nou'}</h2>
              
              {serviceError && <div className="error-message">{serviceError}</div>}
              
              <form onSubmit={handleServiceSubmit}>
                <div className="form-group">
                  <label htmlFor="serviceName">Nume serviciu</label>
                  <input 
                    type="text" 
                    id="serviceName" 
                    name="name" 
                    value={currentService.name} 
                    onChange={handleServiceChange} 
                    required 
                    className="form-control"
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
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary add-service-btn" 
                    disabled={uploading}
                  >
                    {uploading ? 'Se încarcă...' : currentService.name ? 'Salvează modificările' : 'Adaugă serviciu'}
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowServiceManager(false)}
                  >
                    Anulează
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showWorkers && (
  <div className="worker-modal">
    <div className="worker-modal-content">
      <button className="close-btn" onClick={() => setShowWorkers(false)}>×</button>
      <h2>Experții salonului</h2>

      {workers.length === 0 ? (
        <p>Nu există experți adăugați pentru acest salon.</p>
      ) : (
        <ul className="worker-list">
          {workers.map((worker, index) => (
  <li key={index} className="worker-card">
    <div className="worker-header">
      {worker.image ? (
        <img src={worker.image} alt={`${worker.name} ${worker.surname}`} className="worker-avatar" />
      ) : (
        <div className="worker-avatar-placeholder">👤</div>
      )}
      <div>
        <p><strong>Nume:</strong> {worker.name} {worker.surname}</p>
        <p><strong>Email:</strong> {worker.email}</p>
        {worker.bio && <p><strong>Bio:</strong> {worker.bio}</p>}
        {worker.experience && <p><strong>Experiență:</strong> {worker.experience}</p>}
      </div>
    </div>

    {Array.isArray(worker.services) && worker.services.length > 0 && (
      <div className="worker-services">
        <p><strong>Servicii:</strong></p>
        <ul>
          {worker.services.map((service, idx) => (
            <li key={idx}>
              {typeof service === "object" ? `${service.name} (${service.duration}, ${service.price} lei)` : service}
            </li>
          ))}
        </ul>
      </div>
    )}

    {Array.isArray(worker.availability) && worker.availability.length > 0 && (
      <div className="worker-availability">
        <p><strong>Disponibilitate:</strong></p>
        <ul>
          {worker.availability.map((slot, i) => (
            <li key={i}>{slot.dayOfWeek}: {slot.from} – {slot.to}</li>
          ))}
        </ul>
      </div>
    )}
  </li>
))}

        </ul>
      )}
    </div>
  </div>
)}

      </main>
    </div>
  );
}

export default OwnerDashboard;
