import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiMapPin, FiStar } from 'react-icons/fi';
import Button from '../../components/Button/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './TripDetails.css';

const included = ['Hotel', 'Food', 'Transport', 'Guide'];

function TripDetails() {
  const { tripId } = useParams(); // tripId corresponds to the slug
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Booking states
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null); // 'submitting', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function fetchTripDetails() {
      try {
        setLoading(true);
        const response = await fetch(`/api/trips/${tripId}`);
        if (!response.ok) {
          throw new Error('Trip package not found.');
        }
        const data = await response.json();
        setTrip(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTripDetails();
  }, [tripId]);

  const handleBookClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/trip/${tripId}` } });
      return;
    }
    setShowBookingForm(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingDate) {
      setErrorMessage('Please select a travel date.');
      return;
    }
    try {
      setBookingStatus('submitting');
      setErrorMessage('');
      const token = localStorage.getItem('voyageiq-token');
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          trip_id: trip.db_id,
          travel_date: bookingDate,
          travelers_count: travelers,
          special_requests: specialRequests
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to complete booking.');
      }
      setBookingStatus('success');
    } catch (err) {
      setBookingStatus('error');
      setErrorMessage(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Loading trip specifications...
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--accent-red)' }}>
        Error: {error || 'Trip details not found'}
      </div>
    );
  }

  return (
    <>
      <section className="trip-details-hero" style={{ backgroundImage: `url(${trip.image})` }}>
        <div className="container trip-details-hero__content">
          <span>{trip.category}</span>
          <h1>{trip.name}</h1>
          <div className="trip-details-hero__meta">
            <span>
              <FiMapPin /> {trip.location}
            </span>
            <span>
              <FiClock /> {trip.duration}
            </span>
            <span>
              <FiStar /> {trip.rating}
            </span>
          </div>
        </div>
      </section>

      <section className="section trip-details-page">
        <div className="container trip-details-layout">
          <div className="trip-details-main">
            <div className="details-block">
              <h2>{trip.name}</h2>
              <p>{trip.description}</p>
              <div className="price-strip">
                <div>
                  <span>Location</span>
                  <strong>{trip.location}</strong>
                </div>
                <div>
                  <span>Price</span>
                  <strong>{trip.price}</strong>
                </div>
                <div>
                  <span>Duration</span>
                  <strong>{trip.duration}</strong>
                </div>
              </div>
            </div>

            {trip.gallery && trip.gallery.length > 0 && (
              <div className="details-block">
                <h2>Image Gallery</h2>
                <div className="gallery-grid">
                  {trip.gallery.map((image, index) => (
                    <img src={image} alt={`${trip.name} gallery ${index}`} key={image} />
                  ))}
                </div>
              </div>
            )}

            {trip.highlights && trip.highlights.length > 0 && (
              <div className="details-block">
                <h2>Highlights</h2>
                <div className="highlight-grid">
                  {trip.highlights.map((highlight) => (
                    <div key={highlight}>
                      <FiCheckCircle />
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trip.itinerary && trip.itinerary.length > 0 && (
              <div className="details-block">
                <h2>Day-wise Itinerary</h2>
                <div className="itinerary-list">
                  {trip.itinerary.map((day, index) => (
                    <article key={index}>
                      <span>Day {index + 1}</span>
                      <p>{day}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="booking-panel">
            {bookingStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <FiCheckCircle style={{ fontSize: '3.5rem', color: 'var(--accent-blue)', marginBottom: '1.25rem' }} />
                <h3>Booking Confirmed!</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.75rem 0 1.75rem 0', lineHeight: '1.4' }}>
                  Your package has been successfully scheduled. You can track this booking in your dashboard workspace.
                </p>
                <Button to="/dashboard">Go to Dashboard</Button>
              </div>
            ) : showBookingForm ? (
              <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Complete Booking</h3>
                {errorMessage && (
                  <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                    {errorMessage}
                  </div>
                )}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 500 }}>
                  Travel Date
                  <input
                    type="date"
                    required
                    style={{
                      padding: '0.6rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-main)',
                      fontFamily: 'inherit'
                    }}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 500 }}>
                  Number of Travelers
                  <input
                    type="number"
                    min="1"
                    required
                    style={{
                      padding: '0.6rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-main)',
                      fontFamily: 'inherit'
                    }}
                    value={travelers}
                    onChange={(e) => setTravelers(parseInt(e.target.value) || 1)}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 500 }}>
                  Special Requests (Optional)
                  <textarea
                    rows="3"
                    style={{
                      padding: '0.6rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-background)',
                      color: 'var(--text-main)',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="E.g. dietary constraints, bedding..."
                  />
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button type="submit" style={{ flex: 1 }} disabled={bookingStatus === 'submitting'}>
                    {bookingStatus === 'submitting' ? 'Confirming...' : 'Confirm'}
                  </Button>
                  <Button variant="outline" style={{ flex: 1 }} onClick={() => { setShowBookingForm(false); setErrorMessage(''); }} type="button">
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <h2>{trip.price}</h2>
                <p>Per traveler, based on double occupancy and organizer availability.</p>
                <h3>Included</h3>
                <ul>
                  {included.map((item) => (
                    <li key={item}>
                      <FiCheckCircle /> {item}
                    </li>
                  ))}
                </ul>
                <Button onClick={handleBookClick}>Book Now</Button>
              </>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}

export default TripDetails;

