import { FiMapPin, FiClock, FiStar } from 'react-icons/fi';
import Button from '../Button/Button.jsx';
import './TripCard.css';

function TripCard({ trip }) {
  return (
    <article className="trip-card">
      <div className="trip-card__image">
        <img src={trip.image} alt={trip.name} />
        <span>{trip.category}</span>
      </div>
      <div className="trip-card__body">
        <div className="trip-card__top">
          <h3>{trip.name}</h3>
          <strong>{trip.price}</strong>
        </div>
        <div className="trip-card__meta">
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
        <p>{trip.description}</p>
        <div className="trip-card__actions">
          <Button to={`/trip/${trip.id}`}>Book Now</Button>
          <Button to={`/trip/${trip.id}`} variant="outline">
            View Details
          </Button>
        </div>
      </div>
    </article>
  );
}

export default TripCard;
