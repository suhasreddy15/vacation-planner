import { useMemo, useState, useEffect } from 'react';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import TripCard from '../../components/TripCard/TripCard.jsx';
import './BookTrip.css';

const categories = ['Beach', 'Mountains', 'Adventure', 'Family', 'Honeymoon'];

function BookTrip() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTrips() {
      try {
        setLoading(true);
        const response = await fetch('/api/trips');
        if (!response.ok) {
          throw new Error('Failed to load vacation packages.');
        }
        const data = await response.json();
        setTrips(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTrips();
  }, []);

  const filteredTrips = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return trips.filter((trip) => {
      const matchesCategory = category === 'All' || trip.category === category;
      const matchesQuery =
        !normalizedQuery ||
        [trip.name, trip.location, trip.category, trip.description]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, query, trips]);

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Book Trip</h1>
          <p>
            Browse organized vacation packages with practical durations, transparent pricing,
            and destination-rich itineraries.
          </p>
        </div>
      </section>

      <section className="section book-trip-page">
        <div className="container">
          <div className="book-trip-tools">
            <SearchBar value={query} onChange={setQuery} />
            <div className="category-filters" aria-label="Trip categories">
              <button
                className={category === 'All' ? 'active' : ''}
                type="button"
                onClick={() => setCategory('All')}
              >
                All
              </button>
              {categories.map((item) => (
                <button
                  className={category === item ? 'active' : ''}
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Loading curated packages...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--accent-red)' }}>
              Error loading trips: {error}
            </div>
          ) : filteredTrips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              No trips found matching your filters.
            </div>
          ) : (
            <div className="trip-grid">
              {filteredTrips.map((trip) => (
                <TripCard trip={trip} key={trip.id} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default BookTrip;

