import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiMenu, FiX, FiMap } from 'react-icons/fi';
import './Navbar.css';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Book Trip', path: '/book-trip' },
  { label: 'AI Planner', path: '/ai-planner' },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="navbar">
      <nav className="container navbar__inner" aria-label="Main navigation">
        <NavLink className="navbar__logo" to="/" onClick={() => setIsOpen(false)}>
          <span>
            <FiMap />
          </span>
          VoyageIQ
        </NavLink>

        <button
          className="navbar__toggle"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>

        <div className={`navbar__links ${isOpen ? 'is-open' : ''}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
