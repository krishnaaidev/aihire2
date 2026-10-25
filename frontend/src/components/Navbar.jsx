import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, 
  Briefcase, 
  UserCheck, 
  Users, 
  FileText, 
  LogOut, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  AIHire
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  AI 2.0
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block -mt-0.5">
                Autonomous Interview & Candidate Evaluation
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/jobs"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                isActive('/jobs')
                  ? 'bg-slate-800 text-cyan-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Job Openings
            </Link>

            {(!user || user.role === 'candidate') && (
              <>
                <Link
                  to="/candidate"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive('/candidate') && !location.search.includes('tab=profile')
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  AI Interviews
                </Link>
                <Link
                  to="/candidate?tab=profile"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive('/candidate') && location.search.includes('tab=profile')
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Candidate Profile & History
                </Link>
              </>
            )}

            {user && (user.role === 'recruiter' || user.role === 'admin') && (
              <>
                <Link
                  to="/recruiter"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive('/recruiter')
                      ? 'bg-slate-800 text-purple-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Recruiter Dashboard
                </Link>
                <Link
                  to="/compare"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive('/compare')
                      ? 'bg-slate-800 text-purple-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Candidate Comparison
                </Link>
              </>
            )}
          </div>

          {/* Desktop User profile & actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</p>
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${
                      user.role === 'recruiter' ? 'text-purple-400' : 'text-cyan-400'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-full transition-colors ml-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1"
                >
                  Get Started
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: User Icon + Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                {user.name ? user.name[0] : 'U'}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none border border-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          {user && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{user.name}</p>
                  <p className="text-[10px] text-cyan-400 uppercase font-semibold">{user.role} Account</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}

          <div className="space-y-1">
            <Link
              to="/jobs"
              className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                isActive('/jobs')
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-800'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>Job Openings</span>
            </Link>

            {(!user || user.role === 'candidate') && (
              <>
                <Link
                  to="/candidate"
                  className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                    isActive('/candidate') && !location.search.includes('tab=profile')
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-800'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span>AI Interviews & Matched Jobs</span>
                </Link>
                <Link
                  to="/candidate?tab=profile"
                  className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                    isActive('/candidate') && location.search.includes('tab=profile')
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-800'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>Candidate Profile & History</span>
                </Link>
                <Link
                  to="/upload-resume"
                  className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2.5"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Upload / Update Resume</span>
                </Link>
              </>
            )}

            {user && (user.role === 'recruiter' || user.role === 'admin') && (
              <>
                <Link
                  to="/recruiter"
                  className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                    isActive('/recruiter')
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-800'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Recruiter Dashboard</span>
                </Link>
                <Link
                  to="/compare"
                  className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                    isActive('/compare')
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-800'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Candidate Comparison</span>
                </Link>
              </>
            )}
          </div>

          {!user && (
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                className="py-2.5 text-center text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="py-2.5 text-center text-xs font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl shadow-md shadow-cyan-500/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
