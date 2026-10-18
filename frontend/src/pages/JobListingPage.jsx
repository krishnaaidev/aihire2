import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { 
  Briefcase, 
  Search, 
  Sparkles, 
  ChevronRight, 
  Play, 
  MapPin, 
  IndianRupee, 
  GraduationCap, 
  Users, 
  Filter, 
  Sparkle 
} from 'lucide-react';

const ENGINEERING_BRANCHES = [
  "All Disciplines",
  "Mechanical",
  "Civil",
  "Electrical & Electronics",
  "Chemical",
  "Automobile & EV",
  "Aerospace",
  "Biomedical",
  "Environmental",
  "Mechatronics",
  "Computer Science & IT"
];

export default function JobListingPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState("All Disciplines");
  const [selectedExpFilter, setSelectedExpFilter] = useState("ALL"); // ALL, FRESHER, EXPERIENCED

  useEffect(() => {
    jobsApi.getJobs()
      .then(data => setJobs(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = jobs.filter(j => {
    // Search keyword query
    const matchSearch = 
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase()) ||
      (j.location && j.location.toLowerCase().includes(search.toLowerCase())) ||
      j.required_skills.some(s => s.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;

    // Branch / Discipline Filter
    if (selectedBranch !== "All Disciplines") {
      const bLower = selectedBranch.toLowerCase();
      const deptLower = (j.department || '').toLowerCase();
      const titleLower = (j.title || '').toLowerCase();
      const eduLower = (j.education || '').toLowerCase();

      let branchMatch = false;
      if (selectedBranch === "Mechanical") {
        branchMatch = deptLower.includes("mech") || titleLower.includes("mech") || eduLower.includes("mech");
      } else if (selectedBranch === "Civil") {
        branchMatch = deptLower.includes("civil") || titleLower.includes("civil") || eduLower.includes("civil") || titleLower.includes("structural");
      } else if (selectedBranch === "Electrical & Electronics") {
        branchMatch = deptLower.includes("electr") || deptLower.includes("power") || titleLower.includes("electrical") || titleLower.includes("power") || titleLower.includes("vlsi");
      } else if (selectedBranch === "Chemical") {
        branchMatch = deptLower.includes("chem") || titleLower.includes("chem") || eduLower.includes("chem");
      } else if (selectedBranch === "Automobile & EV") {
        branchMatch = deptLower.includes("auto") || deptLower.includes("ev ") || titleLower.includes("ev") || titleLower.includes("automotive");
      } else if (selectedBranch === "Aerospace") {
        branchMatch = deptLower.includes("aero") || deptLower.includes("avionics") || titleLower.includes("flight") || titleLower.includes("aero");
      } else if (selectedBranch === "Biomedical") {
        branchMatch = deptLower.includes("bio") || deptLower.includes("health") || titleLower.includes("biomedical");
      } else if (selectedBranch === "Environmental") {
        branchMatch = deptLower.includes("enviro") || deptLower.includes("sustain") || titleLower.includes("environmental");
      } else if (selectedBranch === "Mechatronics") {
        branchMatch = deptLower.includes("mechatron") || deptLower.includes("robot") || titleLower.includes("robotics");
      } else if (selectedBranch === "Computer Science & IT") {
        branchMatch = deptLower.includes("computer") || deptLower.includes("ai") || deptLower.includes("cloud") || deptLower.includes("cyber") || deptLower.includes("software") || deptLower.includes("platform");
      }

      if (!branchMatch) return false;
    }

    // Experience Level Filter
    const isFresherJob = 
      (j.experience_level && j.experience_level.toLowerCase().includes('fresher')) ||
      (j.experience && j.experience.toLowerCase().includes('fresher'));

    if (selectedExpFilter === "FRESHER" && !isFresherJob) return false;
    if (selectedExpFilter === "EXPERIENCED" && isFresherJob) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">All Open Job Positions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse across {jobs.length} engineering requisitions spanning diverse technical branches and fresher roles
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles, skills, or city..."
            className="w-full sm:w-80 bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        {/* Experience Level Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Experience:
          </span>
          <button
            onClick={() => setSelectedExpFilter("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedExpFilter === "ALL" 
                ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20" 
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All Roles ({jobs.length})
          </button>
          <button
            onClick={() => setSelectedExpFilter("FRESHER")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedExpFilter === "FRESHER" 
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20" 
                : "bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-emerald-900/40"
            }`}
          >
            🌱 Freshers & Entry Level (0-1 yrs)
          </button>
          <button
            onClick={() => setSelectedExpFilter("EXPERIENCED")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedExpFilter === "EXPERIENCED" 
                ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20" 
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Experienced (2+ yrs)
          </button>
        </div>

        {/* Engineering Branches Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 mr-2">Discipline:</span>
          {ENGINEERING_BRANCHES.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                selectedBranch === b
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20"
                  : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards Grid */}
      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No positions match your filters</h3>
          <p className="text-xs text-slate-400">Try clearing the branch or experience filter to view other openings.</p>
          <button
            onClick={() => { setSelectedBranch("All Disciplines"); setSelectedExpFilter("ALL"); setSearch(""); }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const isFresher = 
              (job.experience_level && job.experience_level.toLowerCase().includes('fresher')) ||
              (job.experience && job.experience.toLowerCase().includes('fresher'));

            return (
              <div
                key={job.id}
                className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 hover:border-slate-500 transition-all flex flex-col justify-between group shadow-lg shadow-black/20"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] mb-2.5">
                    <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
                      {job.department}
                    </span>
                    {isFresher ? (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                        🌱 Fresher
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">
                        Exp: {job.experience}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-cyan-400 transition-colors">
                    {job.title}
                  </h3>

                  {/* CTC, Location, Openings */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mb-3 font-medium">
                    <span className="text-cyan-400 font-semibold flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" />
                      {job.salary_range || 'Competitive CTC'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {job.location ? job.location.split(',')[0] : 'Pan-India'}
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">
                      {job.openings || 3} Openings
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="mb-4">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">
                      Required Skills
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
                    {job.interview_count || 0} interviewed
                  </span>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1 transition-colors font-bold shadow-md shadow-cyan-500/10"
                  >
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
