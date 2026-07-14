import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const USERS_KEY = 'voyageiq-users';
const SESSION_KEY = 'voyageiq-session';

function readStorage(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createUserId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => readStorage(USERS_KEY, []));
  const [currentUser, setCurrentUser] = useState(() => readStorage(SESSION_KEY, null));

  useEffect(() => {
    saveStorage(USERS_KEY, users);
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      saveStorage(SESSION_KEY, currentUser);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  const register = ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const userExists = users.some((user) => user.email === normalizedEmail);

    if (userExists) {
      return { ok: false, message: 'An account with this email already exists.' };
    }

    const newUser = {
      id: createUserId(),
      name: name.trim(),
      email: normalizedEmail,
      password,
    };

    setUsers((savedUsers) => [...savedUsers, newUser]);
    setCurrentUser({ id: newUser.id, name: newUser.name, email: newUser.email });
    return { ok: true };
  };

  const login = ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(
      (savedUser) => savedUser.email === normalizedEmail && savedUser.password === password,
    );

    if (!user) {
      return { ok: false, message: 'Please check your email and password.' };
    }

    setCurrentUser({ id: user.id, name: user.name, email: user.email });
    return { ok: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      login,
      logout,
      register,
    }),
    [currentUser, users],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
