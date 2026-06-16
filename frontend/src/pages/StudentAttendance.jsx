import React from 'react';

export default function StudentAttendance() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-2xl w-full text-center border border-slate-100">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Student Attendance</h1>
        <p className="text-slate-500 font-medium">This page is currently under construction. Attendance tracking features will be available here soon.</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-8 bg-slate-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-800 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
