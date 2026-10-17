import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsApi } from '../services/api';
import { 
  Bot, 
  Sparkles, 
  Briefcase, 
  UserCheck, 
  Cpu, 
  Award, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Mic,
  BarChart3,
  FileSearch,
  Scale
} from 'lucide-react';

export default function LandingPage() {
  const { user, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobsApi.getJobs()
      .then((data) => setJobs(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDemo = async (role) => {
    await quickDemoLogin(role);
    if (role === 'recruiter') {
      navigate('/recruiter');
    } else {
      navigate('/candidate');
    }
  };

  return (
    <div className="space-y-24 pb-20">
      
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-cyan-400 mb-8 backdrop-blur-sm shadow-inner">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Autonomous AI Interview & Intelligent Evaluation Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Revolutionizing Recruitment with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400">Autonomous AI</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            AIHire streamlines the preliminary hiring pipeline: automated resume parsing, hybrid skill-matching, adaptive real-time AI interviews, and multi-criteria automated scoring.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Link
                to={user.role === 'recruiter' ? '/recruiter' : '/candidate'}
                className="px-8 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 group"
              >
                Go to {user.role === 'recruiter' ? 'Recruiter Dashboard' : 'Candidate Portal'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-7 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-lg shadow-cyan-400/25 transition-all flex items-center gap-2 group"
                >
                  <Sparkles className="w-4 h-4" />
                  Get Started Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3.5 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-2"
                >
                  Sign In
                </Link>
              </>
            )}
            <Link
              to="/jobs"
              className="px-6 py-3.5 rounded-xl font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 hover:text-white border border-slate-700/80 transition-all flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Explore Open Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Synopsis Workflow Diagram */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">The AIHire Proposed Pipeline</h2>
            <p className="text-sm text-slate-400 mt-2">
              End-to-end integration of Document Processing, NLP, Semantic Matching, Generative AI, and Automated Scoring.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { title: "1. Job Analysis", desc: "Extracts technical requirements & competencies", icon: FileSearch, color: "text-blue-400" },
              { title: "2. Resume Parsing", desc: "Extracts skills, experience & education from PDF", icon: Cpu, color: "text-cyan-400" },
              { title: "3. Hybrid Matching", desc: "Computes TF-IDF & semantic relevance score", icon: Scale, color: "text-indigo-400" },
              { title: "4. Dynamic Questions", desc: "Generates role-specific & adaptive probes", icon: Bot, color: "text-purple-400" },
              { title: "5. Speech & Text Room", desc: "Voice recognition & real-time answers", icon: Mic, color: "text-rose-400" },
              { title: "6. AI Evaluation", desc: "5-parameter scoring & comprehensive report", icon: BarChart3, color: "text-emerald-400" },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center text-center hover:border-slate-600 transition-colors">
                  <div className={`p-2.5 rounded-lg bg-slate-800 mb-3 ${step.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">{step.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-tight">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Core System Modules</h2>
          <p className="text-slate-400 mt-3 text-sm">
            Designed according to the AIHire project synopsis specification for high scalability, fair assessment, and human decision support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Resume Parsing & Skill Extraction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extracts candidate name, contact, technical skills against a comprehensive 150+ technology taxonomy, qualifications, and past projects directly from PDF and text documents.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 hover:border-indigo-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hybrid Candidate-Job Matching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Combines keyword matching, TF-IDF vector cosine similarity, and required vs preferred skill overlap to compute an objective match score before the interview begins.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Adaptive AI Interviewer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates personalized questions across Technical, Conceptual, Scenario-based, Project-based, and Behavioral categories, dynamically adjusting based on candidate answers.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 hover:border-rose-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Speech & Voice Recognition</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time Speech-to-Text and voice synthesis powered by Web Speech API & Whisper architecture, enabling candidates to take the interview verbally or in text mode.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">5-Parameter Answer Evaluation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates each candidate answer on Relevance, Technical Accuracy, Completeness, Reasoning, and Communication with constructive strengths and improvements feedback.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 hover:border-amber-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Configurable Weighted Scoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Overall score weighted by Technical (40%), Problem Solving (20%), Communication (15%), Role Relevance (15%), and Behavioral (10%), fully customizable per job position.
            </p>
          </div>

        </div>
      </section>

      {/* Featured Jobs Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Active Job Openings</h2>
            <p className="text-xs text-slate-400 mt-1">Ready for automated skill matching and AI interviews</p>
          </div>
          <Link
            to="/jobs"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
          >
            View all open positions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {jobs.slice(0, 3).map((job) => (
            <div
              key={job.id}
              className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                    {job.department}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Exp: {job.experience}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{job.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {job.required_skills.slice(0, 4).map((sk, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                      {sk}
                    </span>
                  ))}
                  {job.required_skills.length > 4 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700/40 text-slate-400">
                      +{job.required_skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {job.interview_count} candidates evaluated
                </span>
                <Link
                  to={`/jobs/${job.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
