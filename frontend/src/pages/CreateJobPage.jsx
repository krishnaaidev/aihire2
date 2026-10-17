import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { 
  Sparkles, 
  Briefcase, 
  Sliders, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Wand2,
  Plus,
  X
} from 'lucide-react';

export default function CreateJobPage() {
  const navigate = useNavigate();

  const [rawText, setRawText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState(['Python', 'FastAPI', 'React']);
  const [preferredSkills, setPreferredSkills] = useState(['Docker', 'RAG']);
  const [skillInput, setSkillInput] = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [experience, setExperience] = useState('2-5 years');
  const [education, setEducation] = useState("Bachelor's in Computer Science or related field");
  const [responsibilities, setResponsibilities] = useState('');

  // Configurable weights from Section 8.9
  const [weights, setWeights] = useState({
    technical: 40,
    problem_solving: 20,
    communication: 15,
    role_relevance: 15,
    behavioral: 10
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAIAnalyze = async () => {
    if (!rawText.trim()) {
      alert('Please paste some job description text first!');
      return;
    }
    setAnalyzing(true);
    try {
      const res = await jobsApi.analyzeJob(rawText);
      if (res.title) setTitle(res.title);
      if (res.department) setDepartment(res.department);
      if (res.required_skills) setRequiredSkills(res.required_skills);
      if (res.preferred_skills) setPreferredSkills(res.preferred_skills);
      if (res.experience) setExperience(res.experience);
      if (res.education) setEducation(res.education);
      if (res.responsibilities) setResponsibilities(res.responsibilities);
      setDescription(rawText);
    } catch (err) {
      alert('Error parsing job description: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const addRequiredSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills([...requiredSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeRequiredSkill = (skill) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
  };

  const addPreferredSkill = () => {
    if (prefSkillInput.trim() && !preferredSkills.includes(prefSkillInput.trim())) {
      setPreferredSkills([...preferredSkills, prefSkillInput.trim()]);
      setPrefSkillInput('');
    }
  };

  const removePreferredSkill = (skill) => {
    setPreferredSkills(preferredSkills.filter(s => s !== skill));
  };

  const handleWeightChange = (key, val) => {
    setWeights(prev => ({ ...prev, [key]: Number(val) }));
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (requiredSkills.length === 0) {
      setError('Please provide at least one required skill.');
      return;
    }

    setSaving(true);
    try {
      // Normalize weights to 0.0 - 1.0 format
      const normalizedWeights = {
        technical: weights.technical / 100,
        problem_solving: weights.problem_solving / 100,
        communication: weights.communication / 100,
        role_relevance: weights.role_relevance / 100,
        behavioral: weights.behavioral / 100,
      };

      await jobsApi.createJob({
        title,
        department,
        description,
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
        experience,
        education,
        responsibilities,
        scoring_weights: normalizedWeights
      });

      navigate('/recruiter');
    } catch (err) {
      setError(err.message || 'Failed to create job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <button
        onClick={() => navigate('/recruiter')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Recruiter Dashboard
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Post New Job Position</h1>
        <p className="text-xs text-slate-400 mt-1">
          Define role specifications, required skills, and configure evaluation scoring weights.
        </p>
      </div>

      {/* AI Auto-Extraction Card */}
      <div className="bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-slate-800/40 border border-indigo-800/40 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-indigo-300 mb-2">
          <Wand2 className="w-4 h-4 text-cyan-400" />
          <span>AI Requirement Extraction (Synopsis Module 8.2)</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Paste an unstructured job description below. Our AI engine will parse required skills, preferred competencies, and experience parameters automatically.
        </p>
        <textarea
          rows={3}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste raw JD text here: e.g. We are looking for an AI Engineer with 3+ years experience in Python, PyTorch, LangChain, RAG architectures..."
          className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleAIAnalyze}
            disabled={analyzing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {analyzing ? 'Extracting with AI...' : 'Auto-Extract Requirements'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Job Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Backend AI Engineer"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. AI Research, Platform Engineering"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Summary & Overview</label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Overview of the role, engineering impact, and daily responsibilities..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Required Skills */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mandatory Technical Skills (for AI Matching)</label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {requiredSkills.map((skill, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                {skill}
                <button type="button" onClick={() => removeRequiredSkill(skill)} className="hover:text-rose-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequiredSkill())}
              placeholder="Type skill and press Enter (e.g. Docker, PyTorch, Redis)..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={addRequiredSkill}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white"
            >
              Add
            </button>
          </div>
        </div>

        {/* Preferred Skills */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred / Nice-to-Have Skills</label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {preferredSkills.map((skill, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-800/60">
                {skill}
                <button type="button" onClick={() => removePreferredSkill(skill)} className="hover:text-rose-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={prefSkillInput}
              onChange={(e) => setPrefSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPreferredSkill())}
              placeholder="Add preferred skills..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={addPreferredSkill}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white"
            >
              Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Experience Requirement</label>
            <input
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g. 3-5 years"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Educational Qualification</label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. Bachelor's in CS or equivalent"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Configurable Scoring Weights (Synopsis 8.9) */}
        <div className="pt-4 border-t border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Candidate Scoring Weights (Synopsis Section 8.9)
              </h3>
              <p className="text-[11px] text-slate-400">Configure how the final AI evaluation score is calculated</p>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              totalWeight === 100 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              Total: {totalWeight}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Technical Assessment</span>
              <input
                type="number"
                min="0"
                max="100"
                value={weights.technical}
                onChange={(e) => handleWeightChange('technical', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Problem Solving</span>
              <input
                type="number"
                min="0"
                max="100"
                value={weights.problem_solving}
                onChange={(e) => handleWeightChange('problem_solving', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Communication</span>
              <input
                type="number"
                min="0"
                max="100"
                value={weights.communication}
                onChange={(e) => handleWeightChange('communication', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Role Relevance</span>
              <input
                type="number"
                min="0"
                max="100"
                value={weights.role_relevance}
                onChange={(e) => handleWeightChange('role_relevance', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Behavioral Fit</span>
              <input
                type="number"
                min="0"
                max="100"
                value={weights.behavioral}
                onChange={(e) => handleWeightChange('behavioral', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
          <button
            type="button"
            onClick={() => navigate('/recruiter')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Publishing Job...' : 'Publish Job Position'}
          </button>
        </div>

      </form>

    </div>
  );
}
