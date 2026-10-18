import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewsApi } from '../services/api';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Award,
  ArrowRight,
  ShieldAlert,
  Upload
} from 'lucide-react';

export default function InterviewRoom() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Candidate Answer State
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [resumeMissingError, setResumeMissingError] = useState(false);

  // Voice & Video Controls
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isAiVoiceEnabled, setIsAiVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  // References
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const preSpeechTextRef = useRef('');

  useEffect(() => {
    fetchInterviewSession();
    setupWebcam();

    return () => {
      stopWebcam();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, [interviewId]);

  const fetchInterviewSession = async () => {
    try {
      const data = await interviewsApi.getInterview(interviewId);
      setInterview(data);
      if (data.questions && data.questions.length > 0) {
        setTotalQuestions(data.questions.length);
        const idx = data.current_question_index || 0;
        setCurrentIndex(idx);
        if (idx < data.questions.length) {
          const q = data.questions[idx];
          setCurrentQuestion(q);
          speakQuestion(q.question_text);
        } else {
          setCompleted(true);
        }
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('resume')) {
        setResumeMissingError(true);
      } else {
        alert('Error loading interview session: ' + msg);
      }
    }
  };

  const setupWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.log('Webcam not permitted or unavailable:', e);
      setIsCameraActive(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopWebcam();
      setIsCameraActive(false);
    } else {
      setupWebcam();
      setIsCameraActive(true);
    }
  };

  // Text-To-Speech for AI Interviewer Voice
  const speakQuestion = (text) => {
    if (!isAiVoiceEnabled || !('speechSynthesis' in window)) return;
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsVoiceActive(false);
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition (Web Speech API) - Fixed repetition bug
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please type your response.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setIsVoiceActive(false);
      preSpeechTextRef.current = answerText;
    } else {
      // Immediately cancel any playing AI voice to prevent mic feedback
      window.speechSynthesis?.cancel();

      preSpeechTextRef.current = answerText;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setIsVoiceActive(true);
      };

      recognition.onresult = (event) => {
        // Collect full transcript from all results in this recognition session
        let sessionTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          sessionTranscript += event.results[i][0].transcript;
        }
        const prefix = preSpeechTextRef.current ? preSpeechTextRef.current.trim() + ' ' : '';
        setAnswerText(prefix + sessionTranscript.trimStart());
      };

      recognition.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
        setIsVoiceActive(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsVoiceActive(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || submitting || !currentQuestion) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    window.speechSynthesis?.cancel();

    setSubmitting(true);
    try {
      const res = await interviewsApi.submitAnswer(
        Number(interviewId),
        currentQuestion.id,
        answerText,
        answerText
      );

      setEvaluationFeedback(res.current_response_evaluation);

      // Brief pause to display AI evaluation badge then transition
      setTimeout(() => {
        setEvaluationFeedback(null);
        setAnswerText('');

        if (res.completed) {
          setCompleted(true);
        } else {
          setCurrentQuestion(res.next_question);
          setCurrentIndex(res.current_index);
          speakQuestion(res.next_question.question_text);
        }
        setSubmitting(false);
      }, 2500);

    } catch (err) {
      alert('Failed to submit answer: ' + err.message);
      setSubmitting(false);
    }
  };

  if (resumeMissingError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white">Resume Upload Required</h2>
          <p className="text-sm font-semibold text-amber-400">
            Jab tak resume upload na ho tab tak interview start nahi hoga.
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            AIHire requires your resume to extract competencies, generate personalized domain questions, and benchmark evaluation scores. Please upload your resume first to unlock the interview.
          </p>
        </div>
        <div className="pt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate('/upload-resume')}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Resume (PDF) Now
          </button>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Browse All Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white">AI Autonomous Interview Room</h1>
            <p className="text-xs text-slate-400">
              Role: <span className="text-cyan-300 font-medium">{interview?.job_title || 'Software Engineering'}</span>
            </p>
          </div>
        </div>

        {/* Progress & Voice Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs">
            <span className="text-slate-400">Question:</span>
            <span className="font-extrabold text-cyan-400">
              {Math.min(currentIndex + 1, totalQuestions)} / {totalQuestions}
            </span>
          </div>

          <button
            onClick={() => setIsAiVoiceEnabled(!isAiVoiceEnabled)}
            title={isAiVoiceEnabled ? "Mute AI Speech" : "Unmute AI Speech"}
            className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1.5 ${
              isAiVoiceEnabled ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isAiVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">AI Voice</span>
          </button>
        </div>
      </div>

      {completed ? (
        /* Completion Screen */
        <div className="bg-slate-800/50 border border-emerald-800/80 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-2xl animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800">
              Session Finished
            </span>
            <h2 className="text-3xl font-black text-white mt-4">Interview Completed!</h2>
            <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
              Your responses have been evaluated across technical accuracy, problem-solving, completeness, and reasoning. The AI evaluation report is ready.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate(`/report/${interviewId}`)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <Award className="w-4 h-4" />
              View Comprehensive Evaluation Report
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/candidate')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Return to Portal
            </button>
          </div>
        </div>
      ) : (
        /* Active Interview Layout: 2 Columns */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: AI Interviewer Persona & Candidate Camera (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* AI Interviewer Persona Box */}
            <div className="bg-gradient-to-b from-slate-800/80 to-slate-900 border border-cyan-800/50 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-200">AI Senior Technical Interviewer</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Adaptive Engine
                </span>
              </div>

              {/* Avatar Animation */}
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20 relative mb-4">
                  <Bot className="w-10 h-10 animate-bounce" />
                  <div className="absolute -inset-1 rounded-2xl bg-cyan-500/20 blur-sm pointer-events-none"></div>
                </div>

                {/* Animated Soundwave */}
                <div className="flex items-center gap-1.5 h-8">
                  {[12, 24, 16, 28, 20, 14, 22].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}px` }}
                      className="w-1 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-full animate-soundwave"
                    ></div>
                  ))}
                </div>
                <span className="text-[11px] text-cyan-400/80 font-mono mt-2">Active AI Session</span>
              </div>
            </div>

            {/* Candidate Webcam Preview Box */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-slate-300">Candidate Video Stream</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleCamera}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {isCameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
                />
                {!isCameraActive && (
                  <div className="text-center p-4">
                    <VideoOff className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <span className="text-xs text-slate-500">Camera preview off</span>
                  </div>
                )}
                
                {/* Live speech indicator badge */}
                {isListening && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-[10px] font-bold animate-pulse">
                    <Mic className="w-3 h-3" />
                    <span>Listening to speech...</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                Facial/behavioral analysis is not used for sole decisions (Synopsis 17).
              </p>
            </div>

          </div>

          {/* Right Column: Question & Candidate Answer Studio (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Question Card */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                    {currentQuestion?.category || 'Technical'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    currentQuestion?.difficulty === 'hard'
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                      : 'bg-blue-950/80 text-blue-300 border border-blue-800'
                  }`}>
                    {currentQuestion?.difficulty || 'Medium'}
                  </span>
                </div>
                <button
                  onClick={() => currentQuestion && speakQuestion(currentQuestion.question_text)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Re-read
                </button>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQuestion?.question_text || 'Loading next interview question...'}
              </h2>
            </div>

            {/* Answer Form Studio */}
            <form onSubmit={handleSubmitAnswer} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Your Response</span>
                
                {/* Voice Input Toggle Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30 animate-pulse'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-500'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{isListening ? 'Stop Speaking' : 'Voice Mode (Speech-to-Text)'}</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={8}
                  required
                  value={answerText}
                  onChange={(e) => {
                    setAnswerText(e.target.value);
                    preSpeechTextRef.current = e.target.value;
                  }}
                  placeholder="Provide your technical answer here. Explain architectural trade-offs, algorithms, or practical implementation steps. You can also use Voice Mode to speak naturally..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-mono"
                />
              </div>

              {/* Evaluation Feedback Splash */}
              {evaluationFeedback && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-700/80 animate-fadeIn">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      AI Evaluation Recorded (Score: {evaluationFeedback.composite_score}/100)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Transitioning to next question...</span>
                  </div>
                  <p className="text-xs text-slate-300 italic">{evaluationFeedback.feedback}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  {answerText.trim().split(/\s+/).filter(Boolean).length} words
                </span>

                <button
                  type="submit"
                  disabled={submitting || !answerText.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 disabled:opacity-40 flex items-center gap-2 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Analyzing Response with AI...' : 'Submit Answer & Next'}
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
