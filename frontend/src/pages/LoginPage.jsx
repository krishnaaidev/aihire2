import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Mail, Lock, AlertCircle, Briefcase, ChevronDown } from 'lucide-react';

const RECRUITERS = [
  { name: "Dr. Rajesh Sharma", email: "rajesh.ai@aihire.com", field: "AI & Machine Learning" },
  { name: "Priya Patel", email: "priya.cloud@aihire.com", field: "Cloud Architecture & DevOps" },
  { name: "Amit Verma", email: "amit.cyber@aihire.com", field: "Cybersecurity & InfoSec" },
  { name: "Sneha Reddy", email: "sneha.fullstack@aihire.com", field: "Full Stack Web Systems" },
  { name: "Vikram Malhotra", email: "vikram.data@aihire.com", field: "Data Engineering & Big Data" },
  { name: "Ananya Sen", email: "ananya.mobile@aihire.com", field: "Mobile App Development" },
  { name: "Rohit Kapoor", email: "rohit.iot@aihire.com", field: "Embedded Systems & IoT" },
  { name: "Meera Nair", email: "meera.web3@aihire.com", field: "Blockchain & Web3" },
  { name: "Arjun Singhania", email: "arjun.robotics@aihire.com", field: "Robotics & Autonomous Systems" },
  { name: "Pooja Joshi", email: "pooja.frontend@aihire.com", field: "UI/UX & Frontend Design" },
  { name: "Karan Bhatia", email: "karan.sre@aihire.com", field: "Site Reliability & QA" },
  { name: "Dr. Sunita Rao", email: "sunita.healthtech@aihire.com", field: "Bioinformatics & HealthTech" },
  { name: "Devendra Mehta", email: "devendra.fintech@aihire.com", field: "FinTech & Quantitative Trading" },
  { name: "Ritu Aggarwal", email: "ritu.computervision@aihire.com", field: "Computer Vision & Visual AI" },
  { name: "Gaurav Nanda", email: "gaurav.networks@aihire.com", field: "5G & Telecom Networks" },
  { name: "Neha Kulkarni", email: "neha.gamedev@aihire.com", field: "Game Engine & 3D Graphics" },
  { name: "Sandeep Yadav", email: "sandeep.erp@aihire.com", field: "Enterprise ERP Systems" },
  { name: "Shalini Menon", email: "shalini.nlp@aihire.com", field: "NLP & Generative AI" },
  { name: "Tarun Chawla", email: "tarun.avionics@aihire.com", field: "Avionics & Flight Software" },
  { name: "Alok Deshmukh", email: "alok.vlsi@aihire.com", field: "VLSI & Chip Design Verification" }
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
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

  const handleSelectRecruiter = (e) => {
    const selectedEmail = e.target.value;
    if (selectedEmail) {
      setEmail(selectedEmail);
      setPassword('password123');
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

        {/* Quick Recruiter Selector (20 Fields & Branches) */}
        <div className="mb-5 p-3 rounded-xl bg-slate-900/90 border border-slate-700/70">
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            Select Recruiter Profile (20 Domains)
          </label>
          <select
            onChange={handleSelectRecruiter}
            className="w-full bg-slate-800 border border-slate-600 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>-- Choose Recruiter by Branch & Field --</option>
            {RECRUITERS.map((r, i) => (
              <option key={i} value={r.email}>
                {r.name} — {r.field}
              </option>
            ))}
          </select>
        </div>

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
