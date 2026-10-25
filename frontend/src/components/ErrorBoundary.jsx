import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
          <div className="max-w-lg w-full bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-center space-y-6">
            
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-rose-400" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800">
                Application Telemetry Safeguard
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">Something Went Wrong</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected component exception occurred. Our telemetry has captured the trace and protected your session state.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-36">
                <strong>Error: </strong>{this.state.error.toString()}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                <Home className="w-4 h-4" />
                Return to Safety
              </button>
            </div>

            <p className="text-[10px] text-slate-500">
              AIHire 2.0 • Autonomous Interview & Candidate Evaluation Platform
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
