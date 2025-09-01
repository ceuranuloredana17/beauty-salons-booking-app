import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './WorkerRegister.css';

function WorkerRegister() {
  const { token } = useParams();
  const navigate = useNavigate();
  const jwt = localStorage.getItem("token")
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);
  const [invitationData, setInvitationData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    bio: '',
    experience: 0
  });
  const [loading, setLoading] = useState(false);
  
 
  const getServiceName = (service) => {
    if (typeof service === 'string') {
      return service;
    } else if (service && typeof service === 'object') {
      
      if (typeof service.name === 'string') {
        return service.name;
      }
      
      
      if (Object.keys(service).some(key => !isNaN(parseInt(key)))) {
        
        const values = Object.keys(service)
          .filter(key => !isNaN(parseInt(key)))
          .map(key => service[key])
          .filter(val => typeof val === 'string');
        
        if (values.length > 0) {
          return values.join('');
        }
      }
    }
    return 'Serviciu Nedefinit';
  };
  
  
  useEffect(() => {
    const verifyToken = async () => {
      try {
        setVerifying(true);
        setError(null);
      
        const response = await fetch(`http://localhost:8080/api/invitations/verify/${token}`, {
          headers: {
            "Authorization":`Bearer ${jwt}`
          }
        });
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.message || 'Invitația este invalidă sau a expirat');
          setVerifying(false);
          return;
        }
        
        setInvitationData(data.invitation);
        setVerifying(false);
      } catch (error) {
        console.error('Error verifying token:', error);
        setError('A apărut o eroare la verificarea invitației');
        setVerifying(false);
      }
    };
    
    if (token) {
      verifyToken();
    }
  }, [token]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    if (formData.password !== formData.confirmPassword) {
      setError('Parolele nu coincid');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8080/api/invitations/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization':`Bearer ${jwt}`
        },
        body: JSON.stringify({
          token,
          name: formData.name,
          surname: formData.surname,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          bio: formData.bio,
          experience: parseInt(formData.experience)
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Eroare la înregistrare');
      }
      
      
      navigate('/worker-login', { 
        state: { 
          message: 'Contul tău a fost creat cu succes. Te poți autentifica acum.' 
        } 
      });
      
    } catch (error) {
      console.error('Error registering worker:', error);
      setError(error.message || 'A apărut o eroare la înregistrare');
    } finally {
      setLoading(false);
    }
  };
  
  if (verifying) {
    return (
      <div className="worker-register-container loading">
        <div className="loading-spinner"></div>
        <p>Se verifică invitația...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="worker-register-container error">
        <div className="error-icon">!</div>
        <h2>Invitație invalidă</h2>
        <p>{error}</p>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/login')}
        >
          Înapoi la pagina de autentificare
        </button>
      </div>
    );
  }
  
  return (
    <div className="worker-register-container">
      <div className="register-header">
        <h2>Creează cont de angajat</h2>
        {invitationData && (
          <div className="invitation-info">
            <p>Ai fost invitat să lucrezi la <strong>{invitationData.salonName}</strong></p>
            <p className="email-info">Email: <strong>{invitationData.email}</strong></p>
            {invitationData.services && invitationData.services.length > 0 && (
              <div className="services-info">
                <p>Servicii: </p>
                <div className="service-tags">
                  {invitationData.services.map((service, index) => (
                    <span key={index} className="service-tag">{getServiceName(service)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="name">Prenume</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="surname">Nume</label>
          <input
            type="text"
            id="surname"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phoneNumber">Telefon</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Parolă</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            required
            minLength={6}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmă parola</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="experience">Experiență (ani)</label>
          <input
            type="number"
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            className="form-input"
            min={0}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="bio">Descriere</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Scurtă descriere profesională, specializări, etc."
            rows={4}
          ></textarea>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary register-btn"
          disabled={loading}
        >
          {loading ? 'Se creează contul...' : 'Creează cont'}
        </button>
      </form>
    </div>
  );
}

export default WorkerRegister; 