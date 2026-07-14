import {
  FiCalendar,
  FiCpu,
  FiCreditCard,
  FiHome,
  FiMap,
  FiShield,
} from 'react-icons/fi';
import Hero from '../../components/Hero/Hero.jsx';
import Button from '../../components/Button/Button.jsx';
import { trips } from '../../data/trips.js';
import './Home.css';

const features = [
  {
    icon: <FiCalendar />,
    title: 'Organized Trips',
    text: 'Choose polished itineraries designed by experienced travel organizers.',
  },
  {
    icon: <FiCpu />,
    title: 'AI Trip Planner',
    text: 'Shape a flexible plan around your destination, dates, pace, and interests.',
  },
  {
    icon: <FiCreditCard />,
    title: 'Budget Planning',
    text: 'Compare trip styles and expected costs before committing to your vacation.',
  },
  {
    icon: <FiHome />,
    title: 'Hotel Suggestions',
    text: 'Find comfortable stays near the best neighborhoods, beaches, and attractions.',
  },
  {
    icon: <FiMap />,
    title: 'Day-wise Itinerary',
    text: 'See each day clearly with activities, transfers, downtime, and local dining ideas.',
  },
  {
    icon: <FiShield />,
    title: 'Secure Booking',
    text: 'Review every trip detail in a calm, transparent booking experience.',
  },
];

function Home() {
  const destinations = trips.slice(0, 4);

  return (
    <>
      <Hero />

      <section className="section destinations">
        <div className="container">
          <div className="section-heading reveal">
            <span>Popular Destinations</span>
            <h2>Trips travelers keep coming back to</h2>
            <p>
              From island mornings to alpine rail journeys, these curated escapes balance
              memorable experiences with a smooth travel rhythm.
            </p>
          </div>

          <div className="destination-grid">
            {destinations.map((trip) => (
              <article className="destination-card reveal" key={trip.id}>
                <img src={trip.image} alt={trip.location} />
                <div className="destination-card__content">
                  <span>{trip.category}</span>
                  <h3>{trip.location}</h3>
                  <p>{trip.duration}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section features">
        <div className="container">
          <div className="section-heading reveal">
            <span>Planning Tools</span>
            <h2>Everything you need before you pack</h2>
            <p>
              VoyageIQ brings organizer expertise, AI-assisted planning, and practical trip
              details into one responsive travel workspace.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card reveal" key={feature.title}>
                <div>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div className="container home-cta__inner">
          <div>
            <span>Ready when you are</span>
            <h2>Start with a package or design your own route.</h2>
          </div>
          <Button to="/dashboard">Open Dashboard</Button>
        </div>
      </section>
    </>
  );
}

export default Home;
