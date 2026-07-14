import Button from '../Button/Button.jsx';
import './DashboardCard.css';

function DashboardCard({ title, description, buttonText, to, icon, image, tone }) {
  return (
    <article className={`dashboard-card ${tone}`}>
      <div className="dashboard-card__content">
        <div className="dashboard-card__icon">{icon}</div>
        <h2>{title}</h2>
        <p>{description}</p>
        <Button to={to}>{buttonText}</Button>
      </div>
      <div className="dashboard-card__art">
        <img src={image} alt="" />
      </div>
    </article>
  );
}

export default DashboardCard;
