import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi, authApi } from '../services/api';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Unlock, 
  RefreshCw, 
  Eye, 
  ExternalLink, 
  Bot, 
  Cpu, 
  Zap, 
  Phone, 
  Mail, 
  Globe, 
  Lock, 
  Ban, 
  UserCheck, 
  Building, 
  Layers, 
  AlertTriangle,
  LogOut,
  Sparkles,
  ChevronRight,
  Clock,
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  // Login Gate States (if not logged in as admin)
  const [loginEmail, setLoginEmail] = useState('admin@aihire.com');
  const [loginPassword, setLoginPassword] = useState('Admin@AIHire2026!');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard Data States
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates' | 'recruiters' | 'interviews' | 'exports'
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [interviews, setInterviews] = useState([]);

  // Search & Filters
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateResumeFilter, setCandidateResumeFilter] = useState('all'); // all, with_resume, without_resume
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('all'); // all, completed, cancelled, none

  const [recruiterSearch, setRecruiterSearch] = useState('');
  const [interviewSearch, setInterviewSearch] = useState('');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState('all'); // all, completed, cancelled, in_progress

  // Candidate Detailed Dossier Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Admin Override States
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState('');

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [metricsData, candsData, recsData, ivsData] = await Promise.all([
        adminApi.getMetrics().catch(() => null),
        adminApi.getCandidates().catch(() => []),
        adminApi.getRecruiters().catch(() => []),
        adminApi.getInterviews().catch(() => []),
      ]);
      setMetrics(metricsData);
      setCandidates(candsData);
      setRecruiters(recsData);
      setInterviews(ivsData);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 5000);
  };

  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const loggedUser = await login(loginEmail, loginPassword);
      if (loggedUser.role !== 'admin') {
        logout();
        throw new Error(`Access Denied: Logged in as ${loggedUser.email} (${loggedUser.role}), but Super Admin clearance is required.`);
      }
      showNotification('Super Admin authorized successfully. Welcome, Suman Krishna!');
    } catch (err) {
      setLoginError(err.message || 'Invalid Super Admin credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setLoginEmail('admin@aihire.com');
    setLoginPassword('Admin@AIHire2026!');
    setLoginLoading(true);
    setLoginError('');
    try {
      const loggedUser = await login('admin@aihire.com', 'Admin@AIHire2026!');
      if (loggedUser.role !== 'admin') {
        logout();
        throw new Error('Access Denied: Account does not possess Super Admin clearance.');
      }
      showNotification('Super Admin authorized successfully!');
    } catch (err) {
      setLoginError(err.message || 'Auto-authorization failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLiftDisqualification = async (interviewId) => {
    if (!window.confirm(`Lift permanent disqualification for Interview #${interviewId}? This will remove the ban and allow the candidate to retake the interview.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminApi.liftDisqualification(interviewId);
      showNotification(res.message);
      await loadAllAdminData();
      if (selectedCandidate) {
        const updatedCand = candidates.find(c => c.id === selectedCandidate.id);
        if (updatedCand) setSelectedCandidate(updatedCand);
      }
    } catch (err) {
      alert('Failed to lift disqualification: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInterview = async (interviewId) => {
    if (!window.confirm(`Delete interview session #${interviewId}? This action is irreversible.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminApi.deleteInterview(interviewId);
      showNotification(res.message);
      await loadAllAdminData();
    } catch (err) {
      alert('Failed to delete interview: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = async (entity) => {
    try {
      await adminApi.downloadExportCsv(entity);
      showNotification(`Successfully exported all ${entity} records as CSV.`);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // RENDER SECRET LOGIN GATE (If not authenticated as admin)
  // -------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/90 border border-slate-700/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20 mx-auto">
              <Shield className="w-8 h-8 text-cyan-200" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-800">
              <Lock className="w-3 h-3 text-rose-400" />
              Restricted Gateway • Clearance Required
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">AIHire Super Admin</h1>
            <p className="text-xs text-slate-400">
              Internal Command Center. Please verify your Super Admin identity to inspect candidates, recruiters, and platform telemetry.
            </p>
          </div>

          {user && user.role !== 'admin' && (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 text-[11px] text-slate-300 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-400 block text-[10px]">Current Active Session:</span>
                <span className="font-semibold text-white">{user.email}</span>
                <span className="ml-1 text-[10px] uppercase font-bold text-cyan-400">({user.role})</span>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
              >
                Log Out
              </button>
            </div>
          )}

          {loginError && (
            <div className="bg-rose-950/50 border border-rose-800 rounded-xl p-3.5 flex items-start gap-3 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleQuickAdminLogin}
            disabled={loginLoading}
            className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/10"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            1-Click Super Admin Access (Suman Krishna)
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold absolute">
              or enter credentials
            </span>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                Admin Master Email / ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="admin@aihire.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                Admin Master Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loginLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Verifying Clearance...
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  Authorize & Access Console
                </>
              )}
            </button>
          </form>

          {/* Seed credentials hint for Suman Krishna */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1.5 text-slate-400">
            <span className="font-bold text-slate-300 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Pre-Configured Super Admin Credentials:
            </span>
            <div className="font-mono text-cyan-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              ID: admin@aihire.com
            </div>
            <div className="font-mono text-cyan-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              Password: Admin@AIHire2026!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // CANDIDATE FILTERING LOGIC
  // -------------------------------------------------------------
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.phone.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      (c.extracted_skills && c.extracted_skills.some(s => s.toLowerCase().includes(candidateSearch.toLowerCase())));

    const matchesResume = 
      candidateResumeFilter === 'all' ||
      (candidateResumeFilter === 'with_resume' && c.has_resume) ||
      (candidateResumeFilter === 'without_resume' && !c.has_resume);

    const matchesStatus = 
      candidateStatusFilter === 'all' ||
      (candidateStatusFilter === 'completed' && c.completed_interviews > 0) ||
      (candidateStatusFilter === 'cancelled' && c.cancelled_interviews > 0) ||
      (candidateStatusFilter === 'none' && c.total_interviews === 0);

    return matchesSearch && matchesResume && matchesStatus;
  });

  // -------------------------------------------------------------
  // RECRUITER FILTERING LOGIC
  // -------------------------------------------------------------
  const filteredRecruiters = recruiters.filter((r) => {
    return (
      r.name.toLowerCase().includes(recruiterSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(recruiterSearch.toLowerCase()) ||
      r.jobs.some(j => j.title.toLowerCase().includes(recruiterSearch.toLowerCase()))
    );
  });

  // -------------------------------------------------------------
  // INTERVIEW AUDIT FILTERING LOGIC
  // -------------------------------------------------------------
  const filteredInterviews = interviews.filter((iv) => {
    const matchesSearch =
      iv.candidate_name.toLowerCase().includes(interviewSearch.toLowerCase()) ||
      iv.candidate_email.toLowerCase().includes(interviewSearch.toLowerCase()) ||
      iv.job_title.toLowerCase().includes(interviewSearch.toLowerCase()) ||
      iv.recruiter_name.toLowerCase().includes(interviewSearch.toLowerCase());

    const matchesStatus =
      interviewStatusFilter === 'all' ||
      (interviewStatusFilter === 'completed' && iv.status === 'completed') ||
      (interviewStatusFilter === 'cancelled' && iv.status === 'cancelled') ||
      (interviewStatusFilter === 'in_progress' && (iv.status === 'in_progress' || iv.status === 'scheduled'));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      
      {/* Super Admin Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/70 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20 shrink-0">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-200" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Super Admin Command Center
              </h1>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm">
                Tier-1 Authority
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-950 text-rose-300 border border-rose-800 shadow-sm">
                Confidential Console
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              Clearance: <strong className="text-cyan-400 font-semibold">{user?.name || 'Suman Krishna'}</strong> ({user?.email}) • Central Directory & Integrity Telemetry Hub
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
              <span>Platform: <strong className="text-slate-200">AIHire Enterprise</strong></span>
              <span>•</span>
              <span>Project Lead: <strong className="text-cyan-300">Suman Krishna</strong> (Roll: 2301275)</span>
              <span>•</span>
              <span>Mentor: <strong className="text-slate-300">Er. Sukhdayal</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={loadAllAdminData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all shadow-md hover:border-slate-600"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
          
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 flex items-center gap-2 transition-all shadow-md"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            Lock & Exit Console
          </button>
        </div>
      </div>

      {/* Floating Notification Banner */}
      {notification && (
        <div className="bg-emerald-950/90 border border-emerald-700/80 p-4 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs sm:text-sm font-medium shadow-xl animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Executive Platform Metrics - Tier 1: Core Volume Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Platform Volume & Directory Operations
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">Live Real-time Telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Candidates */}
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 sm:p-6 shadow-xl transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Candidates</span>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {metrics?.total_candidates ?? candidates.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">registered profiles</span>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                {metrics?.candidates_with_resume ?? 0} Resumes Parsed
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                {candidates.filter(c => c.total_interviews > 0).length} evaluated
              </span>
            </div>
          </div>

          {/* Card 2: Active Recruiters */}
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 sm:p-6 shadow-xl transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Hiring Teams & Recruiters</span>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-purple-300 tracking-tight">
                {metrics?.total_recruiters ?? recruiters.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">verified accounts</span>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                {recruiters.reduce((acc, r) => acc + (r.jobs?.length || 0), 0)} Requisitions
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                {recruiters.reduce((acc, r) => acc + (r.total_applicants || 0), 0)} applicants
              </span>
            </div>
          </div>

          {/* Card 3: Job Requisitions */}
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-xl transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Job Openings</span>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-300 tracking-tight">
                {metrics?.total_jobs ?? 0}
              </span>
              <span className="text-xs text-slate-400 font-medium">engineering roles</span>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {metrics?.active_jobs ?? 0} Active Requisitions
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                Accepting CVs
              </span>
            </div>
          </div>

          {/* Card 4: Total Interviews */}
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 sm:p-6 shadow-xl transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">AI Interview Sessions</span>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-blue-300 tracking-tight">
                {metrics?.total_interviews ?? interviews.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">total sessions</span>
            </div>
            <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                {metrics?.completed_interviews ?? 0} Completed & Scored
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                {interviews.filter(i => i.status === 'in_progress').length} in progress
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Platform Metrics - Tier 2: AI Trust & Proctoring Telemetry */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            AI Proctoring, Merit Benchmarks & Anti-Cheat Audit
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">Zero-Tolerance Auto-Cancellation Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Integrity Trust Rating */}
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                    Integrity Trust Rating
                  </h3>
                  <span className="text-[10px] text-slate-500 block">Platform Anti-Cheat Score</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                Enterprise
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                {metrics?.avg_integrity_score ?? 100}%
              </span>
              <span className="text-xs text-slate-400">clean compliance index</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time multi-modal monitoring: tab switch detection, unauthorized phone object detection, and gaze absence enforcement.
            </p>
          </div>

          {/* System Merit Average */}
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                    System Merit Average
                  </h3>
                  <span className="text-[10px] text-slate-500 block">Candidate Evaluation Score</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                AI Evaluated
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                {metrics?.avg_score ?? (interviews.length ? Math.round(interviews.reduce((a,c) => a + (c.overall_score || 0), 0) / (interviews.filter(i => i.overall_score).length || 1)) : 81)}%
              </span>
              <span className="text-xs text-slate-400">mean composite score</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Weighted assessment of technical problem-solving depth, communication clarity, and resume-matched competency answers.
            </p>
          </div>

          {/* Disqualified Malpractice */}
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                    Proctoring Disqualifications
                  </h3>
                  <span className="text-[10px] text-slate-500 block">Malpractice Sessions Terminated</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800">
                Auto-Banned
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-rose-400 font-mono">
                {metrics?.cancelled_interviews ?? 0}
              </span>
              <span className="text-xs text-slate-400">flagged sessions</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Permanent bans triggered for mobile phone detection or 3 face absence warnings. Super Admin holds override clearance.
            </p>
          </div>
        </div>
      </div>

      {/* Main Tab Controller */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap ${
            activeTab === 'candidates'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80 bg-slate-900/60 border border-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          All Candidates Directory ({candidates.length})
        </button>

        <button
          onClick={() => setActiveTab('recruiters')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap ${
            activeTab === 'recruiters'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80 bg-slate-900/60 border border-slate-800/60'
          }`}
        >
          <Building className="w-4 h-4" />
          All Recruiters & Requisitions ({recruiters.length})
        </button>

        <button
          onClick={() => setActiveTab('interviews')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap ${
            activeTab === 'interviews'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80 bg-slate-900/60 border border-slate-800/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Interviews & Malpractice Audit ({interviews.length})
        </button>

        <button
          onClick={() => setActiveTab('exports')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap ${
            activeTab === 'exports'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80 bg-slate-900/60 border border-slate-800/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Database CSV Exports
        </button>
      </div>

      {/* -------------------------------------------------------- */}
      {/* -------------------------------------------------------- */}
      {/* TAB 1: ALL CANDIDATES DIRECTORY */}
      {/* -------------------------------------------------------- */}
      {activeTab === 'candidates' && (
        <div className="space-y-5">
          
          {/* Candidate Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Search candidates by name, email, phone, or specific technical competencies (e.g. Python, SQL, CAD, React)..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={candidateResumeFilter}
                onChange={(e) => setCandidateResumeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 min-w-[190px]"
              >
                <option value="all">Resume: All Candidates</option>
                <option value="with_resume">With Uploaded Resume</option>
                <option value="without_resume">Missing Resume</option>
              </select>

              <select
                value={candidateStatusFilter}
                onChange={(e) => setCandidateStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 min-w-[200px]"
              >
                <option value="all">Interview Status: All</option>
                <option value="completed">Completed Interview</option>
                <option value="cancelled">Disqualified (Proctoring)</option>
                <option value="none">Never Interviewed</option>
              </select>

              <button
                onClick={() => handleExportCsv('candidates')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all whitespace-nowrap shadow-sm hover:border-slate-600"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Candidate Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-5">Candidate Profile</th>
                    <th className="py-4 px-4">Contact & Links</th>
                    <th className="py-4 px-4">Resume Status</th>
                    <th className="py-4 px-4">Extracted Skills</th>
                    <th className="py-4 px-4 text-center">Sessions</th>
                    <th className="py-4 px-4 text-center">Avg Merit</th>
                    <th className="py-4 px-5 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-500 text-xs sm:text-sm">
                        No candidates match the specified filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((cand) => (
                      <tr key={cand.id} className="hover:bg-slate-800/40 transition-colors">
                        
                        {/* Name & ID */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/10">
                              {cand.name ? cand.name[0] : 'C'}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs sm:text-sm">{cand.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">Cand ID #{cand.id} • User #{cand.user_id}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Joined {cand.created_at ? new Date(cand.created_at).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[180px]">{cand.email}</span>
                          </div>
                          {cand.phone && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-1">
                              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{cand.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            {cand.linkedin_url && (
                              <a href={cand.linkedin_url} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-400 hover:underline inline-flex items-center gap-0.5">
                                <ExternalLink className="w-2.5 h-2.5" /> LinkedIn
                              </a>
                            )}
                            {cand.github_url && (
                              <a href={cand.github_url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:underline inline-flex items-center gap-0.5">
                                <ExternalLink className="w-2.5 h-2.5" /> GitHub
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Resume Status */}
                        <td className="py-4 px-4">
                          {cand.has_resume ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              PDF Parsed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              Pending Upload
                            </span>
                          )}
                          {cand.resume_filename && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[160px] mt-1.5" title={cand.resume_filename}>
                              📄 {cand.resume_filename}
                            </div>
                          )}
                        </td>

                        {/* Skills Chips */}
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {cand.extracted_skills?.slice(0, 4).map((sk, idx) => (
                              <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/80 font-medium">
                                {sk}
                              </span>
                            ))}
                            {cand.extracted_skills?.length > 4 && (
                              <span className="text-[10px] text-cyan-400 font-bold self-center px-1">
                                +{cand.extracted_skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Total & Cancelled Sessions */}
                        <td className="py-4 px-4 text-center">
                          <div className="font-extrabold text-white text-sm">{cand.total_interviews}</div>
                          {cand.cancelled_interviews > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-bold mt-0.5 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-900">
                              <Ban className="w-2.5 h-2.5" /> {cand.cancelled_interviews} disqualified
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 block">clean session</span>
                          )}
                        </td>

                        {/* Avg Score */}
                        <td className="py-4 px-4 text-center font-mono font-bold text-xs">
                          {cand.avg_score !== null ? (
                            <span className={`px-2.5 py-1 rounded-lg border text-xs ${
                              cand.avg_score >= 75 
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' 
                                : 'bg-amber-950/60 text-amber-400 border-amber-800'
                            }`}>
                              {cand.avg_score}%
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        {/* Action: Open Dossier */}
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => setSelectedCandidate(cand)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all shadow-sm hover:border-cyan-400"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Full Dossier
                          </button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 2: RECRUITERS & REQUISITIONS */}
      {/* -------------------------------------------------------- */}
      {activeTab === 'recruiters' && (
        <div className="space-y-5">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recruiterSearch}
                onChange={(e) => setRecruiterSearch(e.target.value)}
                placeholder="Search recruiters by name, email, department, or open job titles..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={() => handleExportCsv('recruiters')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all whitespace-nowrap shadow-sm hover:border-slate-600"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Export Recruiters CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecruiters.map((r) => (
              <div key={r.id} className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-6 space-y-4 shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-purple-500/20">
                        {r.name ? r.name[0] : 'R'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{r.name}</h3>
                        <p className="text-xs text-slate-400">{r.email}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-purple-950 text-purple-300 border border-purple-800">
                      Recruiter
                    </span>
                  </div>

                  {/* Recruiter Stats */}
                  <div className="grid grid-cols-3 gap-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Postings</span>
                      <strong className="text-white text-base mt-0.5 block">{r.total_jobs}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Applicants</span>
                      <strong className="text-cyan-400 text-base mt-0.5 block">{r.total_applicants}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Completed</span>
                      <strong className="text-emerald-400 text-base mt-0.5 block">{r.total_completed}</strong>
                    </div>
                  </div>

                  {/* Requisitions List */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                      Posted Job Requisitions ({r.jobs.length})
                    </span>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {r.jobs.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic py-2">No active job requisitions posted yet.</p>
                      ) : (
                        r.jobs.map((j) => (
                          <div key={j.id} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs hover:border-slate-600 transition-colors">
                            <div className="space-y-0.5">
                              <strong className="text-slate-200 block truncate max-w-[200px]">{j.title}</strong>
                              <span className="text-[10px] text-slate-400 block">{j.department} • {j.experience}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[11px] font-bold text-cyan-400 block">{j.applicant_count} candidates</span>
                              <span className="text-[10px] text-slate-500 block">CTC: {j.salary_range}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 3: INTERVIEW & MALPRACTICE AUDIT HUB */}
      {/* -------------------------------------------------------- */}
      {activeTab === 'interviews' && (
        <div className="space-y-5">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={interviewSearch}
                onChange={(e) => setInterviewSearch(e.target.value)}
                placeholder="Search sessions by candidate name, email, job title, or recruiter..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={interviewStatusFilter}
                onChange={(e) => setInterviewStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 min-w-[220px]"
              >
                <option value="all">Session Status: All</option>
                <option value="completed">Completed Successfully</option>
                <option value="cancelled">Disqualified (Proctoring Violation)</option>
                <option value="in_progress">In Progress</option>
              </select>

              <button
                onClick={() => handleExportCsv('interviews')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all whitespace-nowrap shadow-sm hover:border-slate-600"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                Export Interviews CSV
              </button>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-5">Session Info</th>
                    <th className="py-4 px-4">Candidate</th>
                    <th className="py-4 px-4">Target Requisition</th>
                    <th className="py-4 px-4">Session Status</th>
                    <th className="py-4 px-4 text-center">Merit</th>
                    <th className="py-4 px-4 text-center">Integrity</th>
                    <th className="py-4 px-4">Violations Log</th>
                    <th className="py-4 px-5 text-right">Super Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInterviews.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-slate-500 text-xs sm:text-sm">
                        No interview records match the filter query.
                      </td>
                    </tr>
                  ) : (
                    filteredInterviews.map((iv) => {
                      const isDisqualified = iv.status === 'cancelled';
                      const latestFlag = iv.proctoring_flags?.length > 0 
                        ? iv.proctoring_flags[iv.proctoring_flags.length - 1] 
                        : null;

                      return (
                        <tr key={iv.id} className="hover:bg-slate-800/40 transition-colors">
                          
                          {/* Session ID */}
                          <td className="py-4 px-5 font-mono">
                            <span className="font-bold text-cyan-300">#{iv.id}</span>
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block mt-0.5">
                              {iv.mode} Mode
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {iv.created_at ? new Date(iv.created_at).toLocaleDateString() : ''}
                            </span>
                          </td>

                          {/* Candidate */}
                          <td className="py-4 px-4">
                            <span className="font-bold text-white block text-xs sm:text-sm">{iv.candidate_name}</span>
                            <span className="text-[10px] text-slate-400">{iv.candidate_email}</span>
                          </td>

                          {/* Job Requisition */}
                          <td className="py-4 px-4">
                            <span className="font-semibold text-slate-200 block truncate max-w-xs">{iv.job_title}</span>
                            <span className="text-[10px] text-slate-500">{iv.job_department}</span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {iv.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed
                              </span>
                            ) : isDisqualified ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800 shadow-sm shadow-rose-950">
                                <Ban className="w-3.5 h-3.5 text-rose-400" /> Disqualified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                                <Clock className="w-3.5 h-3.5 text-amber-400" /> In Progress
                              </span>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1">
                              Recruiter: <strong className="text-slate-300">{iv.recruiter_status}</strong>
                            </div>
                          </td>

                          {/* Merit Score */}
                          <td className="py-4 px-4 text-center font-mono font-bold text-xs">
                            {iv.status === 'completed' ? (
                              <span className={`px-2.5 py-1 rounded-lg border text-xs ${
                                iv.overall_score >= 70 
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' 
                                  : 'bg-amber-950/60 text-amber-400 border-amber-800'
                              }`}>
                                {iv.overall_score}/100
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>

                          {/* Integrity */}
                          <td className="py-4 px-4 text-center font-mono font-bold text-xs">
                            <span className={`px-2.5 py-1 rounded-lg border text-xs block ${
                              (iv.integrity_score ?? 100) >= 80 
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' 
                                : 'bg-rose-950/60 text-rose-400 border-rose-800'
                            }`}>
                              {iv.integrity_score ?? 100}%
                            </span>
                            {iv.tab_switch_count > 0 && (
                              <span className="text-[10px] text-amber-400 block font-normal mt-1">
                                {iv.tab_switch_count} tab switches
                              </span>
                            )}
                          </td>

                          {/* Violations Log */}
                          <td className="py-4 px-4 max-w-xs">
                            {latestFlag ? (
                              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-900/80 text-[10px] text-rose-200 leading-snug shadow-sm">
                                <strong className="text-rose-300 block uppercase font-bold text-[9px] flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  {latestFlag.type || 'Malpractice'}
                                </strong>
                                <span className="mt-0.5 block">{latestFlag.reason}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">Clean Session (Zero Malpractice)</span>
                            )}
                          </td>

                          {/* Admin Actions */}
                          <td className="py-4 px-5 text-right space-y-1.5">
                            {iv.status === 'completed' && (
                              <Link
                                to={`/report/${iv.id}`}
                                target="_blank"
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-colors w-full"
                              >
                                <Award className="w-3 h-3" /> View Report
                              </Link>
                            )}

                            {isDisqualified && (
                              <button
                                onClick={() => handleLiftDisqualification(iv.id)}
                                disabled={actionLoading}
                                title="Override proctoring disqualification and restore candidate retake permission"
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-950/90 text-emerald-300 hover:bg-emerald-900 border border-emerald-700 transition-colors w-full shadow-sm"
                              >
                                <Unlock className="w-3 h-3 text-emerald-400" /> Lift Disqualification
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteInterview(iv.id)}
                              disabled={actionLoading}
                              className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors block w-full text-center py-0.5"
                            >
                              Delete Session
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* TAB 4: DATABASE CSV EXPORTS */}
      {/* -------------------------------------------------------- */}
      {activeTab === 'exports' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 space-y-5 shadow-xl hover:border-cyan-500/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Candidates Master Export</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Full list of all candidate profiles, extracted skills, parsed resumes, contact records, and evaluation averages.
              </p>
            </div>
            <button
              onClick={() => handleExportCsv('candidates')}
              className="w-full py-3 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Candidates CSV
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 space-y-5 shadow-xl hover:border-purple-500/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Building className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Recruiters & Jobs Export</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Full roster of recruiters, departmental divisions, posted engineering requisitions, and applicant counts.
              </p>
            </div>
            <button
              onClick={() => handleExportCsv('recruiters')}
              className="w-full py-3 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Recruiters CSV
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 space-y-5 shadow-xl hover:border-indigo-500/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Interview Audit & Telemetry Export</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Every interview session, timestamps, merit scores, integrity ratings, proctoring violations, and recruiter decisions.
              </p>
            </div>
            <button
              onClick={() => handleExportCsv('interviews')}
              className="w-full py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Interviews CSV
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* CANDIDATE DEEP-DIVE DOSSIER MODAL */}
      {/* -------------------------------------------------------- */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full p-6 sm:p-9 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-5 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  {selectedCandidate.name ? selectedCandidate.name[0] : 'C'}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{selectedCandidate.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedCandidate.email} • Candidate ID #{selectedCandidate.id} • User #{selectedCandidate.user_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Candidate Metadata Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/70">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Contact Phone</span>
                <strong className="text-white text-sm mt-1 block truncate">{selectedCandidate.phone || 'Not Specified'}</strong>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/70">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Resume File</span>
                <strong className="text-emerald-400 text-sm mt-1 block truncate">
                  {selectedCandidate.has_resume ? (selectedCandidate.resume_filename || 'PDF Uploaded') : 'No Resume'}
                </strong>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/70">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Total Sessions</span>
                <strong className="text-cyan-400 text-sm mt-1 block">{selectedCandidate.total_interviews} attempted</strong>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/70">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Disqualified</span>
                <strong className={`text-sm mt-1 block ${selectedCandidate.cancelled_interviews > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedCandidate.cancelled_interviews > 0 ? `${selectedCandidate.cancelled_interviews} flagged` : 'Clean Record'}
                </strong>
              </div>
            </div>

            {/* Parsed Resume Technical Skills */}
            {selectedCandidate.extracted_skills?.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Extracted Technical Competencies ({selectedCandidate.extracted_skills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.extracted_skills.map((sk, idx) => (
                    <span key={idx} className="text-xs px-3 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-medium">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social / Portfolio Links */}
            <div className="flex flex-wrap gap-3 text-xs pt-1">
              {selectedCandidate.linkedin_url && (
                <a href={selectedCandidate.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-slate-700 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> LinkedIn Profile
                </a>
              )}
              {selectedCandidate.github_url && (
                <a href={selectedCandidate.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-indigo-400 hover:bg-slate-700 border border-slate-700 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> GitHub Profile
                </a>
              )}
              {selectedCandidate.portfolio_url && (
                <a href={selectedCandidate.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Portfolio
                </a>
              )}
            </div>

            {/* Candidate Interview Sessions History */}
            <div className="space-y-3.5 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Full Session History ({selectedCandidate.interviews?.length || 0})
              </h4>
              {selectedCandidate.interviews?.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No interview sessions attempted yet.</p>
              ) : (
                <div className="space-y-3">
                  {selectedCandidate.interviews.map((iv) => (
                    <div key={iv.id} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <strong className="text-white text-sm">{iv.job_title}</strong>
                          <span className="font-mono text-cyan-400 text-xs font-semibold">#{iv.id}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">({iv.mode})</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Date: {iv.created_at ? new Date(iv.created_at).toLocaleDateString() : 'N/A'} • Status: <span className="font-semibold text-slate-200">{iv.status}</span> • Recruiter: <span className="font-semibold text-cyan-300">{iv.recruiter_status}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-black font-mono text-white block">
                            Score: {iv.overall_score}/100
                          </span>
                          <span className={`text-[11px] font-mono block font-semibold ${iv.integrity_score >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Trust: {iv.integrity_score}%
                          </span>
                        </div>

                        {iv.status === 'cancelled' && (
                          <button
                            onClick={() => handleLiftDisqualification(iv.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 transition-colors flex items-center gap-1.5"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Lift Ban
                          </button>
                        )}

                        {iv.has_report && (
                          <Link
                            to={`/report/${iv.id}`}
                            target="_blank"
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                          >
                            <Award className="w-3.5 h-3.5" /> Report
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
