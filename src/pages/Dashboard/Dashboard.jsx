import { FiCpu, FiGlobe } from 'react-icons/fi';
import DashboardCard from '../../components/DashboardCard/DashboardCard.jsx';
import './Dashboard.css';

function Dashboard() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Welcome back, traveler.</h1>
          <p>
            Choose a ready-to-book organizer package or build a personalized vacation outline
            using the AI planner.
          </p>
        </div>
      </section>

      <section className="section dashboard-page">
        <div className="container dashboard-grid">
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
      </section>
    </>
  );
}

export default Dashboard;
