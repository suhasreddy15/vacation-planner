import { useMemo, useState } from 'react';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import TripCard from '../../components/TripCard/TripCard.jsx';
import { trips } from '../../data/trips.js';
import './BookTrip.css';

const categories = ['Beach', 'Mountains', 'Adventure', 'Family', 'Honeymoon'];

function BookTrip() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

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
  }, [category, query]);

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

          <div className="trip-grid">
            {filteredTrips.map((trip) => (
              <TripCard trip={trip} key={trip.id} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default BookTrip;
