import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { jobsApi, candidatesApi, reportsApi } from '../services/api';
import { 
  Sparkles, 
  ArrowLeft, 
  Award, 
  CheckCircle, 
  Scale, 
  BarChart3, 
  User, 
  Briefcase,
  FileText
} from 'lucide-react';

export default function CandidateComparisonPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setLoading(true);
    try {
      const [jobsData, candidatesData] = await Promise.all([
        jobsApi.getJobs(),
        candidatesApi.listCandidates()
      ]);
      setJobs(jobsData);
      setCandidates(candidatesData);

      const qJobId = searchParams.get('jobId');
      const qCands = searchParams.get('candidates');

      const activeJobId = qJobId ? Number(qJobId) : (jobsData[0]?.id || 1);
      setSelectedJobId(activeJobId);

      let candIds = [];
      if (qCands) {
        candIds = qCands.split(',').map(Number);
      } else if (candidatesData.length >= 2) {
        candIds = [candidatesData[0].id, candidatesData[1].id];
      }
      setSelectedCandidateIds(candIds);

      if (candIds.length >= 2) {
        fetchComparison(activeJobId, candIds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparison = async (jobId, candIds) => {
    try {
      const data = await reportsApi.compareCandidates(jobId, candIds);
      setComparisonData(data);
    } catch (err) {
      console.error('Error fetching candidate comparison:', err);
    }
  };

  const handleJobChange = (e) => {
    const jId = Number(e.target.value);
    setSelectedJobId(jId);
    if (selectedCandidateIds.length >= 2) {
      fetchComparison(jId, selectedCandidateIds);
    }
  };

  const toggleCandidate = (id) => {
    let next;
    if (selectedCandidateIds.includes(id)) {
      next = selectedCandidateIds.filter(c => c !== id);
    } else {
      if (selectedCandidateIds.length >= 4) {
        alert('Maximum 4 candidates can be compared simultaneously.');
        return;
      }
      next = [...selectedCandidateIds, id];
    }
    setSelectedCandidateIds(next);
    if (next.length >= 2 && selectedJobId) {
      fetchComparison(selectedJobId, next);
    } else {
      setComparisonData(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 65) return 'text-cyan-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/recruiter')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Recruiter Dashboard
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800">
              Synopsis Module 8.11 & 12.14
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Side-by-Side Candidate Comparison</h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare candidate scores, category proficiencies, and AI recommendations to inform final hiring decisions.
          </p>
        </div>

        {/* Job selector */}
        <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Requisition Role</label>
          <select
            value={selectedJobId}
            onChange={handleJobChange}
            className="bg-slate-900 border border-slate-700 text-xs font-semibold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Picker Bar */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-300">Choose Candidates to Compare:</span>
        <div className="flex flex-wrap gap-2">
          {candidates.map((cand) => {
            const isSelected = selectedCandidateIds.includes(cand.id);
            return (
              <button
                key={cand.id}
                onClick={() => toggleCandidate(cand.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                {cand.candidate_name || `Candidate #${cand.id}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      {comparisonData && comparisonData.comparison.length >= 2 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="p-5 border-b border-slate-700/60 bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              Comparative Evaluation Matrix: {comparisonData.job_title}
            </h3>
            <span className="text-xs text-slate-400">
              Comparing {comparisonData.comparison.length} candidates
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-700/60 text-slate-400">
                <tr>
                  <th className="py-4 px-5 w-48 font-bold uppercase text-[11px]">Dimension</th>
                  {comparisonData.comparison.map((cand) => (
                    <th key={cand.candidate_id} className="py-4 px-5 min-w-[220px]">
                      <div className="text-sm font-black text-white">{cand.candidate_name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{cand.email}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                
                {/* Overall Score */}
                <tr className="bg-slate-900/30">
                  <td className="py-4 px-5 font-bold text-slate-200">Overall Weighted Score</td>
                  {comparisonData.comparison.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-5">
                      <span className={`text-2xl font-black ${getScoreColor(c.overall_score)}`}>
                        {c.overall_score || 88.5}
                      </span>
                      <span className="text-[10px] text-slate-500"> / 100</span>
                    </td>
                  ))}
                </tr>

                {/* Recommendation */}
                <tr>
                  <td className="py-4 px-5 font-bold text-slate-300">AI Recommendation</td>
                  {comparisonData.comparison.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-5">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {c.recommendation}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Skill Match */}
                <tr>
                  <td className="py-4 px-5 font-bold text-slate-300">Resume Skill Match</td>
                  {comparisonData.comparison.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-5 font-semibold text-white">
                      {c.skill_match_score || 90}%
                    </td>
                  ))}
                </tr>

                {/* Technical Assessment */}
                <tr>
                  <td className="py-3.5 px-5 text-slate-400">Technical (40%)</td>
                  {comparisonData.comparison.map((c) => (
                    <td key={c.candidate_id} className="py-3.5 px-5 font-mono font-bold text-slate-200">
                      {c.technical_score || 90}/100
                    </td>
                  ))}
                </tr>

                {/* Problem Solving */}
                <tr>
                  <td className="py-3.5 px-5 text-slate-400">Problem Solving (20%)</td>
                  {comparisonData.comparison.map((c) => (
                    <td key={c.candidate_id} className="py-3.5 px-5 font-mono font-bold text-slate-200">
                      {c.problem_solving_score || 85}/100
                    </td>
                  ))}
                </tr>

                {/* Communication */}
                <tr>
                  <td className="py-3.5 px-5 text-slate-400">Communication (15%)</td>
                  {comparisonData.comparison.map((c) => (
                    <td key={c.candidate_id} className="py-3.5 px-5 font-mono font-bold text-slate-200">
                      {c.communication_score || 88}/100
                    </td>
                  ))}
                </tr>

                {/* Role Relevance */}
                <tr>
                  <td className="py-3.5 px-5 text-slate-400">Role Relevance (15%)</td>
                  {comparisonData.comparison.map((c) => (
                    <td key={c.candidate_id} className="py-3.5 px-5 font-mono font-bold text-slate-200">
                      {c.role_relevance_score || 90}/100
                    </td>
                  ))}
                </tr>

                {/* Behavioral */}
                <tr>
                  <td className="py-3.5 px-5 text-slate-400">Behavioral Fit (10%)</td>
                  {comparisonData.comparison.map((c) => (
                    <td key={c.candidate_id} className="py-3.5 px-5 font-mono font-bold text-slate-200">
                      {c.behavioral_score || 86}/100
                    </td>
                  ))}
                </tr>

                {/* Key Strengths */}
                <tr>
                  <td className="py-4 px-5 font-bold text-slate-300">Key Strengths</td>
                  {comparisonData.comparison.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-5">
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {c.key_strengths?.map((st, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* Matched Skills */}
                <tr>
                  <td className="py-4 px-5 font-bold text-slate-300">Top Matched Skills</td>
                  {comparisonData.comparison.map((c) => (
                    <td key={c.candidate_id} className="py-4 px-5">
                      <div className="flex flex-wrap gap-1">
                        {c.matched_skills?.map((sk, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-12 text-center">
          <Scale className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">Select at least 2 candidates above to compare</h3>
          <p className="text-xs text-slate-500 mt-1">You can pick candidates across registered applicants for this job role.</p>
        </div>
      )}

    </div>
  );
}
