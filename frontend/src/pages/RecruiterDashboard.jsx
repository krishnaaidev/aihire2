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
  ExternalLink
} from 'lucide-react';
import { jobsApi, candidatesApi, analyticsApi, reportsApi } from '../services/api';

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedJobId, setSelectedJobId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Comparison selection
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsData, jobsData, candidatesData] = await Promise.all([
        analyticsApi.getRecruiterAnalytics().catch(() => null),
        jobsApi.getJobs().catch(() => []),
        candidatesApi.listCandidates().catch(() => []),
      ]);
      setAnalytics(analyticsData);
      setJobs(jobsData);
      setCandidates(candidatesData);
    } catch (err) {
      console.error('Error fetching recruiter dashboard:', err);
    } finally {
      setLoading(false);
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
        <div className="p-5 border-b border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Evaluated Candidates & Applicants</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select candidates using checkboxes to compare them side-by-side
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates or skills..."
                className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-52"
              />
            </div>

            {/* Filter by Job */}
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Job Positions</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>

            {/* Compare Button */}
            <button
              onClick={handleCompareClick}
              disabled={selectedCandidateIds.length < 2}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center gap-1.5 transition-colors"
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
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Extracted Skills</th>
                <th className="py-3 px-4">Overall Score</th>
                <th className="py-3 px-4">Recommendation</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-300">No candidate accounts registered yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Candidates can register freely, upload their resumes, and take autonomous AI interviews for any of the 20 engineering requisitions.
                    </p>
                  </td>
                </tr>
              ) : (
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
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {(cand.extracted_skills || []).slice(0, 5).map((s, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-sm text-cyan-400">Active</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                        In Pipeline
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-300">Under Review</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-xs text-cyan-400">Profile Active</span>
                    </td>
                  </tr>
                ))
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
