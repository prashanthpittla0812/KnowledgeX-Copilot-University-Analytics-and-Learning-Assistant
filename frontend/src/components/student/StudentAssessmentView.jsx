import { useState, useEffect, useRef } from "react";
import { Download, FileText, Calendar, Clock, BookOpen, AlertCircle, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { studentApi } from "../../api";

export function StudentAssessmentView({ quizId }) {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState({ submitted: false, file_name: "", submitted_at: "" });
  const [uploadFile, setUploadFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!quizId) return;
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        const res = await studentApi.getAssignedQuiz(quizId);
        setAssessment(res.data);
        
        const statusRes = await studentApi.getAssessmentStatus(quizId);
        if (statusRes.data.submitted) {
          setSubmissionStatus(statusRes.data);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load assessment details.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [quizId]);

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      await studentApi.submitAssessment(quizId, formData);
      const statusRes = await studentApi.getAssessmentStatus(quizId);
      if (statusRes.data.submitted) {
        setSubmissionStatus(statusRes.data);
      }
      setUploadFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to submit assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!assessment) return;

    try {
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.default || jspdfModule.jsPDF;
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text(`Assessment: ${assessment.topic_name || "Unknown Topic"}`, 20, 20);
      
      // Meta
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(`Type: ${assessment.question_type || "Assessment"}`, 20, 30);
      doc.text(`Questions: ${assessment.num_questions}`, 100, 30);
      
      // Line separator
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 35, 190, 35);
      
      // Questions
      let yPos = 45;
      
      assessment.questions?.forEach((q, i) => {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(79, 70, 229);
        doc.text(`Q${i + 1}.`, 20, yPos);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        
        const splitText = doc.splitTextToSize(q.question, 150);
        doc.text(splitText, 35, yPos);
        
        yPos += (splitText.length * 7) + 5;
        
        if (yPos + 80 > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setDrawColor(203, 213, 225);
        doc.setLineDashPattern([2, 2], 0);
        doc.rect(20, yPos, 170, 80);
        doc.setLineDashPattern([], 0);
        
        yPos += 95;
      });
      
      doc.save(`${assessment.topic_name || 'Assessment'}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Failed to generate PDF. Please ensure jsPDF is installed or try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Oops!</h2>
        <p className="text-slate-500">{error || "Could not find this assessment."}</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col p-6 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{assessment.topic_name}</h1>
          <p className="text-slate-500">Please review the details below and download the assessment to begin.</p>
        </div>
        <Button 
          onClick={handleDownloadPDF}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-600/20 px-6 py-6 rounded-xl text-lg font-bold"
        >
          <Download className="w-5 h-5" /> Download PDF
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Type</p>
            <p className="text-lg font-bold text-slate-900">{assessment.question_type || "Assessment"}</p>
          </div>
        </Card>
        
        <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Deadline</p>
            <p className="text-lg font-bold text-slate-900">Next Class</p>
          </div>
        </Card>
        
        <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Posted On</p>
            <p className="text-lg font-bold text-slate-900">
              {assessment.created_at ? new Date(assessment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-8 bg-white border-slate-200 shadow-sm rounded-2xl flex flex-col">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Preview Questions
        </h3>
        
        <div className="space-y-6">
          {assessment.questions?.map((q, index) => (
            <div key={index} className="p-5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex gap-4">
                <span className="font-bold text-indigo-600 text-lg">Q{index + 1}.</span>
                <p className="text-slate-800 text-lg font-medium leading-relaxed">{q.question}</p>
              </div>
            </div>
          ))}
          {(!assessment.questions || assessment.questions.length === 0) && (
            <div className="text-center py-10 text-slate-500">
              No questions found in this assessment.
            </div>
          )}
        </div>
      </Card>

      {/* Submission Section */}
      <Card className="p-8 bg-white border-slate-200 shadow-sm rounded-2xl">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-600" /> Submit Assessment
        </h3>

        {submissionStatus.submitted ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-emerald-800">Assessment Submitted Successfully</h4>
              <p className="text-emerald-600 mt-1">File: <strong>{submissionStatus.file_name}</strong></p>
              <p className="text-emerald-600 text-sm mt-1">Submitted on: {new Date(submissionStatus.submitted_at).toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-bold mb-1 text-lg">Upload your Solution PDF or Word Document</p>
              <p className="text-slate-500 text-sm">Supported formats: PDF, DOC, DOCX, ZIP</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => setUploadFile(e.target.files[0])}
              />
            </div>
            {uploadFile && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-indigo-900">{uploadFile.name}</span>
                </div>
                <Button 
                  onClick={handleUploadSubmit}
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isSubmitting ? "Uploading..." : "Submit Now"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
