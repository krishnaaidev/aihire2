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
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const data = await authApi.login(loginEmail, loginPassword);
      if (data.user.role !== 'admin') {
        throw new Error('Access Denied: This account does not possess Super Admin clearance.');
      }
      login(data.user, data.access_token);
    } catch (err) {
      setLoginError(err.message || 'Invalid Super Admin credentials');
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

          {loginError && (
            <div className="bg-rose-950/50 border border-rose-800 rounded-xl p-3.5 flex items-start gap-3 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Super Admin Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/60 border border-slate-700/80 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-cyan-500/20 shrink-0">
            <Shield className="w-8 h-8 text-cyan-200" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Super Admin Command Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                Tier-1 Authority
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                Hidden Console
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Logged in as <strong className="text-cyan-400">{user?.name}</strong> ({user?.email}) • Central Directory & Telemetry Hub
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadAllAdminData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
          
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            Lock & Exit Console
          </button>
        </div>
      </div>

      {/* Floating Notification Banner */}
      {notification && (
        <div className="bg-emerald-950/80 border border-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Executive Platform Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Candidates</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white">{metrics?.total_candidates ?? candidates.length}</span>
            <span className="text-[11px] text-cyan-400 font-semibold">{metrics?.candidates_with_resume ?? 0} with resume</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Active Recruiters</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-purple-400">{metrics?.total_recruiters ?? recruiters.length}</span>
            <span className="text-[11px] text-slate-400">accounts</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Job Requisitions</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-cyan-400">{metrics?.total_jobs ?? 0}</span>
            <span className="text-[11px] text-emerald-400 font-semibold">{metrics?.active_jobs ?? 0} active</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Interviews</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-400">{metrics?.total_interviews ?? interviews.length}</span>
            <span className="text-[11px] text-emerald-400 font-semibold">{metrics?.completed_interviews ?? 0} done</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Disqualified Malpractice</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-400">{metrics?.cancelled_interviews ?? 0}</span>
            <span className="text-[11px] text-rose-400 font-semibold">proctored</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Integrity Trust Rating</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-indigo-400">{metrics?.avg_integrity_score ?? 100}%</span>
            <span className="text-[11px] text-slate-400">platform-wide</span>
          </div>
        </div>
      </div>

      {/* Main Tab Controller */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'candidates'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          All Candidates Directory ({candidates.length})
        </button>

        <button
          onClick={() => setActiveTab('recruiters')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'recruiters'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          All Recruiters & Jobs ({recruiters.length})
        </button>

        <button
          onClick={() => setActiveTab('interviews')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'interviews'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Interviews & Malpractice Audit ({interviews.length})
        </button>

        <button
          onClick={() => setActiveTab('exports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'exports'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Database CSV Exports
        </button>
      </div>

      {/* -------------------------------------------------------- */}
      {/* TAB 1: ALL CANDIDATES DIRECTORY */}
      {/* -------------------------------------------------------- */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          
          {/* Candidate Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Search candidates by name, email, phone, or specific skills (e.g. Python, SQL, CAD, ML)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={candidateResumeFilter}
                onChange={(e) => setCandidateResumeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Resume: All</option>
                <option value="with_resume">With Uploaded Resume</option>
                <option value="without_resume">Missing Resume</option>
              </select>

              <select
                value={candidateStatusFilter}
                onChange={(e) => setCandidateStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Interview Status: All</option>
                <option value="completed">Completed Interview</option>
                <option value="cancelled">Disqualified (Proctoring)</option>
                <option value="none">Never Interviewed</option>
              </select>

              <button
                onClick={() => handleExportCsv('candidates')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Candidate Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Candidate Profile</th>
                    <th className="py-3 px-3">Contact & Links</th>
                    <th className="py-3 px-3">Resume Status</th>
                    <th className="py-3 px-3">Extracted Skills</th>
                    <th className="py-3 px-3 text-center">Sessions</th>
                    <th className="py-3 px-3 text-center">Avg Merit</th>
                    <th className="py-3 px-4 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-500 text-xs">
                        No candidates match the specified filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((cand) => (
                      <tr key={cand.id} className="hover:bg-slate-800/30 transition-colors">
                        
                        {/* Name & ID */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-xs">{cand.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Cand ID #{cand.id} • User #{cand.user_id}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Joined {cand.created_at ? new Date(cand.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            {cand.email}
                          </div>
                          {cand.phone && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              {cand.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {cand.linkedin_url && (
                              <a href={cand.linkedin_url} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-400 hover:underline">
                                LinkedIn
                              </a>
                            )}
                            {cand.github_url && (
                              <a href={cand.github_url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:underline">
                                GitHub
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Resume Status */}
                        <td className="py-3.5 px-3">
                          {cand.has_resume ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              PDF Parsed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                              <Clock className="w-3 h-3" />
                              Pending Upload
                            </span>
                          )}
                          {cand.resume_filename && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px] mt-1" title={cand.resume_filename}>
                              📄 {cand.resume_filename}
                            </div>
                          )}
                        </td>

                        {/* Skills Chips */}
                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {cand.extracted_skills?.slice(0, 4).map((sk, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {sk}
                              </span>
                            ))}
                            {cand.extracted_skills?.length > 4 && (
                              <span className="text-[10px] text-cyan-400 font-semibold self-center">
                                +{cand.extracted_skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Total & Cancelled Sessions */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="font-bold text-white text-xs">{cand.total_interviews}</div>
                          {cand.cancelled_interviews > 0 && (
                            <span className="text-[10px] text-rose-400 font-semibold block">
                              {cand.cancelled_interviews} disqualified
                            </span>
                          )}
                        </td>

                        {/* Avg Score */}
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-xs">
                          {cand.avg_score !== null ? (
                            <span className={cand.avg_score >= 75 ? 'text-emerald-400' : 'text-amber-400'}>
                              {cand.avg_score}%
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        {/* Action: Open Dossier */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedCandidate(cand)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors"
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
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recruiterSearch}
                onChange={(e) => setRecruiterSearch(e.target.value)}
                placeholder="Search recruiters by name, email, or department..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={() => handleExportCsv('recruiters')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Export Recruiters CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredRecruiters.map((r) => (
              <div key={r.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-base">
                      {r.name[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{r.name}</h3>
                      <p className="text-xs text-slate-400">{r.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950 text-purple-300 border border-purple-800">
                    Recruiter
                  </span>
                </div>

                {/* Recruiter Stats */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Postings</span>
                    <strong className="text-white text-sm">{r.total_jobs}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Applicants</span>
                    <strong className="text-cyan-400 text-sm">{r.total_applicants}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Completed</span>
                    <strong className="text-emerald-400 text-sm">{r.total_completed}</strong>
                  </div>
                </div>

                {/* Requisitions List */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Posted Job Requisitions ({r.jobs.length})
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {r.jobs.map((j) => (
                      <div key={j.id} className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <strong className="text-slate-200 block truncate max-w-xs">{j.title}</strong>
                          <span className="text-[10px] text-slate-400 block">{j.department} • {j.experience}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-bold text-cyan-400">{j.applicant_count} candidates</span>
                          <span className="text-[10px] text-slate-500 block">CTC: {j.salary_range}</span>
                        </div>
                      </div>
                    ))}
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
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={interviewSearch}
                onChange={(e) => setInterviewSearch(e.target.value)}
                placeholder="Search sessions by candidate name, email, job title, or recruiter..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={interviewStatusFilter}
                onChange={(e) => setInterviewStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Session Status: All</option>
                <option value="completed">Completed Successfully</option>
                <option value="cancelled">Disqualified (Proctoring Violation)</option>
                <option value="in_progress">In Progress</option>
              </select>

              <button
                onClick={() => handleExportCsv('interviews')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                Export Interviews CSV
              </button>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Session Info</th>
                    <th className="py-3 px-3">Candidate</th>
                    <th className="py-3 px-3">Target Requisition</th>
                    <th className="py-3 px-3">Session Status</th>
                    <th className="py-3 px-3 text-center">Merit</th>
                    <th className="py-3 px-3 text-center">Integrity</th>
                    <th className="py-3 px-3">Violations Log</th>
                    <th className="py-3 px-4 text-right">Super Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInterviews.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-500 text-xs">
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
                        <tr key={iv.id} className="hover:bg-slate-800/30 transition-colors">
                          
                          {/* Session ID */}
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-bold text-cyan-300">#{iv.id}</span>
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block mt-0.5">
                              {iv.mode} Mode
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {iv.created_at ? new Date(iv.created_at).toLocaleDateString() : ''}
                            </span>
                          </td>

                          {/* Candidate */}
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-white block">{iv.candidate_name}</span>
                            <span className="text-[10px] text-slate-400">{iv.candidate_email}</span>
                          </td>

                          {/* Job Requisition */}
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-slate-200 block truncate max-w-xs">{iv.job_title}</span>
                            <span className="text-[10px] text-slate-500">{iv.job_department}</span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            {iv.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Completed
                              </span>
                            ) : isDisqualified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                                <Ban className="w-3 h-3" /> Disqualified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                                <Clock className="w-3 h-3" /> In Progress
                              </span>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1">
                              Recruiter: <strong>{iv.recruiter_status}</strong>
                            </div>
                          </td>

                          {/* Merit Score */}
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-xs">
                            {iv.status === 'completed' ? (
                              <span className={iv.overall_score >= 70 ? 'text-emerald-400' : 'text-amber-400'}>
                                {iv.overall_score}/100
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>

                          {/* Integrity */}
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-xs">
                            <span className={(iv.integrity_score ?? 100) >= 80 ? 'text-emerald-400' : 'text-rose-400'}>
                              {iv.integrity_score ?? 100}%
                            </span>
                            {iv.tab_switch_count > 0 && (
                              <span className="text-[10px] text-amber-400 block font-normal">
                                {iv.tab_switch_count} tab switches
                              </span>
                            )}
                          </td>

                          {/* Violations Log */}
                          <td className="py-3.5 px-3 max-w-xs">
                            {latestFlag ? (
                              <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-900/60 text-[10px] text-rose-200 leading-snug">
                                <strong className="text-rose-300 block uppercase font-bold text-[9px]">
                                  {latestFlag.type || 'Malpractice'}
                                </strong>
                                {latestFlag.reason}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[10px] italic">Clean Session (Zero Malpractice)</span>
                            )}
                          </td>

                          {/* Admin Actions */}
                          <td className="py-3.5 px-4 text-right space-y-1">
                            {iv.status === 'completed' && (
                              <Link
                                to={`/report/${iv.id}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-colors block text-center"
                              >
                                <Award className="w-3 h-3" /> View Report
                              </Link>
                            )}

                            {isDisqualified && (
                              <button
                                onClick={() => handleLiftDisqualification(iv.id)}
                                disabled={actionLoading}
                                title="Override proctoring disqualification and restore candidate retake permission"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 transition-colors block w-full text-center"
                              >
                                <Unlock className="w-3 h-3 text-emerald-400" /> Lift Disqualification
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteInterview(iv.id)}
                              disabled={actionLoading}
                              className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Candidates Master Export</h3>
              <p className="text-xs text-slate-400 mt-1">
                Full list of all candidate profiles, extracted skills, parsed resumes, contact records, and evaluation averages.
              </p>
            </div>
            <button
              onClick={() => handleExportCsv('candidates')}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Candidates CSV
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Recruiters & Jobs Export</h3>
              <p className="text-xs text-slate-400 mt-1">
                Full roster of recruiters, departmental divisions, posted engineering requisitions, and applicant counts.
              </p>
            </div>
            <button
              onClick={() => handleExportCsv('recruiters')}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Recruiters CSV
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Interview Audit & Telemetry Export</h3>
              <p className="text-xs text-slate-400 mt-1">
                Every interview session, timestamps, merit scores, integrity ratings, proctoring violations, and recruiter decisions.
              </p>
            </div>
            <button
              onClick={() => handleExportCsv('interviews')}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500 text-slate-950 font-black text-xl flex items-center justify-center">
                  {selectedCandidate.name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedCandidate.name}</h2>
                  <p className="text-xs text-slate-400">{selectedCandidate.email} • Candidate ID #{selectedCandidate.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Candidate Metadata Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Phone</span>
                <strong className="text-white mt-0.5 block">{selectedCandidate.phone || 'N/A'}</strong>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Resume</span>
                <strong className="text-emerald-400 mt-0.5 block">{selectedCandidate.has_resume ? 'Uploaded' : 'None'}</strong>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Interviews</span>
                <strong className="text-cyan-400 mt-0.5 block">{selectedCandidate.total_interviews} sessions</strong>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Disqualified</span>
                <strong className="text-rose-400 mt-0.5 block">{selectedCandidate.cancelled_interviews} flagged</strong>
              </div>
            </div>

            {/* Parsed Resume Technical Skills */}
            {selectedCandidate.extracted_skills?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Extracted Technical Competencies ({selectedCandidate.extracted_skills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.extracted_skills.map((sk, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social / Portfolio Links */}
            <div className="flex flex-wrap gap-3 text-xs pt-1">
              {selectedCandidate.linkedin_url && (
                <a href={selectedCandidate.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-cyan-400 hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> LinkedIn Profile
                </a>
              )}
              {selectedCandidate.github_url && (
                <a href={selectedCandidate.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-400 hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> GitHub Profile
                </a>
              )}
              {selectedCandidate.portfolio_url && (
                <a href={selectedCandidate.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-emerald-400 hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> Portfolio
                </a>
              )}
            </div>

            {/* Candidate Interview Sessions History */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Full Session History ({selectedCandidate.interviews?.length || 0})
              </h4>
              {selectedCandidate.interviews?.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No interview sessions attempted yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {selectedCandidate.interviews.map((iv) => (
                    <div key={iv.id} className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm">{iv.job_title}</strong>
                          <span className="font-mono text-cyan-400 text-[10px]">#{iv.id}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">({iv.mode})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Date: {iv.created_at ? new Date(iv.created_at).toLocaleDateString() : 'N/A'} • Status: <span className="font-semibold text-slate-200">{iv.status}</span> • Recruiter: <span className="font-semibold text-cyan-300">{iv.recruiter_status}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-bold font-mono text-white block">
                            Score: {iv.overall_score}/100
                          </span>
                          <span className={`text-[10px] font-mono block ${iv.integrity_score >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Trust: {iv.integrity_score}%
                          </span>
                        </div>

                        {iv.status === 'cancelled' && (
                          <button
                            onClick={() => handleLiftDisqualification(iv.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 transition-colors"
                          >
                            Lift Ban
                          </button>
                        )}

                        {iv.has_report && (
                          <Link
                            to={`/report/${iv.id}`}
                            target="_blank"
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
                          >
                            Report
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
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
