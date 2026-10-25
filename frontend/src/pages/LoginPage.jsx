import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, loginWithGoogle, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (from !== '/') {
        navigate(from);
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'recruiter') {
        navigate('/recruiter');
      } else {
        navigate('/candidate');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSubmitting(true);
    try {
      const user = await loginWithGoogle();
      if (from !== '/') {
        navigate(from);
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'recruiter') {
        navigate('/recruiter');
      } else {
        navigate('/candidate');
      }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, do not show error
        return;
      }
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        setError(`Domain "${domain}" is not authorized in Firebase yet. To fix this: Go to Firebase Console -> Authentication -> Settings tab -> Authorized Domains -> Add "${domain}".`);
        return;
      }
      setError(err.message || 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-800/60 border border-slate-700/80 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-cyan-500/20 mb-3">
            <Bot className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to AIHire</h2>
          <p className="text-xs text-slate-400 mt-1">Autonomous AI Interview & Evaluation Platform</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50 mt-2"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {isFirebaseConfigured && (
          <div className="mt-4">
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-800/80 px-2 text-slate-400">Or continue with</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-700/50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Sign In with Google (Firebase)
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          New candidate?{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold">
            Create candidate account
          </Link>
        </p>

      </div>
    </div>
  );
}
