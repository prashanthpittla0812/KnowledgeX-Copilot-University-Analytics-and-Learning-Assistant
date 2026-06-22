import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, AlertCircle, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';

export function ManualQuestionBuilder({ questions, onChange }) {
  const handleAddQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      question: "",
      type: "MCQ",
      options: ["", "", "", ""], // default 4 options for MCQ
      answer: ""
    };
    onChange([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (index) => {
    const updated = [...questions];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    
    // Auto-adjust when type changes
    if (field === "type") {
      if (value === "MCQ") {
        updated[index].options = ["", "", "", ""];
        updated[index].answer = "";
      } else {
        updated[index].options = [];
        updated[index].answer = "";
      }
    }
    onChange(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    // If the changed option was the correct answer, update the answer string too
    if (updated[qIndex].answer === questions[qIndex].options[oIndex]) {
        updated[qIndex].answer = value;
    }
    onChange(updated);
  };

  const handleAddOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].options.push("");
    onChange(updated);
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const updated = [...questions];
    const removedOption = updated[qIndex].options[oIndex];
    updated[qIndex].options.splice(oIndex, 1);
    if (updated[qIndex].answer === removedOption) {
      updated[qIndex].answer = "";
    }
    onChange(updated);
  };

  const handleSelectCorrectOption = (qIndex, optionValue) => {
    const updated = [...questions];
    updated[qIndex].answer = optionValue;
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {questions.map((q, qIndex) => (
        <div key={q.id || qIndex} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative group">
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => handleRemoveQuestion(qIndex)}
              className="text-slate-400 hover:text-red-500 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200"
              title="Remove Question"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
              {qIndex + 1}
            </span>
            <select 
              value={q.type}
              onChange={(e) => handleQuestionChange(qIndex, "type", e.target.value)}
              className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="MCQ">Multiple Choice</option>
              <option value="Fill in the Blanks">Fill in the Blanks</option>
              <option value="Theory">Short Answer / Theory</option>
            </select>
          </div>

          <div className="space-y-4">
            <div>
              <textarea
                value={q.question}
                onChange={(e) => handleQuestionChange(qIndex, "question", e.target.value)}
                placeholder="Enter your question here..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y min-h-[80px]"
              />
            </div>

            {q.type === "MCQ" ? (
              <div className="space-y-3 pl-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Options</p>
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3">
                    <button
                      onClick={() => handleSelectCorrectOption(qIndex, opt)}
                      disabled={!opt.trim()}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        q.answer && q.answer === opt && opt.trim()
                          ? "border-emerald-500 bg-emerald-500 text-white" 
                          : "border-slate-300 hover:border-indigo-400 bg-white"
                      }`}
                      title={!opt.trim() ? "Type an option first" : "Mark as correct answer"}
                    >
                      {q.answer && q.answer === opt && opt.trim() && <CheckCircle className="w-3 h-3" />}
                    </button>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className={`w-full bg-white border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 ${
                          q.answer && q.answer === opt && opt.trim() ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200"
                        }`}
                      />
                    </div>
                    {q.options.length > 2 && (
                      <button 
                        onClick={() => handleRemoveOption(qIndex, oIndex)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                <div className="flex items-center justify-between pt-2">
                  <button 
                    onClick={() => handleAddOption(qIndex)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1.5 rounded-md"
                  >
                    <Plus className="w-3 h-3" /> Add Option
                  </button>
                  
                  {!q.answer && q.options.some(o => o.trim()) && (
                    <span className="text-xs font-medium text-orange-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Select a correct answer
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="pl-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correct Answer / Reference</p>
                <input
                  type="text"
                  value={q.answer}
                  onChange={(e) => handleQuestionChange(qIndex, "answer", e.target.value)}
                  placeholder={q.type === "Fill in the Blanks" ? "Enter the exact word(s)" : "Enter key points or exact answer"}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>
        </div>
      ))}

      <Button 
        variant="outline" 
        onClick={handleAddQuestion}
        className="w-full py-6 border-dashed border-2 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-500 hover:text-indigo-700"
      >
        <Plus className="w-5 h-5 mr-2" /> Add Question
      </Button>
    </div>
  );
}
