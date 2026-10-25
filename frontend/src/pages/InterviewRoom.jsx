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
  ArrowLeft,
  ShieldAlert,
  Upload,
  RotateCcw,
  Ban,
  PhoneOff,
  Lock,
  Shuffle
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
  const [submissionError, setSubmissionError] = useState(null);

  // Voice & Video Controls
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isAiVoiceEnabled, setIsAiVoiceEnabled] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechBlocked, setSpeechBlocked] = useState(false);
  const utteranceRef = useRef(null);

  // Proctoring & Academic Integrity State
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [integrityScore, setIntegrityScore] = useState(100);
  const [proctoringWarning, setProctoringWarning] = useState(null);
  const lastEventTimeRef = useRef(0);

  // In-Camera Object Detection (Mobile Phone) & Face Movement Tracking
  const [interviewCancelled, setInterviewCancelled] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [faceWarningMessage, setFaceWarningMessage] = useState(null);
  const [faceWarningCount, setFaceWarningCount] = useState(0);
  const [isAiVisionReady, setIsAiVisionReady] = useState(false);
  const [shuffleNotice, setShuffleNotice] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const faceMissingTimerRef = useRef(0);
  const faceWarningCountRef = useRef(0);
  const faceDetectorRef = useRef(null);
  const objectDetectorRef = useRef(null);
  const lastFaceBoxRef = useRef(null);
  const faceMovementViolationsRef = useRef(0);
  const objectDetectionViolationsRef = useRef(0);

  // References
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const preSpeechTextRef = useRef('');

  // Dynamically load TensorFlow.js and COCO-SSD for client-side device & phone detection
  useEffect(() => {
    let isMounted = true;
    const loadVisionModel = async () => {
      try {
        if (!window.cocoSsd && !window.tf) {
          const tfScript = document.createElement('script');
          tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js';
          tfScript.async = true;
          document.body.appendChild(tfScript);

          tfScript.onload = () => {
            const cocoScript = document.createElement('script');
            cocoScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js';
            cocoScript.async = true;
            document.body.appendChild(cocoScript);

            cocoScript.onload = async () => {
              if (window.cocoSsd && isMounted) {
                try {
                  const model = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
                  objectDetectorRef.current = model;
                  setIsAiVisionReady(true);
                } catch (err) {
                  console.warn('COCO-SSD load err:', err);
                }
              }
            };
          };
        } else if (window.cocoSsd) {
          const model = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
          objectDetectorRef.current = model;
          setIsAiVisionReady(true);
        }
      } catch (e) {
        console.warn('AI Vision load warning:', e);
      }
    };

    loadVisionModel();
    return () => { isMounted = false; };
  }, []);

  // Pre-load Web Speech API voices
  useEffect(() => {
    const handleVoicesChanged = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }
    };

    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    }

    // Unlock browser audio context on first user interaction
    const unlockAudio = () => {
      if ('speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      setSpeechBlocked(false);
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    fetchInterviewSession();
    setupWebcam();

    return () => {
      stopWebcam();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [interviewId]);

  // AI Proctoring: Monitor Window Focus & Tab Switches
  useEffect(() => {
    if (completed || resumeMissingError) return;

    let isTabHidden = false;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isTabHidden = true;
        handleMalpracticeEvent('tab_switch', 'Tab switched or window minimized');
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden && !isTabHidden) {
        handleMalpracticeEvent('tab_switch', 'Focus moved away from interview window');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [interviewId, completed, resumeMissingError, tabSwitchCount, pasteCount]);

  const handleMalpracticeEvent = async (type, details) => {
    const now = Date.now();
    if (now - lastEventTimeRef.current < 2000) return;
    lastEventTimeRef.current = now;

    if (type === 'tab_switch') {
      setTabSwitchCount((prev) => {
        const next = prev + 1;
        const newScore = Math.max(0, 100 - (next * 8 + pasteCount * 4));
        setIntegrityScore(newScore);
        return next;
      });
      setProctoringWarning('⚠️ Proctoring Alert: Tab switch detected! AI proctoring tracks window focus to preserve academic integrity.');
    } else if (type === 'paste_attempt') {
      setPasteCount((prev) => {
        const next = prev + 1;
        const newScore = Math.max(0, 100 - (tabSwitchCount * 8 + next * 4));
        setIntegrityScore(newScore);
        return next;
      });
      setProctoringWarning('⚠️ Clipboard Restricted: Direct paste is disabled to ensure authentic responses. Please type or speak your answer.');
    }

    try {
      await interviewsApi.logProctoringEvent(Number(interviewId), type, details);
    } catch (e) {
      console.warn('Proctoring log error:', e);
    }

    setTimeout(() => {
      setProctoringWarning((cur) => (cur ? null : cur));
    }, 4500);
  };

  // AI Proctoring: Monitor Candidate Face & Camera Visibility (3 warnings then auto-cancelled)
  useEffect(() => {
    if (completed || interviewCancelled || resumeMissingError) return;

    if ('FaceDetector' in window && !faceDetectorRef.current) {
      try {
        faceDetectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
      } catch (e) {
        console.log('Native FaceDetector error:', e);
      }
    }

    const interval = setInterval(async () => {
      // 1. Camera Active Check
      if (!isCameraActive || !videoRef.current || videoRef.current.readyState < 2) {
        faceMissingTimerRef.current += 1;
        if (faceMissingTimerRef.current >= 3) {
          handleMalpracticeDisqualification(
            "🚨 Camera Stream Interrupted: Video preview must remain continuously active throughout the proctored interview. Retake is prohibited.",
            "camera_interrupted"
          );
        }
        return;
      }

      const video = videoRef.current;

      // 2. In-Camera Object Detection (Mobile Phone & Prohibited Items)
      if (objectDetectorRef.current) {
        try {
          const predictions = await objectDetectorRef.current.detect(video);
          for (const pred of predictions) {
            const cls = (pred.class || '').toLowerCase();
            if (pred.score >= 0.40 && (cls === 'cell phone' || cls === 'remote' || cls === 'book' || cls === 'laptop')) {
              handleMalpracticeDisqualification(
                `🚨 Prohibited Object Detected: ${cls === 'cell phone' ? 'Mobile Phone' : cls} was detected in camera view! Academic integrity rules strictly prohibit electronic devices during the interview. You are permanently disqualified from retaking this interview.`,
                'mobile_phone_detected'
              );
              return;
            }
          }
        } catch (objErr) {
          console.warn('Object detector inspection warning:', objErr);
        }
      }

      // Computer Vision Canvas Heuristic for handheld mobile devices
      try {
        const cvCanvas = document.createElement('canvas');
        cvCanvas.width = 64;
        cvCanvas.height = 48;
        const cvCtx = cvCanvas.getContext('2d');
        cvCtx.drawImage(video, 0, 0, 64, 48);
        const frameData = cvCtx.getImageData(0, 0, 64, 48).data;

        // Inspect lower frame / hand zone for high-contrast rectangular device screen
        let deviceHighlightCount = 0;
        for (let y = 24; y < 46; y++) {
          for (let x = 8; x < 56; x++) {
            const idx = (y * 64 + x) * 4;
            const r = frameData[idx], g = frameData[idx + 1], b = frameData[idx + 2];
            const lum = r * 0.299 + g * 0.587 + b * 0.114;
            if (lum < 22 || (lum > 225 && Math.abs(r - b) < 12)) {
              deviceHighlightCount++;
            }
          }
        }
        if (deviceHighlightCount > 240) {
          objectDetectionViolationsRef.current = (objectDetectionViolationsRef.current || 0) + 1;
          if (objectDetectionViolationsRef.current >= 2) {
            handleMalpracticeDisqualification(
              "🚨 Prohibited Object Detected: Mobile phone / electronic device detected in camera frame! Interview permanently cancelled and retake is prohibited.",
              "mobile_phone_detected"
            );
            return;
          }
        } else {
          objectDetectionViolationsRef.current = 0;
        }
      } catch (cvErr) {
        // CV fallback
      }

      // 3. Face Movement Tracking & Multi-Face Detection
      let faceDetected = false;

      if (faceDetectorRef.current) {
        try {
          const faces = await faceDetectorRef.current.detect(video);
          if (!faces || faces.length === 0) {
            faceDetected = false;
          } else if (faces.length > 1) {
            // Multiple individuals in frame
            handleMalpracticeDisqualification(
              "🚨 Malpractice Detected: Multiple individuals detected in camera view. The interview must be conducted strictly alone. Retake is prohibited.",
              "multiple_faces_detected"
            );
            return;
          } else {
            faceDetected = true;
            faceMissingTimerRef.current = 0;

            const box = faces[0].boundingBox;
            const vW = video.videoWidth || 640;
            const vH = video.videoHeight || 480;
            const cx = (box.x + box.width / 2) / vW;
            const cy = (box.y + box.height / 2) / vH;

            if (lastFaceBoxRef.current) {
              const prev = lastFaceBoxRef.current;
              const deltaX = Math.abs(cx - prev.cx);
              const deltaY = Math.abs(cy - prev.cy);

              // Detect candidate looking away sideways (yaw) or dipping head down towards phone
              const isLookingAway = cx < 0.18 || cx > 0.82 || cy > 0.82;
              const isExcessiveMovement = deltaX > 0.28 || deltaY > 0.30;

              if (isLookingAway || isExcessiveMovement) {
                faceMovementViolationsRef.current += 1;
                if (faceMovementViolationsRef.current >= 2) {
                  handleMalpracticeDisqualification(
                    "🚨 Suspicious Face Movement Detected: Excessive movement / looking away from the interview screen was detected. Interview permanently cancelled and retake is prohibited.",
                    "face_movement_detected"
                  );
                  return;
                }
              } else {
                faceMovementViolationsRef.current = 0;
              }
            }
            lastFaceBoxRef.current = { cx, cy };
          }
        } catch {
          faceDetected = true;
        }
      } else {
        // Fallback skin-tone centroid analysis for browsers without native FaceDetector
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 40;
          canvas.height = 30;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, 40, 30);
          const imgData = ctx.getImageData(0, 0, 40, 30).data;

          let sumX = 0, sumY = 0, count = 0;
          for (let y = 0; y < 30; y++) {
            for (let x = 0; x < 40; x++) {
              const idx = (y * 40 + x) * 4;
              const r = imgData[idx], g = imgData[idx + 1], b = imgData[idx + 2];
              if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
                sumX += x;
                sumY += y;
                count++;
              }
            }
          }

          if (count < 20) {
            faceDetected = false;
          } else {
            faceDetected = true;
            faceMissingTimerRef.current = 0;
            const cx = sumX / count / 40;
            const cy = sumY / count / 30;

            if (lastFaceBoxRef.current) {
              const prev = lastFaceBoxRef.current;
              const deltaX = Math.abs(cx - prev.cx);
              const deltaY = Math.abs(cy - prev.cy);
              const isLookingAway = cx < 0.18 || cx > 0.82 || cy > 0.82;
              const isExcessiveMovement = deltaX > 0.28 || deltaY > 0.30;

              if (isLookingAway || isExcessiveMovement) {
                faceMovementViolationsRef.current += 1;
                if (faceMovementViolationsRef.current >= 2) {
                  handleMalpracticeDisqualification(
                    "🚨 Suspicious Face Movement Detected: Excessive movement / looking away from the interview screen was detected. Interview permanently cancelled and retake is prohibited.",
                    "face_movement_detected"
                  );
                  return;
                }
              } else {
                faceMovementViolationsRef.current = 0;
              }
            }
            lastFaceBoxRef.current = { cx, cy };
          }
        } catch {
          faceDetected = true;
        }
      }

      if (!faceDetected) {
        faceMissingTimerRef.current += 1;
        if (faceMissingTimerRef.current >= 2) {
          faceMissingTimerRef.current = 0;
          faceWarningCountRef.current = (faceWarningCountRef.current || 0) + 1;
          const currentCount = faceWarningCountRef.current;
          setFaceWarningCount(currentCount);

          if (currentCount === 1) {
            setFaceWarningMessage("⚠️ Warning 1/3: Candidate face not visible in camera preview! Please look directly at the screen.");
            try {
              interviewsApi.logProctoringEvent(Number(interviewId), 'face_absence_warning', 'Warning 1/3: Candidate face not visible in camera preview.');
            } catch (e) {}
          } else if (currentCount === 2) {
            setFaceWarningMessage("🚨 FINAL WARNING 2/3: Candidate face absent! A 3rd warning will permanently cancel this interview!");
            try {
              interviewsApi.logProctoringEvent(Number(interviewId), 'face_absence_warning', 'Warning 2/3: Candidate face absent (final warning).');
            } catch (e) {}
          } else if (currentCount >= 3) {
            setFaceWarningMessage("🚨 3 Face Absence Warnings Reached: Interview Disqualified.");
            handleMalpracticeDisqualification(
              "🚨 Candidate Absent Violation: Candidate face was not visible in camera preview for 3 consecutive warnings. The interview has been permanently cancelled and retake is prohibited.",
              "face_absent_3_strikes"
            );
          }
        }
      } else {
        faceMissingTimerRef.current = 0;
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [isCameraActive, completed, interviewCancelled, resumeMissingError]);

  const handleMalpracticeDisqualification = async (reason, violationType = 'malpractice') => {
    setInterviewCancelled(true);
    setCancelReason(reason);
    stopWebcam();
    if (recognitionRef.current) recognitionRef.current.stop();
    stopAiVoice();

    try {
      await interviewsApi.cancelInterview(Number(interviewId), reason, violationType);
    } catch (e) {
      console.error('Failed to cancel interview on backend:', e);
    }
  };

  const handleShuffleQuestions = async () => {
    setIsShuffling(true);
    try {
      await interviewsApi.shuffleQuestions(Number(interviewId));
      setShuffleNotice('Questions randomized and shuffled!');
      await fetchInterviewSession();
      setTimeout(() => setShuffleNotice(null), 3000);
    } catch (e) {
      console.warn('Shuffle error:', e);
    } finally {
      setIsShuffling(false);
    }
  };

  const fetchInterviewSession = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await interviewsApi.getInterview(interviewId);
      setInterview(data);
      if (data.status === 'cancelled') {
        setInterviewCancelled(true);
        setCancelReason('Interview was cancelled due to academic integrity non-compliance.');
      }
      if (data.tab_switch_count !== undefined && data.tab_switch_count !== null) setTabSwitchCount(data.tab_switch_count);
      if (data.paste_count !== undefined && data.paste_count !== null) setPasteCount(data.paste_count);
      if (data.integrity_score !== undefined && data.integrity_score !== null) setIntegrityScore(data.integrity_score);
      setTotalQuestions(5);
      const idx = data.current_question_index || 0;
      setCurrentIndex(idx);
      if (idx < 5 && data.questions && data.questions.length > idx) {
        const q = data.questions[idx];
        setCurrentQuestion(q);
        speakQuestion(q.question_text);
      } else if (idx >= 5 || data.status === 'completed') {
        setCompleted(true);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('resume')) {
        setResumeMissingError(true);
      } else {
        setLoadError(msg);
        console.error('Error loading interview session:', msg);
      }
    } finally {
      setLoading(false);
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

  // Text-To-Speech for AI Interviewer Voice (Cross-browser, anti-GC, autoplay resilient)
  const speakQuestion = (text) => {
    if (!text || !('speechSynthesis' in window) || !isAiVoiceEnabled) return;

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsVoiceActive(false);
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      // Brief delay to let browser reset audio thread
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utteranceRef.current = utterance;
          utterance.rate = 0.96;
          utterance.pitch = 1.0;
          utterance.lang = 'en-US';

          // Select natural English voice if available
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            const naturalVoice = voices.find(v => 
              v.lang.startsWith('en') && (
                v.name.includes('Natural') || 
                v.name.includes('Google') || 
                v.name.includes('Samantha') || 
                v.name.includes('Daniel') || 
                v.name.includes('Ava') || 
                v.name.includes('Jenny') ||
                v.name.includes('US')
              )
            ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

            if (naturalVoice) {
              utterance.voice = naturalVoice;
            }
          }

          utterance.onstart = () => {
            setIsAiSpeaking(true);
            setSpeechBlocked(false);
          };

          utterance.onend = () => {
            setIsAiSpeaking(false);
            utteranceRef.current = null;
          };

          utterance.onerror = (e) => {
            console.warn('Speech synthesis event:', e);
            setIsAiSpeaking(false);
            utteranceRef.current = null;
            if (e.error === 'not-allowed') {
              setSpeechBlocked(true);
            }
          };

          window.speechSynthesis.speak(utterance);

          // Autoplay blockage check for Chromium
          setTimeout(() => {
            if (window.speechSynthesis.pending && !isAiSpeaking) {
              setSpeechBlocked(true);
            }
          }, 500);

        } catch (innerErr) {
          console.warn('Utterance generation failed:', innerErr);
          setIsAiSpeaking(false);
        }
      }, 50);

    } catch (err) {
      console.warn('Speech synthesis speak failure:', err);
      setIsAiSpeaking(false);
    }
  };

  const stopAiVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
      utteranceRef.current = null;
    }
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
    setSubmissionError(null);

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
      }, 2000);

    } catch (err) {
      console.error('Submit answer error:', err);
      setSubmissionError(err.message || 'Error communicating with AI evaluation server. Please retry.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-white">Connecting to Autonomous AI Interview Room #{interviewId}...</p>
        <span className="text-xs text-slate-400">Loading candidate competencies, adaptive speech engine, and proctoring telemetry...</span>
      </div>
    );
  }

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

  if (interviewCancelled) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 sm:p-10 rounded-2xl bg-rose-950/50 border-2 border-rose-600 text-center space-y-6 shadow-2xl backdrop-blur-md animate-fadeIn">
        <div className="w-20 h-20 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-600/30">
          <Ban className="w-12 h-12 text-rose-500 animate-pulse" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-300 px-3.5 py-1 rounded-full bg-rose-950 border border-rose-700 inline-flex items-center gap-1.5 shadow-inner">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            Interview Permanently Cancelled • Retake Prohibited
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-4">
            Candidate Disqualified (Malpractice Detected)
          </h2>
          <p className="text-xs sm:text-sm text-rose-200 mt-3 max-w-lg mx-auto leading-relaxed font-medium">
            {cancelReason || 'In-camera prohibited object (mobile phone) or suspicious face movement was detected during autonomous proctoring. As per strict academic integrity protocols, this session has been permanently terminated.'}
          </p>
        </div>

        <div className="bg-slate-900/90 border border-rose-900/80 rounded-xl p-4 sm:p-5 text-left text-xs space-y-3">
          <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider flex items-center justify-between pb-2 border-b border-slate-800">
            <span>Academic Integrity Protocol Audit:</span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" /> PERMANENTLY DISQUALIFIED
            </span>
          </div>
          <div className="text-rose-300 font-mono text-[11px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
            <span>Violation: Prohibited object (mobile phone) / suspicious movement in camera</span>
          </div>
          <div className="text-slate-300 text-[11px] flex items-center justify-between">
            <span>Final Recruiter Decision:</span>
            <span className="font-bold text-rose-400">Rejected (Proctoring Malpractice)</span>
          </div>
          <div className="text-slate-300 text-[11px] flex items-center justify-between">
            <span>Integrity Score:</span>
            <span className="font-bold text-rose-400 font-mono">0.0%</span>
          </div>
          <div className="text-amber-300 text-[11px] font-bold flex items-center gap-2 pt-2 border-t border-slate-800 bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/40">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Retake Status: Strictly Prohibited. Candidate is not allowed to give or retake this interview again.</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/candidate')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Candidate Portal
          </button>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Interview Session Unavailable</h2>
        <p className="text-xs text-slate-400">
          {loadError || `Interview session #${interviewId} could not be loaded or may not exist.`}
        </p>
        <button
          onClick={() => navigate('/candidate')}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20"
        >
          Return to Candidate Portal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-800/40 border border-slate-700/60 p-3.5 sm:p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold shrink-0">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate">AI Autonomous Interview Room</h1>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              Role: <span className="text-cyan-300 font-medium">{interview?.job_title || 'Software Engineering'}</span>
            </p>
          </div>
        </div>

        {/* Progress & Voice Toggle & Proctoring */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Face Warning Counter Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold ${
            faceWarningCount === 0 
              ? 'bg-slate-900 border-slate-700 text-slate-300'
              : faceWarningCount === 1
              ? 'bg-amber-950/70 border-amber-700 text-amber-300'
              : 'bg-rose-950/80 border-rose-700 text-rose-300 animate-pulse'
          }`}>
            <Video className="w-3.5 h-3.5" />
            <span>Face: <strong className={faceWarningCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>{faceWarningCount}/3</strong></span>
          </div>

          {/* AI Proctoring Trust Badge */}
          <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all ${
            integrityScore >= 85
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
              : integrityScore >= 65
              ? 'bg-amber-950/60 text-amber-300 border-amber-800'
              : 'bg-rose-950/60 text-rose-300 border-rose-800 animate-pulse'
          }`}>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Proctoring</span>
            <span className="font-mono font-bold">{integrityScore}%</span>
            {tabSwitchCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-rose-900/60 text-rose-200 text-[10px]">
                {tabSwitchCount} sw
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] sm:text-xs">
            <span className="text-slate-400">Q:</span>
            <span className="font-extrabold text-cyan-400">
              {Math.min(currentIndex + 1, totalQuestions)} / {totalQuestions}
            </span>
          </div>

          <button
            onClick={() => {
              if (isAiVoiceEnabled) {
                stopAiVoice();
                setIsAiVoiceEnabled(false);
              } else {
                setIsAiVoiceEnabled(true);
                if (currentQuestion) speakQuestion(currentQuestion.question_text);
              }
            }}
            title={isAiVoiceEnabled ? "Mute AI Speech" : "Unmute AI Speech"}
            className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1.5 ${
              isAiVoiceEnabled ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isAiVoiceEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{isAiVoiceEnabled ? 'Voice On' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Face Visibility Warning Banner */}
      {faceWarningMessage && (
        <div className="bg-rose-950/95 border-2 border-rose-600 rounded-2xl p-3.5 sm:p-4 text-rose-200 text-xs font-bold flex items-center justify-between shadow-2xl shadow-rose-950/50 animate-bounce">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 shrink-0" />
            <span>{faceWarningMessage}</span>
          </div>
          <span className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1 rounded-full bg-rose-900 border border-rose-500 text-white uppercase tracking-wider font-extrabold shrink-0 ml-2">
            Warning {faceWarningCount}/3
          </span>
        </div>
      )}

      {/* Real-time Proctoring Alert */}
      {proctoringWarning && (
        <div className="bg-rose-950/90 border border-rose-600/80 rounded-2xl p-3.5 sm:p-4 text-rose-200 text-xs font-semibold flex items-center justify-between shadow-xl shadow-rose-950/40 animate-bounce">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{proctoringWarning}</span>
          </div>
          <button
            onClick={() => setProctoringWarning(null)}
            className="text-xs text-rose-300 hover:text-white px-2 py-1 rounded bg-rose-900/40 ml-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {completed ? (
        /* Completion Screen */
        <div className="bg-slate-800/50 border border-emerald-800/80 rounded-2xl p-6 sm:p-12 text-center max-w-2xl mx-auto space-y-5 sm:space-y-6 shadow-2xl animate-fadeIn">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800">
              Session Finished
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 sm:mt-4">Interview Completed!</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
              Your responses have been evaluated across technical accuracy, problem-solving, completeness, and reasoning. The AI evaluation report is ready.
            </p>
          </div>

          <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate(`/report/${interviewId}`)}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl font-bold text-xs sm:text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <Award className="w-4 h-4" />
              View Comprehensive Evaluation Report
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/candidate')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Return to Portal
            </button>
          </div>
        </div>
      ) : (
        /* Active Interview Layout: 2 Columns */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          
          {/* Left Column: AI Interviewer Persona & Candidate Camera (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* AI Interviewer Persona Box */}
            <div className={`bg-gradient-to-b from-slate-800/90 to-slate-900 border rounded-2xl p-4 sm:p-5 backdrop-blur-md relative overflow-hidden transition-all duration-300 ${
              isAiSpeaking ? 'border-cyan-500 shadow-xl shadow-cyan-500/20' : 'border-cyan-800/40'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isAiSpeaking ? 'bg-cyan-400 animate-ping' : 'bg-cyan-400'}`}></span>
                  <span className="text-xs font-bold text-slate-200">AI Senior Technical Interviewer</span>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border transition-colors ${
                  isAiSpeaking 
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}>
                  {isAiSpeaking ? 'Speaking Aloud' : 'Adaptive AI'}
                </span>
              </div>

              {/* Avatar Animation */}
              <div className="flex flex-col items-center justify-center py-4 sm:py-6">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl transition-all mb-3 relative ${
                  isAiSpeaking ? 'shadow-cyan-500/40 scale-105 ring-2 ring-cyan-400' : 'shadow-cyan-500/20'
                }`}>
                  <Bot className={`w-8 h-8 sm:w-10 sm:h-10 ${isAiSpeaking ? 'animate-pulse text-cyan-200' : ''}`} />
                  <div className="absolute -inset-1 rounded-2xl bg-cyan-500/20 blur-sm pointer-events-none"></div>
                </div>

                {/* Animated Soundwave */}
                <div className="flex items-center gap-1.5 h-7">
                  {[10, 22, 14, 26, 18, 12, 20].map((h, i) => (
                    <div
                      key={i}
                      style={{ 
                        height: isAiSpeaking ? `${h}px` : '4px',
                        transition: 'height 0.2s ease-in-out'
                      }}
                      className={`w-1 rounded-full ${
                        isAiSpeaking 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-400 animate-soundwave' 
                          : 'bg-slate-700'
                      }`}
                    ></div>
                  ))}
                </div>

                {/* Action button inside persona box */}
                <div className="mt-3">
                  {isAiSpeaking ? (
                    <button
                      type="button"
                      onClick={stopAiVoice}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold bg-rose-950/90 text-rose-300 border border-rose-700 flex items-center gap-1.5 shadow-md shadow-rose-950/40 hover:bg-rose-900 transition-all"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                      Stop AI Voice
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => currentQuestion && speakQuestion(currentQuestion.question_text)}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-700 hover:border-cyan-400 hover:text-white flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      Read Question Aloud
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Candidate Webcam Preview Box */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2 sm:mb-3 text-xs">
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

              <div className="aspect-video max-h-48 sm:max-h-60 lg:max-h-none bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800">
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

                {/* Face visibility status badge inside webcam */}
                <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm ${
                  faceWarningCount === 0
                    ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                    : 'bg-rose-950/90 border-rose-600 text-rose-200 animate-pulse'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${faceWarningCount === 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  <span>{faceWarningCount === 0 ? 'Face Detected' : `Face Warning ${faceWarningCount}/3`}</span>
                </div>
                
                {/* Live speech indicator badge */}
                {isListening && (
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-[10px] font-bold animate-pulse">
                    <Mic className="w-3 h-3" />
                    <span>Listening to speech...</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Autonomous AI proctoring tracks window focus and camera visibility.</span>
              </p>
            </div>

          </div>

          {/* Right Column: Question & Candidate Answer Studio (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Question Card */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
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

                {/* AI Audio Read Aloud / Stop Button */}
                {isAiSpeaking ? (
                  <button
                    type="button"
                    onClick={stopAiVoice}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/90 text-rose-300 border border-rose-700 flex items-center gap-1.5 animate-pulse shadow-md shadow-rose-950/40 hover:bg-rose-900 transition-all"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    Stop Voice
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => currentQuestion && speakQuestion(currentQuestion.question_text)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 hover:border-cyan-400 hover:text-white flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    Listen to Question
                  </button>
                )}
              </div>

              {/* Browser Autoplay Prompt if blocked */}
              {speechBlocked && !isAiSpeaking && (
                <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-600/80 text-cyan-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-fadeIn shadow-lg shadow-cyan-950/50">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Click below to hear the AI Interviewer speak this question aloud:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => currentQuestion && speakQuestion(currentQuestion.question_text)}
                    className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 shadow"
                  >
                    Play Voice Now
                  </button>
                </div>
              )}

              <h2 className="text-sm sm:text-base md:text-lg font-bold text-white leading-relaxed">
                {currentQuestion?.question_text || 'Loading next interview question...'}
              </h2>
            </div>

            {/* Answer Form Studio */}
            <form onSubmit={handleSubmitAnswer} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 sm:p-6 backdrop-blur-sm space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Your Response</span>
                  {isListening && (
                    <span className="text-[10px] text-rose-400 font-mono animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      Recording voice...
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {answerText && (
                    <button
                      type="button"
                      onClick={() => {
                        setAnswerText('');
                        preSpeechTextRef.current = '';
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 border border-slate-700 flex items-center gap-1 transition-colors"
                      title="Clear transcript to re-record"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Clear / Re-record
                    </button>
                  )}

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
              </div>

              {/* Submission Error Banner */}
              {submissionError && (
                <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-600 text-rose-200 text-xs font-semibold flex items-center justify-between animate-fadeIn shadow-lg shadow-rose-950/40">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Failed to evaluate answer: {submissionError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmissionError(null)}
                    className="text-xs text-rose-300 hover:text-white px-2 py-0.5 rounded bg-rose-900/60 ml-2 shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="relative">
                <textarea
                  rows={6}
                  required
                  value={answerText}
                  onPaste={(e) => {
                    e.preventDefault();
                    handleMalpracticeEvent('paste_attempt', 'Clipboard paste blocked on answer textarea');
                  }}
                  onChange={(e) => {
                    setAnswerText(e.target.value);
                    preSpeechTextRef.current = e.target.value;
                  }}
                  placeholder="Provide your technical answer here. Explain architectural trade-offs, algorithms, or practical implementation steps. You can also use Voice Mode to speak naturally..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-mono"
                />
              </div>

              {/* Anti-Malpractice Disclaimer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-slate-400 gap-1 px-1">
                <span className="flex items-center gap-1.5 text-cyan-400/90 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  AI Proctoring Active: Tab navigation is tracked and clipboard paste is restricted.
                </span>
                <span className="font-mono text-slate-400">
                  Trust: <span className={integrityScore >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{integrityScore}%</span>
                </span>
              </div>

              {/* Evaluation Feedback Splash */}
              {evaluationFeedback && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-700/80 animate-fadeIn">
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-slate-400">
                  {answerText.trim().split(/\s+/).filter(Boolean).length} words
                </span>

                <button
                  type="submit"
                  disabled={submitting || !answerText.trim()}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
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
