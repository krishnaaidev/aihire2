import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { Briefcase, Search, Sparkles, ChevronRight, Play } from 'lucide-react';

export default function JobListingPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    jobsApi.getJobs()
      .then(data => setJobs(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.department.toLowerCase().includes(search.toLowerCase()) ||
    j.required_skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">All Open Job Positions</h1>
          <p className="text-xs text-slate-400 mt-1">Browse active requisitions with autonomous AI interview pipelines</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles or skills (e.g. React, Python)..."
            className="w-full sm:w-72 bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 hover:border-slate-500 transition-all flex flex-col justify-between"
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
                    Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.required_skills.slice(0, 4).map((sk, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
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
              </div>

              <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {job.interview_count} interviewed
                </span>
                <Link
                  to={`/jobs/${job.id}`}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1 transition-colors"
                >
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
