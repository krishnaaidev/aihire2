const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.port === '5173'
);

const API_BASE = isLocal 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:8000/api')
  : '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('aihire_token');
  const headers = { ...options.headers };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, set Content-Type to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name, email, password, role = 'candidate') =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    }),
  getMe: () => apiRequest('/auth/me'),
};

// Jobs API
export const jobsApi = {
  getJobs: () => apiRequest('/jobs'),
  getJob: (id) => apiRequest(`/jobs/${id}`),
  createJob: (jobData) =>
    apiRequest('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    }),
  updateJob: (id, jobData) =>
    apiRequest(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    }),
  deleteJob: (id) =>
    apiRequest(`/jobs/${id}`, {
      method: 'DELETE',
    }),
  analyzeJob: (rawDescription) =>
    apiRequest('/jobs/analyze', {
      method: 'POST',
      body: JSON.stringify({ raw_job_description: rawDescription }),
    }),
};

// Candidates API
export const candidatesApi = {
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/candidates/upload-resume', {
      method: 'POST',
      body: formData,
    });
  },
  getMyProfile: () => apiRequest('/candidates/me'),
  updateProfile: (profileData) =>
    apiRequest('/candidates/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  listCandidates: () => apiRequest('/candidates'),
  matchJob: (jobId, candidateId = null) => {
    const url = candidateId
      ? `/candidates/match/${jobId}?candidate_id=${candidateId}`
      : `/candidates/match/${jobId}`;
    return apiRequest(url, { method: 'POST' });
  },
};

// Interviews API
export const interviewsApi = {
  createInterview: (jobId, mode = 'text') =>
    apiRequest('/interviews', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, mode }),
    }),
  getInterview: (interviewId) => apiRequest(`/interviews/${interviewId}`),
  submitAnswer: (interviewId, questionId, answer, transcript = '') =>
    apiRequest(`/interviews/${interviewId}/answer`, {
      method: 'POST',
      body: JSON.stringify({
        interview_id: interviewId,
        question_id: questionId,
        answer,
        transcript,
      }),
    }),
  getMyInterviews: () => apiRequest('/interviews/candidate/me'),
  getJobInterviews: (jobId) => apiRequest(`/interviews/job/${jobId}`),
};

// Reports & Comparison API
export const reportsApi = {
  getReport: (reportId) => apiRequest(`/reports/${reportId}`),
  getReportByInterview: (interviewId) =>
    apiRequest(`/reports/interview/${interviewId}`),
  updateDecision: (reportId, decisionStatus, recruiterNotes = '') =>
    apiRequest(`/reports/${reportId}/decision`, {
      method: 'PUT',
      body: JSON.stringify({
        decision_status: decisionStatus,
        recruiter_notes: recruiterNotes,
      }),
    }),
  compareCandidates: (jobId, candidateIds) =>
    apiRequest('/reports/compare', {
      method: 'POST',
      body: JSON.stringify({
        job_id: jobId,
        candidate_ids: candidateIds,
      }),
    }),
};

// Analytics API
export const analyticsApi = {
  getRecruiterAnalytics: () => apiRequest('/analytics/recruiter'),
};
