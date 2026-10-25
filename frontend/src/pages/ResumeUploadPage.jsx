import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatesApi } from '../services/api';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Cpu, 
  Sparkles,
  BookOpen,
  Briefcase,
  Award
} from 'lucide-react';

export default function ResumeUploadPage() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsedProfile, setParsedProfile] = useState(null);
  const [error, setError] = useState('');

  const sampleResumeText = `Suman Krishna
Email: candidate@aihire.com | Phone: +91 98765 43210
LinkedIn: https://linkedin.com/in/sumankrishna | GitHub: https://github.com/sumankrishna

EDUCATION
B.Tech in Computer Science and Engineering (2022 - 2026)
CT Institute of Engineering, Management and Technology - I.K.G Punjab Technical University
CGPA: 8.8/10

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL, Bash
Frameworks & Libraries: FastAPI, React, Next.js, Node.js, PyTorch, Transformers, Scikit-Learn
Databases & Cloud: PostgreSQL, Redis, Docker, Kubernetes, AWS, Git, CI/CD
Concepts: REST APIs, WebSockets, RAG, Large Language Models, Distributed Systems

EXPERIENCE
Full Stack & AI Engineer Intern | AI Systems Lab (2025 - Present)
- Engineered asynchronous microservices backend using FastAPI and SQLAlchemy handling 5,000+ candidate evaluations.
- Built real-time WebSocket communication pipelines and integrated Whisper speech recognition for voice-driven interviews.

PROJECTS
AIHire: Autonomous AI Interview & Intelligent Evaluation Platform
- Architected end-to-end recruitment platform integrating hybrid skill matching (TF-IDF + embeddings), dynamic adaptive question generation, and 5-criteria automated scoring.`;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a resume file (PDF or text) to upload.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const res = await candidatesApi.uploadResume(file);
      setParsedProfile(res);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleUseSampleResume = async () => {
    setError('');
    setUploading(true);

    try {
      const blob = new Blob([sampleResumeText], { type: 'text/plain' });
      const sampleFile = new File([blob], 'suman_krishna_resume.txt', { type: 'text/plain' });
      const res = await candidatesApi.uploadResume(sampleFile);
      setParsedProfile(res);
    } catch (err) {
      setError(err.message || 'Sample upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <button
        onClick={() => navigate('/candidate')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Candidate Portal
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Upload & Analyze Resume</h1>
        <p className="text-xs text-slate-400 mt-1">
          Our NLP parsing pipeline extracts competencies, qualifications, and past experience automatically.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
        
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-2xl p-8 text-center transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              {file ? file.name : 'Choose your resume file (PDF or TXT)'}
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Supports standard PDF and plain text formats up to 10MB
            </p>

            <input
              type="file"
              id="resume-file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="resume-file"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white cursor-pointer inline-block transition-colors"
            >
              Browse Files
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleUseSampleResume}
              disabled={uploading}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fill with Sample Resume (Suman Krishna)
            </button>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition-colors text-center"
            >
              {uploading ? 'Extracting with NLP...' : 'Upload & Parse Resume'}
            </button>
          </div>
        </form>

      </div>

      {/* Extracted Profile Preview */}
      {parsedProfile && (
        <div className="bg-slate-800/50 border border-emerald-800/60 rounded-2xl p-6 md:p-8 space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Resume Processed Successfully!</h3>
                <p className="text-xs text-slate-400">Stored securely on server and analyzed by NLP parser</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/candidate')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
            >
              Continue to Portal
            </button>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Extracted Technical Skills ({parsedProfile.extracted_skills?.length || 0})
            </h4>
            <div className="flex flex-wrap gap-2">
              {parsedProfile.extracted_skills?.map((sk, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Education */}
          {parsedProfile.education?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Education
              </h4>
              <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                {parsedProfile.education.map((ed, idx) => (
                  <li key={idx}>{ed}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Experience */}
          {parsedProfile.experience?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-purple-400" />
                Experience & Roles
              </h4>
              <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                {parsedProfile.experience.map((exp, idx) => (
                  <li key={idx}>{exp}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
