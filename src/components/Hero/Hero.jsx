import { FiArrowRight, FiCompass } from 'react-icons/fi';
import Button from '../Button/Button.jsx';
import './Hero.css';

function Hero() {
  return (
    <section className="hero">
      <div className="hero__overlay" />
      <div className="container hero__content">
        <div className="hero__badge">
          <FiCompass />
          Organizer trips and AI itineraries in one place
        </div>
        <h1>Explore the World with Confidence</h1>
        <p>Book organizer-planned trips or create your own itinerary with AI.</p>
        <div className="hero__actions">
          <Button to="/dashboard" icon={<FiArrowRight />}>
            Get Started
          </Button>
          <Button to="/book-trip" variant="secondary">
            Explore Trips
          </Button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
