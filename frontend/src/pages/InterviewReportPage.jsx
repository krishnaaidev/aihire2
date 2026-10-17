import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Award, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Printer, 
  ArrowLeft, 
  User, 
  Briefcase, 
  Sparkles,
  BarChart2,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Save
} from 'lucide-react';

export default function InterviewReportPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Recruiter notes & decision update
  const [decisionStatus, setDecisionStatus] = useState('Pending');
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [savingDecision, setSavingDecision] = useState(false);
  const [decisionSaved, setDecisionSaved] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let data;
      // If reportId is integer, fetch directly, otherwise try interview ID lookup
      try {
        data = await reportsApi.getReport(reportId);
      } catch {
        data = await reportsApi.getReportByInterview(reportId);
      }
      setReport(data);
      setDecisionStatus(data.decision_status || 'Pending');
      setRecruiterNotes(data.recruiter_notes || '');
    } catch (err) {
      setError('Unable to load evaluation report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDecision = async () => {
    if (!report) return;
    setSavingDecision(true);
    setDecisionSaved(false);
    try {
      const updated = await reportsApi.updateDecision(report.id, decisionStatus, recruiterNotes);
      setReport(updated);
      setDecisionSaved(true);
      setTimeout(() => setDecisionSaved(false), 3000);
    } catch (err) {
      alert('Error updating decision: ' + err.message);
    } finally {
      setSavingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">Loading AI Candidate Evaluation Report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Report Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'This interview report is still compiling or does not exist.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 65) return 'text-cyan-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 print:max-w-none">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(user?.role === 'recruiter' ? '/recruiter' : '/candidate')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {user?.role === 'recruiter' ? 'Back to Recruiter Dashboard' : 'Back to Candidate Portal'}
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* Main Executive Report Card */}
      <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-8">
        
        {/* Report Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-700/80">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>AIHire Autonomous Evaluation Dossier (Report #{report.id})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{report.candidate_name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Applied for: <span className="text-white font-medium">{report.job_title}</span> • Generated on {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-700/60">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">Composite Score</span>
              <div className="flex items-baseline justify-end gap-1">
                <span className={`text-3xl font-black ${getScoreColor(report.overall_score)}`}>
                  {report.overall_score}
                </span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="pl-4 border-l border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Recommendation</span>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                report.recommendation === 'Strong Hire' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                report.recommendation === 'Hire' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                report.recommendation === 'Lean Hire' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {report.recommendation}
              </span>
            </div>
          </div>
        </div>

        {/* AI Performance Summary */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            Executive Summary
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
            "{report.summary}"
          </p>
        </div>

        {/* Multi-Dimensional Category Breakdown (Section 8.9) */}
        <div>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            Multi-Parameter Competency Breakdown (Configurable Weights)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { label: 'Technical Assessment', weight: '40%', score: report.technical_score },
              { label: 'Problem Solving', weight: '20%', score: report.problem_solving_score },
              { label: 'Communication', weight: '15%', score: report.communication_score },
              { label: 'Role Relevance', weight: '15%', score: report.role_relevance_score },
              { label: 'Behavioral Fit', weight: '10%', score: report.behavioral_score },
            ].map((dim, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 text-center flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">{dim.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Weight: {dim.weight}</span>
                </div>
                <div className="my-2">
                  <span className={`text-xl font-black ${getScoreColor(dim.score)}`}>
                    {dim.score}
                  </span>
                  <span className="text-[10px] text-slate-500">/100</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${dim.score}%` }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Observed Strengths
            </h4>
            <ul className="space-y-2 text-xs text-slate-200">
              {report.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Areas for Improvement
            </h4>
            <ul className="space-y-2 text-xs text-slate-200">
              {report.weaknesses.map((w, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Question-by-Question Deep Analysis */}
        <div>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Question-by-Question Evaluation & Transcripts
          </h3>

          <div className="space-y-4">
            {report.question_analysis.map((qa, idx) => (
              <div key={idx} className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Q{idx + 1}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-cyan-400">
                      {qa.category}
                    </span>
                    <span className="text-[10px] uppercase text-slate-500">
                      Difficulty: {qa.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">Score:</span>
                    <span className={`text-sm font-bold ${getScoreColor(qa.composite_score)}`}>
                      {qa.composite_score}/100
                    </span>
                  </div>
                </div>

                <p className="text-xs font-semibold text-white leading-relaxed">
                  {qa.question}
                </p>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Candidate Answer / Transcript:</span>
                  {qa.candidate_answer}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>Relevance: <strong className="text-slate-200">{qa.relevance || 75}</strong></span>
                    <span>Accuracy: <strong className="text-slate-200">{qa.accuracy || 75}</strong></span>
                    <span>Completeness: <strong className="text-slate-200">{qa.completeness || 75}</strong></span>
                    <span>Reasoning: <strong className="text-slate-200">{qa.reasoning || 75}</strong></span>
                  </div>
                  <span className="italic text-cyan-400/90">{qa.feedback}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recruiter Review & Decision Panel (Synopsis Section 8.11) */}
        {user?.role === 'recruiter' && (
          <div className="bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-800/50 rounded-xl p-6 space-y-4 print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Human Supervisor Decision & Notes
                </h3>
                <p className="text-xs text-slate-400">Confirm the hiring decision to complete the assessment pipeline</p>
              </div>

              {decisionSaved && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Decision Saved!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Decision Status</label>
                <select
                  value={decisionStatus}
                  onChange={(e) => setDecisionStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Pending">Pending Review</option>
                  <option value="Shortlisted">Shortlisted for Next Round</option>
                  <option value="Offered">Offer Extended</option>
                  <option value="Rejected">Not Selected</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Recruiter Private Notes</label>
                <input
                  type="text"
                  value={recruiterNotes}
                  onChange={(e) => setRecruiterNotes(e.target.value)}
                  placeholder="e.g. Strong system architecture clarity; ready for executive interview."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveDecision}
                disabled={savingDecision}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {savingDecision ? 'Saving...' : 'Update Hiring Decision'}
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
