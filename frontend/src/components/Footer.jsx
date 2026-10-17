import React from 'react';
import { Bot, Shield, Cpu, Code2, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Bot className="w-5 h-5 text-cyan-400" />
              <span>AIHire Platform</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Autonomous AI Interview & Intelligent Candidate Evaluation Platform. Designed as an intelligent decision-support system keeping human recruiters firmly in charge of final hiring decisions.
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Shield className="w-4 h-4" /> Responsible AI
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <Cpu className="w-4 h-4" /> Adaptive LLM Engine
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Code2 className="w-4 h-4" /> FastAPI + React
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Project Details</h4>
            <ul className="space-y-1.5 text-xs">
              <li className="text-slate-300 font-medium">B.Tech Capstone Project 2026</li>
              <li>Computer Science & Engineering</li>
              <li>CT Institute of Engineering, Management & Tech</li>
              <li>I. K. G. Punjab Technical University</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Submitted By & Guided By</h4>
            <ul className="space-y-1.5 text-xs">
              <li className="text-slate-300 font-medium">Suman Krishna (Roll: 2301275)</li>
              <li className="text-slate-300 font-medium">Shivam Kumar Chaubey (Roll: 2301267)</li>
              <li className="text-slate-400 pt-1">Under Guidance of:</li>
              <li className="text-cyan-400 font-medium">Mr. Vikram Singh (Research Assistant)</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 AIHire. Built with FastAPI, React, and Generative AI.</p>
          <p className="flex items-center gap-1 text-slate-400">
            Intelligent candidate screening & multi-parameter evaluation
          </p>
        </div>
      </div>
    </footer>
  );
}
