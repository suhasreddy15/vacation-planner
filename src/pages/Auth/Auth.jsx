import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FiLock, FiMail, FiUser, FiUserPlus } from 'react-icons/fi';
import Button from '../../components/Button/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './Auth.css';

function Auth({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, login, register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const redirectTo = location.state?.from || '/dashboard';

  if (currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isRegister && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const result = isRegister
      ? register(formData)
      : login({ email: formData.email, password: formData.password });

    if (!result.ok) {
      setError(result.message);
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  return (
    <section className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual__content">
          <span>VoyageIQ Access</span>
          <h1>{isRegister ? 'Create your travel account' : 'Welcome back to your trips'}</h1>
          <p>
            Save planned vacations, explore organizer packages, and keep your AI itinerary
            workspace ready for the next destination.
          </p>
        </div>
      </div>

      <div className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card__icon">{isRegister ? <FiUserPlus /> : <FiLock />}</div>
          <h2>{isRegister ? 'Create account' : 'Login'}</h2>
          <p>
            {isRegister
              ? 'Start planning smarter vacations with a private profile.'
              : 'Enter your details to continue planning your vacation.'}
          </p>

          {isRegister && (
            <label>
              Full Name
              <span>
                <FiUser />
                <input
                  required
                  name="name"
                  type="text"
                  placeholder="Suhas Reddy"
                  value={formData.name}
                  onChange={updateField}
                />
              </span>
            </label>
          )}

          <label>
            Email Address
            <span>
              <FiMail />
              <input
                required
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={updateField}
              />
            </span>
          </label>

          <label>
            Password
            <span>
              <FiLock />
              <input
                required
                name="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={updateField}
              />
            </span>
          </label>

          {isRegister && (
            <label>
              Confirm Password
              <span>
                <FiLock />
                <input
                  required
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={updateField}
                />
              </span>
            </label>
          )}

          {error && <div className="auth-error">{error}</div>}

          <Button type="submit">{isRegister ? 'Create Account' : 'Login'}</Button>

          <div className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New to VoyageIQ?'}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Login' : 'Create account'}
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

export default Auth;
