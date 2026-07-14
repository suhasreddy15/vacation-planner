import { useState, useEffect } from 'react';
import { FiCpu, FiSend, FiInbox, FiClock } from 'react-icons/fi';
import Button from '../../components/Button/Button.jsx';
import './AIPlanner.css';

function AIPlanner() {
  const [formData, setFormData] = useState({
    destination: '',
    budget: '',
    number_of_days: '',
    travelers_count: '',
    travel_style: '',
    transportation_preference: '',
    accommodation_type: '',
    special_requirements: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [pastPlans, setPastPlans] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);

  useEffect(() => {
    async function loadPastPlans() {
      try {
        setLoadingPast(true);
        const token = localStorage.getItem('voyageiq-token');
        if (!token) return;
        const response = await fetch('/api/ai-planner', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setPastPlans(data);
        }
      } catch (err) {
        console.error("Failed to load historical itineraries:", err);
      } finally {
        setLoadingPast(false);
      }
    }
    loadPastPlans();
  }, [currentPlan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e) => {
    setFormData((prev) => ({ ...prev, travel_style: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.destination || !formData.budget || !formData.number_of_days || !formData.travel_style) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('voyageiq-token');
      const response = await fetch('/api/ai-planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          destination: formData.destination,
          budget: formData.budget,
          number_of_days: parseInt(formData.number_of_days) || 3,
          travelers_count: parseInt(formData.travelers_count) || 1,
          travel_style: formData.travel_style,
          transportation_preference: formData.transportation_preference || null,
          accommodation_type: formData.accommodation_type || null,
          special_requirements: formData.special_requirements || null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate travel plan.');
      }
      
      setCurrentPlan(data);
      // Reset form fields
      setFormData({
        destination: '',
        budget: '',
        number_of_days: '',
        travelers_count: '',
        travel_style: '',
        transportation_preference: '',
        accommodation_type: '',
        special_requirements: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>AI Planner</h1>
          <p>
            Enter your destination, budget, pace, and travel preferences to prepare a personalized
            itinerary workspace.
          </p>
        </div>
      </section>

      <section className="section ai-planner-page">
        <div className="container ai-planner-layout">
          <form className="planner-form" onSubmit={handleSubmit}>
            <div className="form-heading">
              <div>
                <FiCpu />
              </div>
              <div>
                <h2>Build your trip profile</h2>
                <p>Fine-tune the essentials before generating a travel plan.</p>
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.6rem', borderRadius: '6px', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div className="form-grid">
              <label>
                Destination *
                <input
                  type="text"
                  name="destination"
                  required
                  placeholder="Santorini, Greece"
                  value={formData.destination}
                  onChange={handleChange}
                />
              </label>
              <label>
                Budget (in Rupees) *
                <input
                  type="text"
                  name="budget"
                  required
                  placeholder="150000"
                  value={formData.budget}
                  onChange={handleChange}
                />
              </label>
              <label>
                Number of Days *
                <input
                  type="number"
                  name="number_of_days"
                  min="1"
                  required
                  placeholder="7"
                  value={formData.number_of_days}
                  onChange={handleChange}
                />
              </label>
              <label>
                Number of Travelers *
                <input
                  type="number"
                  name="travelers_count"
                  min="1"
                  required
                  placeholder="2"
                  value={formData.travelers_count}
                  onChange={handleChange}
                />
              </label>
              <label>
                Travel Style *
                <select value={formData.travel_style} onChange={handleSelectChange} required>
                  <option value="" disabled>
                    Select style
                  </option>
                  <option value="Luxury">Luxury</option>
                  <option value="Budget">Budget</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Family">Family</option>
                  <option value="Solo">Solo</option>
                </select>
              </label>
              <label>
                Transportation Preference
                <input
                  type="text"
                  name="transportation_preference"
                  placeholder="Train, rental car, private transfers"
                  value={formData.transportation_preference}
                  onChange={handleChange}
                />
              </label>
              <label>
                Accommodation Type
                <input
                  type="text"
                  name="accommodation_type"
                  placeholder="Boutique hotel, villa, resort"
                  value={formData.accommodation_type}
                  onChange={handleChange}
                />
              </label>
              <label className="full-span">
                Special Requirements
                <textarea
                  rows="5"
                  name="special_requirements"
                  placeholder="Vegetarian meals, accessible rooms, slower mornings"
                  value={formData.special_requirements}
                  onChange={handleChange}
                />
              </label>
            </div>

            <Button type="submit" icon={<FiSend />} disabled={loading}>
              {loading ? 'Synthesizing Plan...' : 'Generate AI Plan'}
            </Button>
          </form>

          <aside className="generated-card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ animation: 'spin 1.5s linear infinite', display: 'inline-block', fontSize: '3rem', color: 'var(--accent-blue)', marginBottom: '1rem' }}>
                  <FiCpu />
                </div>
                <h2>Generating Itinerary</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Analyzing preferences, arranging custom routing, and preparing stays...
                </p>
              </div>
            ) : currentPlan ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent-blue)' }}>Current Plan</h3>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPlan(null)}>Clear</Button>
                </div>
                <div style={{ whiteSpace: 'pre-line', fontSize: '0.9rem', lineHeight: '1.6', textAlign: 'left' }}>
                  {currentPlan.itinerary}
                </div>
              </div>
            ) : pastPlans.length > 0 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <FiClock style={{ color: 'var(--text-muted)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Your Generated Outlines</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pastPlans.map((p) => (
                    <details key={p.id} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', outline: 'none' }}>
                        {p.destination} ({p.days} Days - {p.style})
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Generated on {p.created_at}
                        </span>
                      </summary>
                      <div style={{ whiteSpace: 'pre-line', fontSize: '0.85rem', lineHeight: '1.5', marginTop: '0.75rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', color: 'var(--text-main)' }}>
                        {p.plan}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div className="generated-card__icon">
                  <FiInbox />
                </div>
                <h2>No Plan Selected</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Submit the form to generate a dynamic travel plan tailored to your profile.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}

export default AIPlanner;

