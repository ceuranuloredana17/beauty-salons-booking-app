import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './WorkerInvite.css';

const WorkerInvite = forwardRef(function WorkerInvite({ salonId }, ref) {
  const [email, setEmail] = useState('');
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  // Fetch salon services function
  const fetchSalonDetails = async () => {
    try {
      if (!salonId) return;
      
      console.log('Fetching services for salon:', salonId);
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/salons/${salonId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch salon details');
      }
      
      const data = await response.json();
      console.log('Fetched salon services:', data.services);
      setAvailableServices(data.services || []);
    } catch (error) {
      console.error('Error fetching salon services:', error);
    }
  };

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refreshServices: fetchSalonDetails
  }));

  // Fetch salon services on component mount and when salonId changes
  useEffect(() => {
    fetchSalonDetails();
  }, [salonId]);

  
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        if (!salonId) return;
        const token = localStorage.getItem("token")
        setLoadingInvitations(true);
        const response = await fetch(`http://localhost:8080/api/invitations/salon/${salonId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch invitations');
        }
        
        const data = await response.json();
        setPendingInvitations(data);
        setLoadingInvitations(false);
      } catch (error) {
        console.error('Error fetching invitations:', error);
        setLoadingInvitations(false);
      }
    };

    fetchInvitations();
  }, [salonId]);


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

 
  const isSameService = (service1, service2) => {
    const name1 = getServiceName(service1);
    const name2 = getServiceName(service2);
    return name1 === name2;
  };

  const handleServiceToggle = (service) => {
    if (services.some(s => isSameService(s, service))) {
      setServices(services.filter(s => !isSameService(s, service)));
    } else {
      setServices([...services, service]);
    }
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: 'Te rugăm să introduci adresa de email' });
      return;
    }
    
    if (services.length === 0) {
      setMessage({ type: 'error', text: 'Te rugăm să selectezi cel puțin un serviciu' });
      return;
    }
    
    try {
      setLoading(true);
      setMessage(null);
      
      
      const serviceObjects = services.map(service => {
        if (typeof service === 'object' && service.name) {
          return { name: service.name, imageUrl: service.imageUrl || '' };
        }
        return { name: service, imageUrl: '' };
      });
      
      const response = await fetch('http://localhost:8080/api/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email,
          salonId,
          services: serviceObjects
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invitation');
      }
      
      setMessage({ type: 'success', text: 'Invitația a fost trimisă cu succes' });
      setEmail('');
      setServices([]);
      
    
      setPendingInvitations([...pendingInvitations, data.invitation]);
    } catch (error) {
      console.error('Error sending invitation:', error);
      setMessage({ type: 'error', text: error.message || 'A apărut o eroare la trimiterea invitației' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvitation = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/invitations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete invitation');
      }
      
    
      setPendingInvitations(pendingInvitations.filter(inv => inv._id !== id));
      setMessage({ type: 'success', text: 'Invitația a fost ștearsă' });
    } catch (error) {
      console.error('Error deleting invitation:', error);
      setMessage({ type: 'error', text: 'A apărut o eroare la ștergerea invitației' });
    }
  };

  return (
    <div className="worker-invite-container card">
      <h3>Invită angajați noi</h3>
      
      <form onSubmit={handleSendInvitation} className="invite-form">
        <div className="form-group">
          <label htmlFor="email">Adresa de email a angajatului:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nume.prenume@exemplu.com"
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Servicii disponibile ({availableServices.length}):</label>
          {availableServices.length === 0 ? (
            <p className="no-services-message">
              Nu există servicii configurate în salon. Adaugă servicii pentru a putea invita angajați.
            </p>
          ) : (
            <div className="services-checkboxes">
              {availableServices.map((service, index) => (
                <div key={index} className="service-checkbox">
                  <input
                    type="checkbox"
                    id={`service-${index}`}
                    checked={services.some(s => isSameService(s, service))}
                    onChange={() => handleServiceToggle(service)}
                  />
                  <label htmlFor={`service-${index}`}>{getServiceName(service)}</label>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || availableServices.length === 0}
        >
          {loading ? 'Se trimite...' : 'Trimite invitație'}
        </button>
      </form>
      
      <div className="pending-invitations">
        <h4>Invitații în așteptare</h4>
        
        {loadingInvitations ? (
          <div className="loading-indicator">Se încarcă invitațiile...</div>
        ) : pendingInvitations.length === 0 ? (
          <p className="no-invitations">Nu există invitații în așteptare</p>
        ) : (
          <div className="invitations-list">
            {pendingInvitations.map(invitation => (
              <div key={invitation._id} className="invitation-item">
                <div className="invitation-details">
                  <span className="invitation-email">{invitation.email}</span>
                  <span className="invitation-date">
                    {new Date(invitation.createdAt).toLocaleDateString('ro-RO')}
                  </span>
                </div>
                <div className="invitation-services">
                  {invitation.services.map((service, index) => (
                    <span key={index} className="service-tag">{getServiceName(service)}</span>
                  ))}
                </div>
                <button 
                  className="btn btn-text delete-btn"
                  onClick={() => handleDeleteInvitation(invitation._id)}
                >
                  Șterge
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default WorkerInvite; 