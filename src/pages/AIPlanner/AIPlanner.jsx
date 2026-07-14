import { FiCpu, FiSend } from 'react-icons/fi';
import Button from '../../components/Button/Button.jsx';
import './AIPlanner.css';

function AIPlanner() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>AI Planner</h1>
          <p>
            Enter your destination, budget, pace, and travel preferences to prepare a personalized
            itinerary workspace. This frontend demo does not submit data.
          </p>
        </div>
      </section>

      <section className="section ai-planner-page">
        <div className="container ai-planner-layout">
          <form className="planner-form">
            <div className="form-heading">
              <div>
                <FiCpu />
              </div>
              <div>
                <h2>Build your trip profile</h2>
                <p>Fine-tune the essentials before generating a travel plan.</p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Destination
                <input type="text" placeholder="Santorini, Greece" />
              </label>
              <label>
                Budget
                <input type="text" placeholder="₹1,50,000" />
              </label>
              <label>
                Number of Days
                <input type="number" min="1" placeholder="7" />
              </label>
              <label>
                Number of Travelers
                <input type="number" min="1" placeholder="2" />
              </label>
              <label>
                Travel Style
                <select defaultValue="">
                  <option value="" disabled>
                    Select style
                  </option>
                  <option>Luxury</option>
                  <option>Budget</option>
                  <option>Adventure</option>
                  <option>Family</option>
                  <option>Solo</option>
                </select>
              </label>
              <label>
                Transportation Preference
                <input type="text" placeholder="Train, rental car, private transfers" />
              </label>
              <label>
                Accommodation Type
                <input type="text" placeholder="Boutique hotel, villa, resort" />
              </label>
              <label className="full-span">
                Special Requirements
                <textarea rows="5" placeholder="Vegetarian meals, accessible rooms, slower mornings" />
              </label>
            </div>

            <Button type="button" icon={<FiSend />}>
              Generate AI Plan
            </Button>
          </form>

          <aside className="generated-card">
            <div className="generated-card__icon">
              <FiCpu />
            </div>
            <h2>AI Generated Itinerary</h2>
            <p>Your personalized travel plan will appear here.</p>
          </aside>
        </div>
      </section>
    </>
  );
}

export default AIPlanner;
