import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsApi, candidatesApi, interviewsApi } from '../services/api';
import { 
  UserCheck, 
  FileText, 
  Briefcase, 
  Sparkles, 
  ArrowRight, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Bot, 
  Clock, 
  Award,
  Play, 
  Check, 
  ShieldAlert,
  Phone,
  Mail,
  Globe,
  Link2,
  FolderGit2,
  Edit2,
  Save,
  X,
  ExternalLink,
  AlertTriangle,
  GraduationCap,
  Layers,
  History
} from 'lucide-react';

export default function CandidatePortal() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') === 'profile' ? 'profile' : 'jobs';
  const setActiveTab = (tab) => {
    setSearchParams(tab === 'profile' ? { tab: 'profile' } : {});
  };

  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [myInterviews, setMyInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Skill matching modal state
  const [matchingJob, setMatchingJob] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [showResumeRequiredModal, setShowResumeRequiredModal] = useState(false);

  // Profile Edit Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
  });

  // Selected Cancelled Interview for Violation Details Modal
  const [selectedCancelledIv, setSelectedCancelledIv] = useState(null);

  // Job Search / Category Filter
  const [jobSearch, setJobSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileData, jobsData, interviewsData] = await Promise.all([
        candidatesApi.getMyProfile().catch(() => null),
        jobsApi.getJobs().catch(() => []),
        interviewsApi.getMyInterviews().catch(() => []),
      ]);
      setProfile(profileData);
      setJobs(jobsData);
      setMyInterviews(interviewsData);

      if (profileData) {
        setEditForm({
          name: profileData.candidate_name || user?.name || '',
          phone: profileData.phone || '',
          linkedin_url: profileData.linkedin_url || '',
          github_url: profileData.github_url || '',
          portfolio_url: profileData.portfolio_url || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckMatch = async (job) => {
    setMatchingJob(job);
    setMatchingLoading(true);
    try {
      const result = await candidatesApi.matchJob(job.id);
      setMatchResult(result);
    } catch (err) {
      alert('Could not calculate match: ' + err.message);
      setMatchingJob(null);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleStartInterview = async (jobId, mode = 'text') => {
    if (!profile?.resume_filename) {
      setMatchingJob(null);
      setShowResumeRequiredModal(true);
      return;
    }

    try {
      const interview = await interviewsApi.createInterview(jobId, mode);
      navigate(`/interview/${interview.id}`);
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('resume')) {
        setMatchingJob(null);
        setShowResumeRequiredModal(true);
      } else {
        alert('Failed to launch interview session: ' + msg);
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await candidatesApi.updateProfile({
        name: editForm.name,
        phone: editForm.phone,
        linkedin_url: editForm.linkedin_url,
        github_url: editForm.github_url,
        portfolio_url: editForm.portfolio_url,
      });
      setProfile(updated);
      setIsEditingProfile(false);
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Filtered jobs
  const departments = ['All', ...new Set(jobs.map((j) => j.department).filter(Boolean))];
  const filteredJobs = jobs.filter((job) => {
    const matchesDept = selectedDepartment === 'All' || job.department === selectedDepartment;
    const matchesSearch =
      job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      job.department.toLowerCase().includes(jobSearch.toLowerCase()) ||
      (job.required_skills && job.required_skills.some((s) => s.toLowerCase().includes(jobSearch.toLowerCase())));
    return matchesDept && matchesSearch;
  });

  // Analytics
  const completedInterviews = myInterviews.filter((iv) => iv.status === 'completed');
  const cancelledInterviews = myInterviews.filter((iv) => iv.status === 'cancelled');
  const avgOverallScore = completedInterviews.length > 0
    ? (completedInterviews.reduce((acc, iv) => acc + (iv.overall_score || 0), 0) / completedInterviews.length).toFixed(1)
    : 'N/A';
  const avgIntegrityScore = myInterviews.length > 0
    ? (myInterviews.reduce((acc, iv) => acc + (iv.integrity_score ?? 100), 0) / myInterviews.length).toFixed(1)
    : '100.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Welcome & Tab Switcher Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/40 border border-slate-700/80 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-cyan-500/20 shrink-0">
            {user?.name ? user.name[0] : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {profile?.candidate_name || user?.name || 'Candidate Profile'}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                Verified Candidate
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{profile?.candidate_email || user?.email}</p>

            {profile?.resume_filename ? (
              <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 font-medium">
                <FileText className="w-4 h-4" />
                <span>Active Resume: <strong className="text-slate-200">{profile.resume_filename}</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2 text-xs text-amber-400 font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>Resume missing. Upload your resume (PDF) to unlock AI interviews.</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/upload-resume"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            {profile?.resume_filename ? 'Replace Resume' : 'Upload Resume (PDF)'}
          </Link>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'jobs'
              ? 'border-cyan-400 text-cyan-400 bg-slate-800/30 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Explore Roles & AI Interviews</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {jobs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-cyan-400 text-cyan-400 bg-slate-800/30 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>My Profile & Interview History</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold">
            {myInterviews.length} Sessions
          </span>
        </button>
      </div>

      {/* TAB 1: EXPLORE ROLES & AI INTERVIEWS */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          
          {/* Missing Resume Warning Banner */}
          {!profile?.resume_filename && (
            <div className="bg-amber-950/60 border border-amber-600/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-200">
                    Resume Upload Mandatory Before Starting AI Interview
                  </h3>
                  <p className="text-xs text-amber-300/80 mt-0.5">
                    "Jab tak resume upload na ho tab tak interview start nahi hoga." AIHire parses your skills to generate personalized technical questions.
                  </p>
                </div>
              </div>
              <Link
                to="/upload-resume"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0 flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload PDF Resume Now
              </Link>
            </div>
          )}

          {/* Extracted Skills Quick Strip */}
          {profile?.extracted_skills && profile.extracted_skills.length > 0 && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 shrink-0">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Extracted Skills from Resume:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.extracted_skills.slice(0, 15).map((s, idx) => (
                  <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-200 border border-slate-600/60">
                    {s}
                  </span>
                ))}
                {profile.extracted_skills.length > 15 && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    +{profile.extracted_skills.length - 15} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Search & Department Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/60">
            <input
              type="text"
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              placeholder="Search by role, skill (e.g. Python, React, CAD, HR, Finance)..."
              className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 flex-1"
            />
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedDepartment === dept
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Job Openings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="font-semibold px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                      {job.department}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                      Exp: {job.experience}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{job.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="mb-4">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">
                      Required Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.required_skills.slice(0, 5).map((sk, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/60">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCheckMatch(job)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/70 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Check Match
                    </button>
                    <button
                      onClick={() => handleStartInterview(job.id, 'text')}
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      Start AI Interview
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MY PROFILE & INTERVIEW HISTORY */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          
          {/* Quick Metrics KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Total Sessions</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{myInterviews.length}</span>
                <span className="text-xs text-slate-500">interviews</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Completed</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-400">{completedInterviews.length}</span>
                <span className="text-xs text-slate-500">evaluations ready</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Avg Merit Score</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-cyan-400">{avgOverallScore}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Integrity Trust Index</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-indigo-400">{avgIntegrityScore}%</span>
                <span className="text-xs text-slate-500">clean rating</span>
              </div>
            </div>
          </div>

          {/* Candidate Personal Profile Card */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Personal & Contact Profile</h2>
              </div>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                Edit Profile Details
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Full Name</span>
                  <span className="font-semibold text-white text-sm">
                    {profile?.candidate_name || user?.name || 'Candidate'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Email Address</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {profile?.candidate_email || user?.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Phone Number</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {profile?.phone || 'Not provided'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">LinkedIn Profile</span>
                  {profile?.linkedin_url ? (
                    <a
                      href={profile.linkedin_url.startsWith('http') ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]">{profile.linkedin_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500 italic mt-0.5 block">Not linked</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">GitHub Profile</span>
                  {profile?.github_url ? (
                    <a
                      href={profile.github_url.startsWith('http') ? profile.github_url : `https://${profile.github_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <FolderGit2 className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]">{profile.github_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500 italic mt-0.5 block">Not linked</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Portfolio / Website</span>
                  {profile?.portfolio_url ? (
                    <a
                      href={profile.portfolio_url.startsWith('http') ? profile.portfolio_url : `https://${profile.portfolio_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]">{profile.portfolio_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500 italic mt-0.5 block">Not linked</span>
                  )}
                </div>
              </div>

              <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">Resume Status</span>
                  {profile?.resume_filename ? (
                    <div className="mt-1">
                      <span className="text-emerald-400 font-bold block">{profile.resume_filename}</span>
                      <span className="text-[11px] text-slate-400">PDF Parsed & Evaluated</span>
                    </div>
                  ) : (
                    <span className="text-amber-400 font-medium block mt-1">No resume uploaded</span>
                  )}
                </div>

                <div className="pt-2">
                  <Link
                    to="/upload-resume"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    {profile?.resume_filename ? 'Update Resume PDF' : 'Upload Resume PDF'}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Parsed Resume Credentials (Skills, Education, Projects) */}
          {profile?.resume_filename && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-700/60">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Parsed Resume Competencies & Experience</h2>
              </div>

              {/* Skills */}
              {profile.extracted_skills && profile.extracted_skills.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Extracted Technical & Domain Competencies ({profile.extracted_skills.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.extracted_skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {profile.education && profile.education.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-cyan-400" />
                    Education History
                  </span>
                  <div className="space-y-2">
                    {profile.education.map((edu, idx) => (
                      <div key={idx} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                        {typeof edu === 'string' ? edu : JSON.stringify(edu)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience or Projects */}
              {profile.projects && profile.projects.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Highlighted Projects & Technical Undertakings
                  </span>
                  <div className="space-y-2">
                    {profile.projects.map((proj, idx) => (
                      <div key={idx} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                        {typeof proj === 'string' ? proj : JSON.stringify(proj)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Interview History Table & Log */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-base font-bold text-white">Complete AI Interview History</h2>
                  <p className="text-xs text-slate-400">Track all evaluated sessions, integrity ratings, and recruiter outcomes</p>
                </div>
              </div>
            </div>

            {myInterviews.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Bot className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No Interview Sessions Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse open job roles and launch your first autonomous AI technical interview session.
                </p>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
                >
                  Browse Open Positions
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Role / Requisition</th>
                      <th className="py-3 px-3">Date & Mode</th>
                      <th className="py-3 px-3">Questions</th>
                      <th className="py-3 px-3">Session Status</th>
                      <th className="py-3 px-3">Merit Score</th>
                      <th className="py-3 px-3">Integrity Rating</th>
                      <th className="py-3 px-3">Recruiter Decision</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {myInterviews.map((iv) => (
                      <tr key={iv.id} className="hover:bg-slate-800/30 transition-colors">
                        
                        {/* Job Title */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block text-xs">
                            {iv.job_title || 'Software Engineering Role'}
                          </span>
                          <span className="text-[10px] text-slate-500">ID #{iv.id}</span>
                        </td>

                        {/* Date & Mode */}
                        <td className="py-3.5 px-3">
                          <span className="text-slate-300 block">
                            {new Date(iv.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-slate-500">
                            {iv.mode} Mode
                          </span>
                        </td>

                        {/* Questions */}
                        <td className="py-3.5 px-3">
                          <span className="font-mono text-cyan-300 font-bold">
                            {iv.current_question_index} / 5
                          </span>
                        </td>

                        {/* Session Status */}
                        <td className="py-3.5 px-3">
                          {iv.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </span>
                          ) : iv.status === 'cancelled' ? (
                            <button
                              onClick={() => setSelectedCancelledIv(iv)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900 transition-colors"
                              title="Click to view violation details"
                            >
                              <XCircle className="w-3 h-3" />
                              Auto-Cancelled
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                              <Clock className="w-3 h-3" />
                              In Progress
                            </span>
                          )}
                        </td>

                        {/* Merit Score */}
                        <td className="py-3.5 px-3">
                          {iv.status === 'completed' ? (
                            <span className={`font-mono font-black text-xs ${
                              iv.overall_score >= 80
                                ? 'text-emerald-400'
                                : iv.overall_score >= 60
                                ? 'text-cyan-400'
                                : 'text-amber-400'
                            }`}>
                              {iv.overall_score}/100
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">—</span>
                          )}
                        </td>

                        {/* Integrity Rating */}
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col">
                            <span className={`font-mono font-bold text-xs ${
                              (iv.integrity_score ?? 100) >= 80 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {iv.integrity_score ?? 100}%
                            </span>
                            {iv.tab_switch_count > 0 && (
                              <span className="text-[10px] text-amber-400">
                                {iv.tab_switch_count} tab switch{iv.tab_switch_count > 1 ? 'es' : ''}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Recruiter Decision */}
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            iv.recruiter_status === 'Selected'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : iv.recruiter_status === 'Shortlisted'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : iv.recruiter_status === 'Rejected'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {iv.recruiter_status || 'Pending'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          {iv.status === 'completed' ? (
                            <Link
                              to={`/report/${iv.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm shadow-cyan-500/20"
                            >
                              <Award className="w-3.5 h-3.5" />
                              View Report & Certificate
                            </Link>
                          ) : iv.status === 'cancelled' ? (
                            <button
                              onClick={() => setSelectedCancelledIv(iv)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 transition-colors"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Proctoring Log
                            </button>
                          ) : (
                            <Link
                              to={`/interview/${iv.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                            >
                              <Play className="w-3.5 h-3.5 fill-slate-950" />
                              Resume Room
                            </Link>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                Update Candidate Profile
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Suman Krishna"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">LinkedIn Profile URL</label>
                <input
                  type="text"
                  value={editForm.linkedin_url}
                  onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                  placeholder="e.g. linkedin.com/in/username"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">GitHub Profile URL</label>
                <input
                  type="text"
                  value={editForm.github_url}
                  onChange={(e) => setEditForm({ ...editForm, github_url: e.target.value })}
                  placeholder="e.g. github.com/username"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Portfolio or Website URL</label>
                <input
                  type="text"
                  value={editForm.portfolio_url}
                  onChange={(e) => setEditForm({ ...editForm, portfolio_url: e.target.value })}
                  placeholder="e.g. https://myportfolio.dev"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancelled Interview Violation Details Modal */}
      {selectedCancelledIv && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                Session Cancellation Audit
              </h3>
              <button
                onClick={() => setSelectedCancelledIv(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="bg-rose-950/40 border border-rose-900/60 p-3.5 rounded-xl text-rose-200">
                <span className="font-bold block text-rose-300 uppercase text-[10px] tracking-wider mb-1">
                  Reason for Automatic Termination:
                </span>
                Face Not Visible Violation: Candidate face was absent from camera preview for 3 consecutive warnings during the autonomous session.
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1.5 text-slate-300">
                <div>Role: <strong className="text-white">{selectedCancelledIv.job_title}</strong></div>
                <div>Session ID: <strong className="font-mono text-cyan-300">#{selectedCancelledIv.id}</strong></div>
                <div>Integrity Score: <strong className="text-rose-400">0.0%</strong></div>
                <div>Recruiter Decision: <strong className="text-rose-400">Rejected (Proctoring Violation)</strong></div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCancelledIv(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Match Modal */}
      {matchingJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">
              Skill Matching Analysis
            </h3>
            <p className="text-xs text-slate-400 mb-4">{matchingJob.title}</p>

            {matchingLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400">Computing hybrid TF-IDF & semantic skill similarity...</span>
              </div>
            ) : matchResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Compatibility Score</span>
                    <span className="text-2xl font-black text-cyan-400">{matchResult.match_score}%</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {matchResult.fit_level}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Matched Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.matched_skills.map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {s}
                      </span>
                    ))}
                  </div>
                </div>

                {matchResult.missing_skills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Missing or Desired Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.missing_skills.map((s, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400 italic bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                  "{matchResult.recommendation}"
                </p>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    onClick={() => { setMatchingJob(null); setMatchResult(null); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleStartInterview(matchingJob.id, 'text')}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                  >
                    Proceed to AI Interview
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Resume Required Modal */}
      {showResumeRequiredModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <ShieldAlert className="w-7 h-7" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Resume Required to Start Interview</h3>
              <p className="text-xs font-semibold text-amber-400">
                Jab tak resume upload na ho tab tak interview start nahi hoga.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Please upload your resume in PDF format. AIHire requires your resume to generate relevant domain questions and benchmark your evaluation score.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={() => navigate('/upload-resume')}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
              >
                <Upload className="w-4 h-4" />
                Upload Resume (PDF) Now
              </button>
              
              <button
                onClick={() => setShowResumeRequiredModal(false)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
