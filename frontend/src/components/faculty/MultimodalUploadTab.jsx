import React, { useState, useRef } from "react";
import { documentApi } from "../../api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Upload, FileAudio, FileVideo, FileImage, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function MultimodalUploadTab() {
  const [file, setFile] = useState(null);
  const [asrProvider, setAsrProvider] = useState("Whisper");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("asr_provider", asrProvider);

    try {
      setIsUploading(true);
      await documentApi.uploadMultimodal(formData);
      toast.success("Multimodal content uploaded and processed successfully!");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.detail || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload Multimodal Content
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload Audio (MP3, WAV), Video (MP4, AVI), Images (JPG, PNG), or Scanned PDFs. Our AI will transcribe, OCR, and index the content into the Knowledge Base.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select File</label>
                <div 
                  className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center cursor-pointer hover:bg-[var(--muted)]/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.mp3,.wav,.m4a,.flac,.mp4,.avi,.mov,.mkv"
                  />
                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileAudio className="w-10 h-10 text-primary mb-2" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Upload className="w-10 h-10 mb-2 opacity-50" />
                      <p className="font-medium">Click to select a file</p>
                      <p className="text-xs mt-1">Supports Audio, Video, Images, and PDFs</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ASR Provider (For Audio/Video)</label>
                  <select 
                    value={asrProvider}
                    onChange={(e) => setAsrProvider(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="Whisper">OpenAI Whisper (Local)</option>
                    <option value="Vibe Voice">Vibe Voice (Simulated)</option>
                    <option value="Gonthuka">Gonthuka (Simulated)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Select the transcription engine to use for audio and video files.</p>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isUploading || !file} className="w-full">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upload and Process"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
