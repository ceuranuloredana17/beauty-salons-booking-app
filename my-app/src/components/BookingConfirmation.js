
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PaymentMethodSelector } from './VoucherStore';
import './BookingConfirmation.css';

function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState({ method: 'location', voucher: null, manualCode: '' });

  const [userVouchers, setUserVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [userData, setUserData] = useState(null);


  const [servicePrice, setServicePrice] = useState(0);

  useEffect(() => {

    if (!state || !state.worker || !state.salon || !state.service || !state.date || !state.timeSlot) {
      navigate('/salons');
    }
  }, [state, navigate]);


  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      const storedUserData = JSON.parse(localStorage.getItem('user')) || {};

      if (!token) return; 

      try {
        console.log('Fetching user data for form pre-fill');
        const response = await fetch('http://localhost:8080/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const serverUserData = await response.json();
          console.log('Received user data:', serverUserData);
          setUserData(serverUserData);

    
          const firstName = serverUserData.prenume || storedUserData.prenume || '';
          const lastName = serverUserData.nume || storedUserData.nume || '';
          const email = serverUserData.email || storedUserData.email || '';
          const phone = serverUserData.telefon || storedUserData.telefon || '';


          setFormData({
            clientName: `${firstName} ${lastName}`.trim(),
            clientEmail: email,
            clientPhone: phone
          });

          console.log('Form pre-filled with user data');
        } else {

          if (storedUserData && (storedUserData.prenume || storedUserData.nume)) {
            setUserData(storedUserData);
            setFormData({
              clientName: `${storedUserData.prenume || ''} ${storedUserData.nume || ''}`.trim(),
              clientEmail: storedUserData.email || '',
              clientPhone: storedUserData.telefon || ''
            });
            console.log('Form pre-filled with localStorage data');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);

        if (storedUserData && (storedUserData.prenume || storedUserData.nume)) {
          setUserData(storedUserData);
          setFormData({
            clientName: `${storedUserData.prenume || ''} ${storedUserData.nume || ''}`.trim(),
            clientEmail: storedUserData.email || '',
            clientPhone: storedUserData.telefon || ''
          });
          console.log('Form pre-filled with localStorage data after fetch error');
        }
      }
    };

    const fetchUserVouchers = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        setLoadingVouchers(true);
        const response = await fetch('http://localhost:8080/api/vouchers/my-vouchers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const vouchers = await response.json();
          setUserVouchers(vouchers);
        }
      } catch (error) {
        console.error('Error fetching vouchers:', error);
      } finally {
        setLoadingVouchers(false);
      }
    };

    const fetchServicePrice = async () => {
      try {

        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/workers/${state.worker.id}`, {
          headers: {
            "Authorization" : `Bearer ${token}`
          }
        });
        if (response.ok) {
          const workerData = await response.json();
          const service = workerData.services.find(s => s.name === state.service);
          if (service) {
            setServicePrice(service.price);
          }
        }
      } catch (error) {
        console.error('Error fetching service price:', error);

        setServicePrice(50);
      }
    };

    fetchUserData();
    fetchUserVouchers();
    fetchServicePrice();
  }, [state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        salonId: state.salon.id,
        workerId: state.worker.id,
        service: state.service,
        date: state.date,
        timeSlot: state.timeSlot,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        paymentMethod: paymentMethod.method,
        totalAmount: servicePrice
      };


      if (userData && userData._id) {
        bookingData.userId = userData._id;
      }

      if (paymentMethod.method === 'voucher') {
        if (paymentMethod.voucher) {
          bookingData.voucherId = paymentMethod.voucher._id;
        } else if (paymentMethod.manualCode) {
          bookingData.voucherCode = paymentMethod.manualCode.trim();
        }
      }
      

      console.log('Creating booking with data:', bookingData);


      const token = localStorage.getItem("token")
      const bookingResponse = await fetch('http://localhost:8080/api/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      const bookingResult = await bookingResponse.json();

      if (!bookingResponse.ok) {
        throw new Error(bookingResult.message || 'Failed to create booking');
      }

      setSuccess(true);
      setBookingDetails(bookingResult.booking);
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error.message || 'An error occurred while creating your booking');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ro-RO', options);
  };
  
  const handlePaymentMethodChange = (newPaymentMethod) => {
    setPaymentMethod(prev => ({
      ...prev,
      ...newPaymentMethod,
      manualCode: newPaymentMethod.manualCode ?? prev.manualCode
    }));
  };
  


  const getPaymentSummary = () => {
    if (paymentMethod.method === 'voucher' && paymentMethod.voucher) {
      const remaining = paymentMethod.voucher.amount - servicePrice;
      return {
        method: 'Voucher',
        details: `Cod: ${paymentMethod.voucher.code}`,
        amount: `${servicePrice} RON`,
        remaining: remaining > 0 ? `${remaining} RON (se pierde)` : null
      };
    }
    return {
      method: 'Plată la locație',
      details: 'Plătești direct la salon',
      amount: `${servicePrice} RON`
    };
  };

  if (!state) {
    return null; 
  }

  if (success && bookingDetails) {
    const paymentSummary = getPaymentSummary();

    return (
      <div className="booking-confirmation success-page">
        <div className="confirmation-card">
          <div className="success-icon">✓</div>
          <h2>Rezervare confirmată!</h2>

          <div className="booking-details">
            <p className="booking-info"><strong>Salon:</strong> {state.salon.name}</p>
            <p className="booking-info">
              <strong>Angajat:</strong> {state.worker.name} {state.worker.surname}
            </p>
            <p className="booking-info"><strong>Serviciu:</strong> {state.service}</p>
            <p className="booking-info">
              <strong>Data:</strong> {formatDate(state.date)}
            </p>
            <p className="booking-info"><strong>Ora:</strong> {state.timeSlot}</p>
            <p className="booking-info"><strong>Plată:</strong> {paymentSummary.method}</p>
            {paymentSummary.details && (
              <p className="booking-info"><strong>Detalii:</strong> {paymentSummary.details}</p>
            )}
          </div>

          <p className="confirmation-message">
            Am trimis un email de confirmare la adresa {formData.clientEmail}.
          </p>

          <div className="action-buttons">
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/salons')}
            >
              Înapoi la saloane
            </button>

            <button
              className="btn btn-primary"
              onClick={() => {
       
                const token = localStorage.getItem('token');
                const user = localStorage.getItem('user');

                if (token && user) {
                  navigate('/dashboard'); 
                } else {
                  navigate('/salons'); 
                }
              }}
            >
              Mergi la contul meu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-confirmation">
      <div className="confirmation-card">
        <h2>Confirmă rezervarea</h2>

        <div className="booking-summary">
          <h3>Detalii rezervare</h3>
          <p><strong>Salon:</strong> {state.salon.name}</p>
          <p>
            <strong>Angajat:</strong> {state.worker.name} {state.worker.surname}
          </p>
          <p><strong>Serviciu:</strong> {state.service}</p>
          <p>
            <strong>Data:</strong> {formatDate(state.date)}
          </p>
          <p><strong>Ora:</strong> {state.timeSlot}</p>
          <p><strong>Preț:</strong> {servicePrice} RON</p>
        </div>

        {/* Payment Method Selection - only show if user is logged in */}
        {userData && (
          <PaymentMethodSelector
            onPaymentMethodChange={handlePaymentMethodChange}
            userVouchers={userVouchers}
            totalAmount={servicePrice}
          />
          
        )}
        {paymentMethod.method === 'voucher' && (
  (userVouchers.length === 0 || !paymentMethod.voucher) && (
    <div className="form-group">
      <label htmlFor="manualVoucher">Introdu codul voucherului</label>
      <input
        type="text"
        id="manualVoucher"
        name="manualVoucher"
        placeholder="Ex: ABC123XYZ"
        value={paymentMethod.manualCode}
        onChange={(e) =>
          setPaymentMethod(prev => ({ ...prev, manualCode: e.target.value }))
        }
        className="form-input"
      />
    </div>
  )
)}



        <form onSubmit={handleSubmit} className="client-form">
          <h3>Informații client</h3>

          <div className="form-group">
            <label htmlFor="clientName">Nume complet</label>
            <input
              type="text"
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="clientEmail">Email</label>
            <input
              type="email"
              id="clientEmail"
              name="clientEmail"
              value={formData.clientEmail}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="clientPhone">Telefon</label>
            <input
              type="tel"
              id="clientPhone"
              name="clientPhone"
              value={formData.clientPhone}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Înapoi
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Se procesează...' : 'Confirmă rezervarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingConfirmation;