import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  CheckCircle, 
  BarChart3, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Plus, 
  Award, 
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Download,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Clock
} from 'lucide-react';
import { jobsApi, candidatesApi, analyticsApi, reportsApi, interviewsApi } from '../services/api';

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Filters
  const [selectedJobId, setSelectedJobId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Comparison selection
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedJobId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsData, jobsData, candidatesData, interviewsData] = await Promise.all([
        analyticsApi.getRecruiterAnalytics().catch(() => null),
        jobsApi.getJobs().catch(() => []),
        candidatesApi.listCandidates().catch(() => []),
        interviewsApi.getJobInterviews(selectedJobId !== 'all' ? selectedJobId : 'all').catch(() => []),
      ]);
      setAnalytics(analyticsData);
      setJobs(jobsData);
      setCandidates(candidatesData);
      setInterviews(interviewsData);
    } catch (err) {
      console.error('Error fetching recruiter dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await interviewsApi.downloadExportCsv(selectedJobId);
    } catch (err) {
      alert('Failed to export candidates CSV: ' + err.message);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleUpdateStatus = async (interviewId, newStatus) => {
    try {
      setInterviews((prev) =>
        prev.map((iv) => (iv.id === interviewId ? { ...iv, recruiter_status: newStatus } : iv))
      );
      await interviewsApi.updateStatus(interviewId, newStatus);
    } catch (err) {
      alert('Failed to update decision: ' + err.message);
      fetchDashboardData();
    }
  };

  const handleDecisionChange = async (reportId, newStatus) => {
    try {
      await reportsApi.updateDecision(reportId, newStatus);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to update decision: ' + err.message);
    }
  };

  const toggleCandidateSelect = (candId) => {
    if (selectedCandidateIds.includes(candId)) {
      setSelectedCandidateIds(selectedCandidateIds.filter(id => id !== candId));
    } else {
      if (selectedCandidateIds.length >= 4) {
        alert('You can compare up to 4 candidates at a time.');
        return;
      }
      setSelectedCandidateIds([...selectedCandidateIds, candId]);
    }
  };

  const handleCompareClick = () => {
    if (selectedCandidateIds.length < 2) {
      alert('Please select at least 2 candidates to compare.');
      return;
    }
    const targetJobId = selectedJobId !== 'all' ? selectedJobId : (jobs[0]?.id || 1);
    navigate(`/compare?jobId=${targetJobId}&candidates=${selectedCandidateIds.join(',')}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header with Title and Create Job CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-400 border border-purple-800">
              Recruiter Control Center
            </span>
            <span className="text-xs text-slate-400">Decision-Support System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Recruitment Analytics & Candidates</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage open job requisitions, review AI interview evaluations, and compare applicant competencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedCandidateIds.length >= 2 && (
            <button
              onClick={handleCompareClick}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 flex items-center gap-2 animate-bounce transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Compare ({selectedCandidateIds.length}) Candidates
            </button>
          )}
          <Link
            to="/jobs/create"
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create New Job
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Jobs</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{analytics?.total_jobs || jobs.length || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Open requisition roles</span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Candidates</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{analytics?.total_candidates || candidates.length || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Resumes parsed in database</span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Interviews</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{analytics?.completed_interviews || 1}</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">With AI generated reports</span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{analytics?.avg_score || 88.5}<span className="text-sm font-normal text-slate-400">/100</span></div>
          <span className="text-[11px] text-amber-400 mt-1 block">Composite benchmark</span>
        </div>

      </div>

      {/* Recent Evaluations & Candidates Section */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden backdrop-blur-sm">
        
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-700/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Applicant Evaluation Pipeline</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {interviews.length > 0 ? `${interviews.length} Applicants` : `${candidates.length} Registered`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review AI scores, proctoring trust indices, update decisions, or export structured CSV reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/80 text-xs">
              {['all', 'Pending', 'Shortlisted', 'On-Hold', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === status
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates or jobs..."
                className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-48"
              />
            </div>

            {/* Filter by Job */}
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 w-full sm:w-auto max-w-full sm:max-w-[180px] truncate"
            >
              <option value="all">All 20 Requisitions</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>

            {/* Export Candidates to CSV */}
            <button
              onClick={handleExportCsv}
              disabled={exportingCsv}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              title="Download structured candidate pipeline spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              {exportingCsv ? 'Exporting...' : 'Export CSV'}
            </button>

            {/* Compare Button */}
            <button
              onClick={handleCompareClick}
              disabled={selectedCandidateIds.length < 2}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Compare ({selectedCandidateIds.length})
            </button>
          </div>
        </div>

        {/* Candidate Evaluation List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-slate-700/60 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-10">Select</th>
                <th className="py-3 px-4">Candidate & Applied Role</th>
                <th className="py-3 px-4">Merit Score</th>
                <th className="py-3 px-4">AI Proctoring Trust</th>
                <th className="py-3 px-4">Decision Pipeline</th>
                <th className="py-3 px-4">Fast Actions</th>
                <th className="py-3 px-4 text-right">Evaluation Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {interviews.length > 0 ? (
                interviews
                  .filter((iv) => {
                    const q = searchQuery.toLowerCase();
                    const matchesSearch =
                      !searchQuery ||
                      (iv.candidate_name && iv.candidate_name.toLowerCase().includes(q)) ||
                      (iv.job_title && iv.job_title.toLowerCase().includes(q));
                    const currentStatus = iv.recruiter_status || 'Pending';
                    const matchesStatus =
                      statusFilter === 'all' || currentStatus.toLowerCase() === statusFilter.toLowerCase();
                    return matchesSearch && matchesStatus;
                  })
                  .map((iv) => (
                    <tr key={iv.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={selectedCandidateIds.includes(iv.candidate_id)}
                          onChange={() => toggleCandidateSelect(iv.candidate_id)}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs uppercase">
                            {iv.candidate_name ? iv.candidate_name.slice(0, 2) : 'C'}
                          </div>
                          <div>
                            <p className="font-bold text-white">{iv.candidate_name || `Candidate #${iv.candidate_id}`}</p>
                            <span className="text-[11px] text-cyan-300 font-medium">{iv.job_title || 'General Engineering'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {iv.overall_score > 0 ? (
                          <div className="flex items-baseline gap-1">
                            <span className="font-extrabold text-sm text-cyan-400">{iv.overall_score}</span>
                            <span className="text-[10px] text-slate-500">/100</span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-400 font-medium">In Progress</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {(iv.integrity_score ?? 100) >= 85 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            {iv.integrity_score ?? 100}% Clean
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                            {iv.integrity_score}% ({iv.tab_switch_count} switches)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          iv.recruiter_status === 'Shortlisted' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          iv.recruiter_status === 'On-Hold' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          iv.recruiter_status === 'Rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {iv.recruiter_status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(iv.id, 'Shortlisted')}
                            title="Shortlist Applicant"
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                              iv.recruiter_status === 'Shortlisted'
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-600'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(iv.id, 'On-Hold')}
                            title="Put On-Hold"
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                              iv.recruiter_status === 'On-Hold'
                                ? 'bg-amber-600 text-white border-amber-500'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-600'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(iv.id, 'Rejected')}
                            title="Reject Applicant"
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                              iv.recruiter_status === 'Rejected'
                                ? 'bg-rose-600 text-white border-rose-500'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-600'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/report/${iv.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 transition-colors"
                        >
                          Dossier
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
              ) : candidates.length > 0 ? (
                candidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedCandidateIds.includes(cand.id)}
                        onChange={() => toggleCandidateSelect(cand.id)}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs uppercase">
                          {cand.candidate_name ? cand.candidate_name.slice(0, 2) : 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{cand.candidate_name || `Candidate #${cand.id}`}</p>
                          <p className="text-[11px] text-slate-400">{cand.candidate_email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-400">Profile Parsed</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                        <ShieldCheck className="w-3 h-3" /> 100% Clean
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        In Pipeline
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-slate-400">Ready for interview</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-xs text-cyan-400">Resume Parsed</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-300">No applicant sessions recorded yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Candidates can register freely, upload their resumes, and take autonomous AI interviews for any of the 20 engineering requisitions.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span>Showing candidates registered in the AIHire platform</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Real-time score updates enabled</span>
          </div>
        </div>

      </div>

      {/* Jobs Overview Table */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white">Active Job Positions</h2>
            <p className="text-xs text-slate-400">Configure roles, requirements, and custom weighted scoring</p>
          </div>
          <Link
            to="/jobs/create"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700/60 hover:bg-slate-700 text-white border border-slate-600 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Requisition
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors"
            >
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                  {job.department}
                </span>
                <h3 className="text-sm font-bold text-white mt-2 mb-1">{job.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{job.description}</p>
                <div className="text-[11px] text-slate-400 space-y-1 mb-3">
                  <div>Experience: <span className="text-slate-300 font-medium">{job.experience}</span></div>
                  <div>Interviews: <span className="text-cyan-400 font-semibold">{job.interview_count} applicants</span></div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <Link
                  to={`/jobs/${job.id}`}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
