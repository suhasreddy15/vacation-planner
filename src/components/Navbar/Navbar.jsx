import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiLogIn, FiLogOut, FiMenu, FiUserPlus, FiX, FiMap } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext.jsx';
import './Navbar.css';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Book Trip', path: '/book-trip' },
  { label: 'AI Planner', path: '/ai-planner' },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

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
          <div className="navbar__auth">
            {isAuthenticated ? (
              <>
                <span className="navbar__user">Hi, {currentUser.name.split(' ')[0]}</span>
                <button className="navbar__auth-button" type="button" onClick={handleLogout}>
                  <FiLogOut />
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    isActive ? 'navbar__auth-link active' : 'navbar__auth-link'
                  }
                >
                  <FiLogIn />
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    isActive ? 'navbar__auth-link active' : 'navbar__auth-link'
                  }
                >
                  <FiUserPlus />
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
