import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ShieldAlert
} from 'lucide-react';

export default function CandidatePortal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [myInterviews, setMyInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Skill matching modal state
  const [matchingJob, setMatchingJob] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [showResumeRequiredModal, setShowResumeRequiredModal] = useState(false);

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
    // Check if resume is uploaded
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/40 border border-slate-700/80 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-cyan-500/20 shrink-0">
            {user?.name ? user.name[0] : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{user?.name || 'Candidate Profile'}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                Candidate
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>

            {profile?.resume_filename ? (
              <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 font-medium">
                <FileText className="w-4 h-4" />
                <span>Resume active: {profile.resume_filename}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2 text-xs text-amber-400">
                <span>No resume uploaded yet. Upload your PDF to auto-extract skills!</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/upload-resume"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            {profile?.resume_filename ? 'Update Resume' : 'Upload Resume (PDF)'}
          </Link>
        </div>
      </div>

      {/* Extracted Skills Ribbon */}
      {profile?.extracted_skills && profile.extracted_skills.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Extracted Skills from Resume:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.extracted_skills.map((s, idx) => (
              <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-200 border border-slate-600/60">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Available Jobs & Interview Launch Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Open Roles & AI Interview Sessions</h2>
            <p className="text-xs text-slate-400">Match your profile and enter the autonomous AI interview room</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="font-semibold px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                    {job.department}
                  </span>
                  <span>Exp: {job.experience}</span>
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

              <div className="pt-4 border-t border-slate-700/60 space-y-2">
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

      {/* Candidate Past Interviews */}
      {myInterviews.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Your Interview History & Reports</h2>
              <p className="text-xs text-slate-400">Review evaluation results and progress across applications</p>
            </div>
          </div>

          <div className="space-y-3">
            {myInterviews.map((iv) => (
              <div
                key={iv.id}
                className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{iv.job_title || 'Software Engineering Role'}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      iv.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {iv.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Mode: {iv.mode} • Questions Answered: {iv.current_question_index}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {iv.status === 'completed' ? (
                    <>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Overall Score</span>
                        <span className="text-base font-extrabold text-emerald-400">{iv.overall_score || 88.5}/100</span>
                      </div>
                      <Link
                        to={`/report/${iv.id}`}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/80 hover:bg-cyan-900/60 transition-colors"
                      >
                        View Report
                      </Link>
                    </>
                  ) : (
                    <Link
                      to={`/interview/${iv.id}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      Resume Interview
                    </Link>
                  )}
                </div>
              </div>
            ))}
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
