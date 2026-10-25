import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsApi, candidatesApi, interviewsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Sparkles, 
  Play, 
  CheckCircle, 
  ArrowLeft,
  Building,
  GraduationCap,
  ListOrdered,
  Users,
  IndianRupee,
  ShieldAlert,
  Upload,
  CheckCircle2,
  FileText,
  Workflow
} from 'lucide-react';

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchResult, setMatchResult] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  useEffect(() => {
    Promise.all([
      jobsApi.getJob(jobId),
      candidatesApi.getMyProfile().catch(() => null)
    ])
      .then(([jobData, profileData]) => {
        setJob(jobData);
        setProfile(profileData);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleCheckMatch = async () => {
    if (!profile?.resume_filename) {
      setShowResumeModal(true);
      return;
    }
    setMatchingLoading(true);
    try {
      const res = await candidatesApi.matchJob(jobId);
      setMatchResult(res);
    } catch (err) {
      alert('Could not compute match: ' + err.message);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleStartInterview = async (mode = 'text') => {
    // Zero-start interview rule: candidate MUST upload resume first
    if (!profile?.resume_filename) {
      setShowResumeModal(true);
      return;
    }

    try {
      const iv = await interviewsApi.createInterview(Number(jobId), mode);
      navigate(`/interview/${iv.id}`);
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('resume')) {
        setShowResumeModal(true);
      } else {
        alert('Could not start interview: ' + msg);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <p className="text-sm text-slate-400">Job position not found.</p>
        <Link to="/jobs" className="text-xs text-cyan-400">Back to all jobs</Link>
      </div>
    );
  }

  const isFresher = job.experience_level?.toLowerCase().includes('fresher') || job.experience?.toLowerCase().includes('fresher');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </button>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              {job.department}
            </span>
            {isFresher ? (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse">
                🌱 Fresher Friendly (0-1 yrs)
              </span>
            ) : (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {job.experience_level || job.experience}
              </span>
            )}
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
              {job.work_mode || 'Hybrid'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">{job.title}</h1>
          
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <IndianRupee className="w-3.5 h-3.5" />
              {job.salary_range || 'Competitive CTC'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {job.location || 'Pan-India'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {job.openings || 3} Openings ({job.applicant_count || 0} applied)
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleCheckMatch}
            disabled={matchingLoading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            {matchingLoading ? 'Analyzing...' : 'Check Skill Match'}
          </button>

          <button
            onClick={() => handleStartInterview('text')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Start AI Interview Now
          </button>
        </div>
      </div>

      {/* Resume status alert banner if candidate has no resume */}
      {!profile?.resume_filename && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block text-amber-300">Resume Upload Required to Start Interview:</span>
              <span>Jab tak resume upload na ho tab tak interview start nahi hoga. Upload your resume to unlock AI interview.</span>
            </div>
          </div>
          <Link
            to="/upload-resume"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 text-center transition-colors flex items-center justify-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Resume Now
          </Link>
        </div>
      )}

      {/* Match Result Banner if calculated */}
      {matchResult && (
        <div className="bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-slate-900 border border-cyan-800/80 rounded-2xl p-6 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Your Profile Compatibility Score</h3>
                <p className="text-xs text-slate-400">Evaluated against mandatory and preferred requirements</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-cyan-400">{matchResult.match_score}%</span>
              <span className="text-xs text-slate-400 block">{matchResult.fit_level}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 italic pt-1">"{matchResult.recommendation}"</p>
        </div>
      )}

      {/* Key Job Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 block">Compensation / CTC</span>
          <span className="text-sm font-bold text-cyan-300 mt-1 block">{job.salary_range || 'Competitive CTC'}</span>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 block">Experience Level</span>
          <span className="text-sm font-bold text-white mt-1 block">{job.experience_level || job.experience}</span>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 block">Work Mode</span>
          <span className="text-sm font-bold text-white mt-1 block">{job.work_mode || 'Hybrid'}</span>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 block">Job Openings</span>
          <span className="text-sm font-bold text-white mt-1 block">{job.openings || 3} Positions</span>
        </div>
      </div>

      {/* Job Details Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols): Description, Eligibility, Selection Process & Responsibilities */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">About the Position</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {job.eligibility && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Eligibility Criteria & Batch Guidelines
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {job.eligibility}
              </p>
            </div>
          )}

          {job.selection_process && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Workflow className="w-4 h-4 text-cyan-400" />
                Selection Process & Rounds
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {job.selection_process}
              </p>
            </div>
          )}

          {job.responsibilities && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3">
              <h2 className="text-base font-bold text-white">Key Responsibilities</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {job.responsibilities}
              </p>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Requirements Breakdown */}
        <div className="space-y-6">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Mandatory Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {job.required_skills.map((sk, idx) => (
                  <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {job.preferred_skills && job.preferred_skills.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Preferred Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {job.preferred_skills.map((sk, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-800">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Experience Requirement
              </span>
              <span className="text-xs text-slate-300">{job.experience}</span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Education Qualification
              </span>
              <span className="text-xs text-slate-300">{job.education}</span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Employment Type
              </span>
              <span className="text-xs text-slate-300">{job.employment_type || 'Full-Time, Permanent'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Resume Required Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <ShieldAlert className="w-7 h-7" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Resume Required Before Interview</h3>
              <p className="text-xs font-semibold text-amber-400">
                Jab tak resume upload na ho tab tak interview start nahi hoga.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                AIHire uses your resume to evaluate technical background, customize interview questions, and assess role suitability.
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
                onClick={() => setShowResumeModal(false)}
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
