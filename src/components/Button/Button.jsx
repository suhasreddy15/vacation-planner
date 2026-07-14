import { Link } from 'react-router-dom';
import './Button.css';

function Button({ children, to, type = 'button', variant = 'primary', icon, onClick }) {
  const className = `button button-${variant}`;
  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  );

  if (to) {
    return (
      <Link className={className} to={to}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} type={type} onClick={onClick}>
      {content}
    </button>
  );
}

export default Button;
