import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JobListingPage from './pages/JobListingPage';
import JobDetailsPage from './pages/JobDetailsPage';
import CreateJobPage from './pages/CreateJobPage';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CandidatePortal from './pages/CandidatePortal';
import ResumeUploadPage from './pages/ResumeUploadPage';
import InterviewRoom from './pages/InterviewRoom';
import InterviewReportPage from './pages/InterviewReportPage';
import CandidateComparisonPage from './pages/CandidateComparisonPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/jobs" element={<JobListingPage />} />
              <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Recruiter Routes */}
              <Route
                path="/recruiter"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/create"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                    <CreateJobPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/compare"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                    <CandidateComparisonPage />
                  </ProtectedRoute>
                }
              />

              {/* Candidate Routes */}
              <Route
                path="/candidate"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'admin']}>
                    <CandidatePortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload-resume"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'admin']}>
                    <ResumeUploadPage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Protected Routes */}
              <Route
                path="/interview/:interviewId"
                element={
                  <ProtectedRoute>
                    <InterviewRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report/:reportId"
                element={
                  <ProtectedRoute>
                    <InterviewReportPage />
                  </ProtectedRoute>
                }
              />

              {/* Secret Super Admin Console (Direct Link Only - Hidden from Website Navigation) */}
              <Route path="/admin-portal" element={<AdminDashboard />} />
              <Route path="/admin-console" element={<AdminDashboard />} />
              <Route path="/super-admin" element={<AdminDashboard />} />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
