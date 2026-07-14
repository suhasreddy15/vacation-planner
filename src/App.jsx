import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Home from './pages/Home/Home.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import BookTrip from './pages/BookTrip/BookTrip.jsx';
import TripDetails from './pages/TripDetails/TripDetails.jsx';
import AIPlanner from './pages/AIPlanner/AIPlanner.jsx';

function App() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-transition" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/book-trip" element={<BookTrip />} />
          <Route path="/trip/:tripId" element={<TripDetails />} />
          <Route path="/ai-planner" element={<AIPlanner />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
