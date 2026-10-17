import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { 
  isFirebaseConfigured, 
  firebaseSignIn, 
  firebaseSignUp, 
  firebaseSignInWithGoogle, 
  firebaseSignOut 
} from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('aihire_token');
    const cachedUser = localStorage.getItem('aihire_user');

    if (token && cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('aihire_user');
      }
    }

    if (token) {
      authApi.getMe()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('aihire_user', JSON.stringify(userData));
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    if (isFirebaseConfigured) {
      try {
        await firebaseSignIn(email, password);
      } catch (fbErr) {
        console.warn('Firebase auth attempt:', fbErr.message);
      }
    }

    const res = await authApi.login(email, password);
    localStorage.setItem('aihire_token', res.access_token);
    localStorage.setItem('aihire_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const register = async (name, email, password, role = 'candidate') => {
    if (isFirebaseConfigured) {
      try {
        await firebaseSignUp(email, password);
      } catch (fbErr) {
        console.warn('Firebase signup attempt:', fbErr.message);
      }
    }

    const res = await authApi.register(name, email, password, role);
    localStorage.setItem('aihire_token', res.access_token);
    localStorage.setItem('aihire_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase Authentication is not configured. Please set your Firebase keys in frontend/.env.');
    }
    const { user: fbUser } = await firebaseSignInWithGoogle();
    
    // Register or sign in against backend using Firebase user details
    const email = fbUser.email;
    const name = fbUser.displayName || email.split('@')[0];
    const password = `google_auth_${fbUser.uid}`;

    try {
      return await login(email, password);
    } catch {
      return await register(name, email, password, 'candidate');
    }
  };

  const logout = () => {
    if (isFirebaseConfigured) {
      firebaseSignOut().catch(() => {});
    }
    localStorage.removeItem('aihire_token');
    localStorage.removeItem('aihire_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
