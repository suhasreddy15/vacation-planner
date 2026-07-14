import { useParams } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiMapPin, FiStar } from 'react-icons/fi';
import Button from '../../components/Button/Button.jsx';
import { getTripById } from '../../data/trips.js';
import './TripDetails.css';

const included = ['Hotel', 'Food', 'Transport', 'Guide'];

function TripDetails() {
  const { tripId } = useParams();
  const trip = getTripById(tripId);

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

            <div className="details-block">
              <h2>Image Gallery</h2>
              <div className="gallery-grid">
                {trip.gallery.map((image) => (
                  <img src={image} alt={`${trip.name} gallery`} key={image} />
                ))}
              </div>
            </div>

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

            <div className="details-block">
              <h2>Day-wise Itinerary</h2>
              <div className="itinerary-list">
                {trip.itinerary.map((day, index) => (
                  <article key={day}>
                    <span>Day {index + 1}</span>
                    <p>{day}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <aside className="booking-panel">
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
            <Button>Book Now</Button>
          </aside>
        </div>
      </section>
    </>
  );
}

export default TripDetails;
