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
  Users
} from 'lucide-react';

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchResult, setMatchResult] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);

  useEffect(() => {
    jobsApi.getJob(jobId)
      .then(data => setJob(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleCheckMatch = async () => {
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
    try {
      const iv = await interviewsApi.createInterview(Number(jobId), mode);
      navigate(`/interview/${iv.id}`);
    } catch (err) {
      alert('Could not start interview: ' + err.message);
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero Header */}
      <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-700/60 text-slate-300">
              {job.department}
            </span>
            <span className="text-xs text-slate-400">
              Exp: {job.experience}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">{job.title}</h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
            <span>Posted by Engineering Team</span>
            <span>•</span>
            <span>{job.applicant_count || 0} candidates applied</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCheckMatch}
            disabled={matchingLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-700/70 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            {matchingLoading ? 'Analyzing...' : 'Check Skill Match'}
          </button>

          <button
            onClick={() => handleStartInterview('text')}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Start AI Interview Now
          </button>
        </div>
      </div>

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

      {/* Job Details Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols): Description & Responsibilities */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">About the Position</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

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
                Experience
              </span>
              <span className="text-xs text-slate-300">{job.experience}</span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Education
              </span>
              <span className="text-xs text-slate-300">{job.education}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
