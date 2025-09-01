import React, { useState, useEffect } from 'react';
import './MyBookings.css';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:8080/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        setUserId(userData._id);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!userId) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:8080/api/bookings/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }

        const data = await response.json();
        setBookings(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId]);

  const handleCancelBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

     
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'CANCELLED' }
          : booking
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      
    };
    return new Date(dateString).toLocaleDateString('ro-RO', options);
  };

  if (loading) {
    return <div className="bookings-loading">Se încarcă programările...</div>;
  }

  if (error) {
    return <div className="bookings-error">Eroare: {error}</div>;
  }

  return (
    <div className="my-bookings-container">
      <h2>Programările mele</h2>
      {bookings.length === 0 ? (
        <p className="no-bookings">Nu aveți programări active.</p>
      ) : (
        <div className="bookings-table">
          <div className="bookings-table-header">
            <div>Salon</div>
            <div>Serviciu</div>
            <div>Data</div>
            <div>Ora</div>
            <div>Angajat</div>
            <div>Status</div>
            <div>Acțiune</div>
          </div>
          {bookings.map((booking) => (
            <div key={booking.id} className="bookings-table-row">
              <div>{booking.salon.name}</div>
              <div>{booking.service}</div>
              <div>{formatDate(booking.date)}</div>
              <div>{booking.timeSlot}</div>
              <div>{booking.worker ? `${booking.worker.name} ${booking.worker.surname}` : '-'}</div>
              <div>
                <span className={`booking-status ${booking.status.toLowerCase()}`}>
                  {booking.status === 'confirmed' ? 'Confirmată' :
                   booking.status === 'cancelled' ? 'Anulată' :
                   booking.status === 'completed' ? 'Finalizată' : 'În așteptare'}
                </span>
              </div>
              <div>
                {booking.status === 'confirmed' && (
                  <button
                    className="cancel-booking-btn"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    Anulează
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
}

export default MyBookings; 