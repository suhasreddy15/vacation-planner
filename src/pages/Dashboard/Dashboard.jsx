import { useEffect, useState } from 'react';
import { FiCpu, FiGlobe, FiCalendar, FiMapPin, FiUser, FiTag } from 'react-icons/fi';
import DashboardCard from '../../components/DashboardCard/DashboardCard.jsx';
import Button from '../../components/Button/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './Dashboard.css';

function Dashboard() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [aiPlans, setAiPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const token = localStorage.getItem('voyageiq-token');
      if (!token) return;

      // Fetch bookings
      try {
        const response = await fetch('/api/bookings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        }
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        setLoadingBookings(false);
      }

      // Fetch AI Plans
      try {
        const response = await fetch('/api/ai-planner', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAiPlans(data);
        }
      } catch (err) {
        console.error("Failed to fetch AI plans:", err);
      } finally {
        setLoadingPlans(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Welcome back, {currentUser?.name || 'traveler'}.</h1>
          <p>
            Review your active travel details, book new excursions, or generate personalized schedules.
          </p>
        </div>
      </section>

      <section className="section dashboard-page">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

          {/* Main Actions */}
          <div className="dashboard-grid">
            <DashboardCard
              title="Book a Trip"
              description="Explore professionally organized vacation packages created by travel organizers."
              buttonText="Explore Trips"
              to="/book-trip"
              icon={<FiGlobe />}
              tone="trip"
              image="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80"
            />
            <DashboardCard
              title="Plan with AI"
              description="Generate a personalized vacation plan based on your destination, budget, and preferences."
              buttonText="Start Planning"
              to="/ai-planner"
              icon={<FiCpu />}
              tone="ai"
              image="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80"
            />
          </div>

          {/* Bookings & Itineraries split */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>

            {/* Active Bookings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiGlobe style={{ color: 'var(--accent-blue)' }} /> Active Bookings
              </h2>
              {loadingBookings ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>Loading bookings...</div>
              ) : bookings.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <p style={{ marginBottom: '1rem' }}>You don't have any booked trips yet.</p>
                  <Button to="/book-trip" size="sm">Find a Trip</Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {bookings.map((booking) => (
                    <article key={booking.id} style={{ display: 'flex', gap: '1rem', background: 'var(--card-background)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', overflow: 'hidden' }}>
                      <img src={booking.trip.image} alt={booking.trip.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{booking.trip.name}</h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                            <FiMapPin /> {booking.trip.location}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FiCalendar /> {booking.travel_date}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FiUser /> {booking.travelers_count} {booking.travelers_count > 1 ? 'Travelers' : 'Traveler'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--text-main)' }}><FiTag /> {booking.total_price}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)' }}>
                          {booking.status}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* AI Generated Itineraries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiCpu style={{ color: 'var(--accent-blue)' }} /> Saved AI Outlines
              </h2>
              {loadingPlans ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>Loading plans...</div>
              ) : aiPlans.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <p style={{ marginBottom: '1rem' }}>No AI trip blueprints generated yet.</p>
                  <Button to="/ai-planner" size="sm">Create Outline</Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {aiPlans.slice(0, 3).map((plan) => (
                    <details key={plan.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: 'var(--card-background)', textAlign: 'left' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', outline: 'none' }}>
                        {plan.destination}
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {plan.days} Days | {plan.style} Style | {plan.created_at.split(' ')[0]}
                        </span>
                      </summary>
                      <div style={{ whiteSpace: 'pre-line', fontSize: '0.85rem', lineHeight: '1.5', marginTop: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', color: 'var(--text-main)', maxHeight: '200px', overflowY: 'auto' }}>
                        {plan.plan}
                      </div>
                    </details>
                  ))}
                  {aiPlans.length > 3 && (
                    <Button to="/ai-planner" variant="outline" size="sm">
                      View all {aiPlans.length} plans
                    </Button>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </section>
    </>
  );
}

export default Dashboard;
