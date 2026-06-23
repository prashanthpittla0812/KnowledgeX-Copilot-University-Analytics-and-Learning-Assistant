import React, { useState, useEffect } from 'react';
import { api } from "../../services/api";
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ShieldAlert, Video, Image as ImageIcon, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const PROCTOR_API_URL = "http://localhost:8000/api/v1/proctor";

export function QuizMonitoringTab({ quizId, onBack }) {
  const [monitoringData, setMonitoringData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal states
  const [activeMedia, setActiveMedia] = useState(null); // { type: 'video'|'image', url: string }
  const [activeViolations, setActiveViolations] = useState(null); // [violations array]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/proctor/faculty/quiz/${quizId}/monitoring`);
        setMonitoringData(res.data.monitoring || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load monitoring data.");
      } finally {
        setLoading(false);
      }
    };
    if (quizId) fetchData();
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-lg font-bold">{error}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <ShieldAlert className="w-5 h-5 text-orange-500" />
          Proctoring Dashboard
        </div>
      </div>

      {monitoringData.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">No attempts yet</h3>
          <p className="text-slate-500">Students have not attempted this quiz yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-bold uppercase tracking-wider">
                <th className="p-4">Student</th>
                <th className="p-4">Status</th>
                <th className="p-4">Score</th>
                <th className="p-4 text-center">Violations</th>
                <th className="p-4 text-center">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monitoringData.map((attempt, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{attempt.student_name}</p>
                    <p className="text-xs text-slate-500">{attempt.student_email}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${attempt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : attempt.status === 'AUTO_SUBMITTED' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {attempt.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 font-black text-slate-700">
                    {attempt.score !== null ? `${Math.round(attempt.score)}%` : "N/A"}
                  </td>
                  <td className="p-4 text-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveViolations(attempt.violations)}
                      className={`font-bold ${attempt.total_violations > 0 ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    >
                      {attempt.total_violations > 0 && <AlertTriangle className="w-4 h-4 mr-2 inline" />}
                      {attempt.total_violations} Violations
                    </Button>
                  </td>
                  <td className="p-4 flex items-center justify-center gap-2">
                    <Button 
                      variant="outline" 
                      disabled={!attempt.start_photo_url}
                      onClick={() => setActiveMedia({ type: 'image', url: attempt.start_photo_url })}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      title="View Start Photo"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      disabled={!attempt.recording_url}
                      onClick={() => setActiveMedia({ type: 'video', url: attempt.recording_url })}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      title="Play Session Recording"
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Media Modal */}
      {activeMedia && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setActiveMedia(null)}></div>
          
          <div className="absolute top-6 right-6 z-[110] flex gap-3 shadow-2xl">
            <a href={activeMedia.url} target="_blank" rel="noreferrer" className="bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2 rounded-xl backdrop-blur-md transition-colors font-bold flex items-center gap-2 border border-slate-700">
              Open in New Tab
            </a>
            <button onClick={() => setActiveMedia(null)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-colors font-bold shadow-lg shadow-red-500/20">
              Close
            </button>
          </div>

          <div className="bg-black rounded-2xl overflow-hidden max-w-[90vw] w-full relative z-50 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700 flex justify-center items-center p-2">
            {activeMedia.type === 'image' ? (
              <img src={activeMedia.url} alt="Proctoring evidence" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            ) : (
              <video src={activeMedia.url} controls autoPlay className="w-full max-h-[85vh] rounded-xl bg-black object-contain"></video>
            )}
          </div>
        </div>
      )}

      {/* Violations Log Modal */}
      {activeViolations !== null && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                Violation Logs
              </h3>
              <button onClick={() => setActiveViolations(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {activeViolations.length === 0 ? (
                <div className="text-center py-8 text-emerald-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-bold">No violations recorded for this attempt.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {activeViolations.map((v, i) => (
                    <li key={i} className="flex gap-4 p-4 rounded-xl border border-red-100 bg-red-50/50">
                      <div className="mt-1">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-bold text-red-900">{v.type.replace("_", " ")}</p>
                        <p className="text-sm text-red-700 mt-1">{v.details}</p>
                        <p className="text-xs text-red-400 mt-2 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(v.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
