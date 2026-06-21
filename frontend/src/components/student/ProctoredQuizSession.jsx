import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as faceapi from 'face-api.js';
import { AlertCircle, Camera, Monitor, Smartphone, Maximize, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import api from '../../api';

export function ProctoredQuizSession({ quiz, onActualSubmit, onCancel, renderQuizContent }) {
  const [phase, setPhase] = useState("setup"); // setup, ready, active, submitting, completed
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [violations, setViolations] = useState(0);
  const [timeLeft, setTimeLeft] = useState(quiz.duration_minutes * 60);
  const [recordingStatus, setRecordingStatus] = useState("Not Recording");

  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const detectionIntervalRef = useRef(null);
  const timerRef = useRef(null);
  
  const cocoModelRef = useRef(null);

  // Setup Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        const coco = await cocoSsd.load();
        cocoModelRef.current = coco;
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load AI models:", err);
        setErrorMsg("Failed to load proctoring models. Please refresh and try again.");
      }
    };
    loadModels();
  }, []);

  // Request Camera
  const handleEnableCamera = useCallback(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setCameraEnabled(true);
      })
      .catch((err) => {
        console.error("Camera access denied:", err);
        setErrorMsg("Camera and microphone access is required for proctored quizzes.");
      });
  }, []);

  // Log Violation
  const logViolation = async (type, details) => {
    if (phase !== "active") return;
    try {
      const formData = new FormData();
      formData.append("quiz_id", quiz.id);
      formData.append("violation_type", type);
      if (details) formData.append("details", details);

      const res = await api.post(`/proctor/log-violation`, formData);

      setViolations(res.data.total_violations);

      if (res.data.auto_submit) {
        alert("Maximum violations exceeded. Your quiz will be automatically submitted.");
        handleFinalSubmit();
      }
    } catch (err) {
      console.error("Failed to log violation:", err);
    }
  };

  // Fullscreen and Tab monitoring
  useEffect(() => {
    if (phase !== "active") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation("TAB_SWITCH", "User switched tabs or minimized the browser.");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logViolation("FULLSCREEN_EXIT", "User exited fullscreen mode.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [phase, quiz.id]);

  // AI Detection Loop
  useEffect(() => {
    if (phase !== "active" || !cameraEnabled) return;

    const detect = async () => {
      if (!webcamRef.current || !webcamRef.current.video || webcamRef.current.video.readyState !== 4) return;
      const video = webcamRef.current.video;

      try {
        // Face detection
        const faces = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        if (faces.length === 0) {
          logViolation("NO_FACE", "No face detected in the frame.");
        } else if (faces.length > 1) {
          logViolation("MULTIPLE_FACES", `Detected ${faces.length} faces in the frame.`);
        }

        // Phone detection
        if (cocoModelRef.current) {
          const predictions = await cocoModelRef.current.detect(video, 20, 0.35);
          const phoneDetected = predictions.some(p => 
            p.class === "cell phone" || p.class === "remote"
          );
          if (phoneDetected) {
            logViolation("MOBILE_PHONE", "Mobile phone detected in the frame.");
          }
        }
      } catch (err) {
        console.error("Detection error:", err);
      }
    };

    detectionIntervalRef.current = setInterval(detect, 3000);
    return () => clearInterval(detectionIntervalRef.current);
  }, [phase, cameraEnabled]);

  // Timer
  useEffect(() => {
    if (phase !== "active") return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          alert("Time is up! Your quiz will be automatically submitted.");
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Start Recording
  const startRecording = () => {
    if (!webcamRef.current || !webcamRef.current.stream) return;
    recordedChunks.current = [];
    try {
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream);
      mediaRecorderRef.current.addEventListener("dataavailable", handleDataAvailable);
      mediaRecorderRef.current.start();
      setRecordingStatus("Recording");
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      alert("Warning: Could not start video recording. Your webcam might not be fully supported: " + err.message);
    }
  };

  const handleDataAvailable = ({ data }) => {
    if (data.size > 0) {
      recordedChunks.current.push(data);
    }
  };

  const stopRecordingAndUpload = async () => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        resolve(null);
        return;
      }
      mediaRecorderRef.current.onstop = async () => {
        const actualMimeType = mediaRecorderRef.current.mimeType || "video/webm";
        const blob = new Blob(recordedChunks.current, { type: actualMimeType });
        
        try {
          const formData = new FormData();
          formData.append("quiz_id", quiz.id);
          formData.append("file", blob, "recording.webm");
          await api.post(`/proctor/upload-recording`, formData);
          resolve(true);
        } catch (err) {
          console.error("Failed to upload recording:", err);
          alert("Recording upload failed: " + (err.response?.data?.detail || err.message));
          resolve(false);
        }
      };
      mediaRecorderRef.current.stop();
      setRecordingStatus("Stopped");
    });
  };

  const handleStartQuiz = async () => {
    if (!webcamRef.current) return;
    setPhase("ready"); // Show a loading state temporarily
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error("Could not capture photo");
      
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      
      const formData = new FormData();
      formData.append("quiz_id", quiz.id);
      formData.append("file", blob, "start_photo.jpg");
      await api.post(`/proctor/capture-photo`, formData);

      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(e => console.log(e));
      }

      startRecording();
      setPhase("active");
    } catch (err) {
      console.error(err);
      setErrorMsg(`Failed: ${err?.response?.data?.detail || err?.message || 'Unknown error'}`);
      setPhase("setup");
    }
  };

  const handleFinalSubmit = async (answers = null) => {
    setPhase("submitting");
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(e => console.log(e));
    }
    
    await stopRecordingAndUpload();
    
    // Call the parent's actual submit function
    if (onActualSubmit) {
      await onActualSubmit(answers);
    }
    setPhase("completed");
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (phase === "setup" || phase === "ready") {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card className="border-orange-200 bg-white shadow-lg overflow-hidden">
          <div className="bg-orange-500 text-white p-6 flex items-center gap-4">
            <ShieldAlert className="w-10 h-10" />
            <div>
              <h2 className="text-2xl font-black">AI Proctored Assessment</h2>
              <p className="text-orange-100 font-medium">{quiz.topic} • {quiz.duration_minutes} Minutes</p>
            </div>
          </div>
          <CardContent className="p-8 space-y-8">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex gap-3 items-center">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="font-semibold">{errorMsg}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">Proctoring Rules</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-slate-500 mt-0.5" />
                    <span className="text-slate-600 text-sm">Your camera and microphone will be recorded. Make sure your face is clearly visible.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Monitor className="w-5 h-5 text-slate-500 mt-0.5" />
                    <span className="text-slate-600 text-sm">Do not switch tabs or minimize the browser. This will be logged as a violation.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-slate-500 mt-0.5" />
                    <span className="text-slate-600 text-sm">Mobile phones are strictly prohibited. AI will detect phone usage.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Maximize className="w-5 h-5 text-slate-500 mt-0.5" />
                    <span className="text-slate-600 text-sm">The quiz will open in Full-Screen mode. Exiting is a violation.</span>
                  </li>
                </ul>
                <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm font-semibold border border-orange-100 mt-4">
                  Max Violations Allowed: {quiz.max_violations || 3}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden relative shadow-inner">
                  {cameraEnabled ? (
                    <Webcam
                      ref={webcamRef}
                      audio={true}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover"
                      videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2">
                      <Camera className="w-10 h-10" />
                      <span className="text-sm font-medium">Camera Disabled</span>
                    </div>
                  )}
                </div>

                {!cameraEnabled ? (
                  <Button onClick={handleEnableCamera} className="w-full h-12 bg-slate-800 hover:bg-slate-900 font-bold">
                    Enable Camera & Mic
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStartQuiz} 
                    disabled={!modelsLoaded || phase === "ready"} 
                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 font-bold text-white shadow-lg shadow-orange-500/30"
                  >
                    {!modelsLoaded ? "Loading AI Models..." : phase === "ready" ? "Starting..." : "Capture Photo & Start"}
                  </Button>
                )}
                <Button variant="ghost" onClick={onCancel} className="w-full text-slate-500">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "submitting" || phase === "completed") {
    return (
      <div className="max-w-xl mx-auto py-16 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          {phase === "submitting" ? (
            <span className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <CheckCircle className="w-12 h-12" />
          )}
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">
          {phase === "submitting" ? "Uploading Recording..." : "Quiz Submitted Successfully!"}
        </h2>
        <p className="text-slate-500">
          {phase === "submitting" ? "Please wait while we securely upload your exam session." : "Your video and answers have been securely submitted to your professor."}
        </p>
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-slate-50">
      {/* Top Proctoring Bar */}
      <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shrink-0 shadow-md relative z-50">
        <div className="flex items-center gap-4">
          <ShieldAlert className="w-5 h-5 text-orange-500" />
          <span className="font-bold text-sm tracking-widest uppercase text-slate-300">Proctored Session Active</span>
          {recordingStatus === "Recording" && (
            <span className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Recording
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-8">
          {violations > 0 && (
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              Violations: {violations} / {quiz.max_violations || 3}
            </div>
          )}
          <div className="text-2xl font-black font-mono text-emerald-400 tracking-wider">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Floating Webcam Thumbnail */}
      <div className="absolute bottom-6 right-6 w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700 z-50 group">
        <Webcam
          ref={webcamRef}
          audio={false}
          muted={true}
          className="w-full h-full object-contain bg-slate-900"
          videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white tracking-widest uppercase">
          Live Feed
        </div>
      </div>

      {/* Actual Quiz Content */}
      <div className="flex-1 overflow-y-auto p-8 relative z-10">
        {renderQuizContent(handleFinalSubmit)}
      </div>
    </div>,
    document.body
  );
}
