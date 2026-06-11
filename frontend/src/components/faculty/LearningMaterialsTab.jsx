import React, { useState, useEffect, useRef } from "react";
import { materialApi, API_BASE_URL } from "../../api";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { BookOpen, Upload, Link as LinkIcon, FileText, File, Video, Trash2, Eye, Download } from "lucide-react";
import toast from "react-hot-toast";

export function LearningMaterialsTab() {
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' or 'my-materials'
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [materialType, setMaterialType] = useState("PDF");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const res = await materialApi.getFacultyMaterials();
      setMaterials(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load materials");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "my-materials") fetchMaterials();
  }, [activeTab]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !materialType) {
      toast.error("Title and Material Type are required");
      return;
    }
    if (["LINK", "VIDEO"].includes(materialType) && !linkUrl) {
      toast.error("Please provide a valid URL");
      return;
    }
    if (!["LINK", "VIDEO"].includes(materialType) && !file) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("material_type", materialType);
      if (description) formData.append("description", description);
      if (subject) formData.append("subject", subject);
      if (topic) formData.append("topic", topic);
      if (department) formData.append("department", department);
      if (semester) formData.append("semester", semester);
      if (linkUrl) formData.append("link_url", linkUrl);
      if (file) formData.append("file", file);

      await materialApi.uploadMaterial(formData);
      toast.success("Material uploaded successfully!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setSubject("");
      setTopic("");
      setDepartment("");
      setSemester("");
      setLinkUrl("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      setActiveTab("my-materials");
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const errorMsg = Array.isArray(detail) ? detail[0]?.msg || "Validation error" : (detail || "Upload failed");
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    try {
      await materialApi.deleteMaterial(id);
      toast.success("Material deleted");
      fetchMaterials();
    } catch (error) {
      toast.error("Failed to delete material");
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case "PDF": return <FileText className="text-red-500 w-5 h-5" />;
      case "PPT": return <File className="text-orange-500 w-5 h-5" />;
      case "DOC": return <File className="text-blue-500 w-5 h-5" />;
      case "VIDEO": return <Video className="text-purple-500 w-5 h-5" />;
      case "LINK": return <LinkIcon className="text-green-500 w-5 h-5" />;
      default: return <BookOpen className="text-primary w-5 h-5" />;
    }
  };

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    let baseUrl = API_BASE_URL.replace("/api/v1", "");
    if (!baseUrl || !baseUrl.startsWith("http")) {
      baseUrl = "http://localhost:8000";
    }
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Learning Materials</h1>
          <p className="text-muted-foreground">Manage and share resources with your students.</p>
        </div>
        <div className="flex bg-orange-100/60 p-1 rounded-xl border border-orange-200/50 shadow-inner">
          <button onClick={() => setActiveTab("upload")} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "upload" ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-md text-white" : "text-orange-900/60 hover:text-orange-900 hover:bg-orange-200/50"}`}>Upload</button>
          <button onClick={() => setActiveTab("my-materials")} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "my-materials" ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-md text-white" : "text-orange-900/60 hover:text-orange-900 hover:bg-orange-200/50"}`}>My Materials</button>
        </div>
      </div>

      {activeTab === "upload" && (
        <Card className="max-w-3xl mx-auto glass-card">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Title *</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="Enter title" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Material Type *</label>
                  <select required value={materialType} onChange={e => setMaterialType(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none">
                    <option value="PDF">PDF Document</option>
                    <option value="PPT">Presentation (PPT)</option>
                    <option value="DOC">Word Document (DOC)</option>
                    <option value="NOTE">Study Notes</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="VIDEO">Video Link</option>
                    <option value="LINK">Reference Link</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-1 block">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px]" placeholder="Brief description of the material..." />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Subject *</label>
                  <input required value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="e.g., Computer Networks" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Topic *</label>
                  <input required value={topic} onChange={e => setTopic(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="e.g., TCP/IP" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Department</label>
                  <input value={department} onChange={e => setDepartment(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="e.g., CSE" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Semester</label>
                  <input value={semester} onChange={e => setSemester(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="e.g., 6" />
                </div>
              </div>

              <div className="border-t border-border pt-6 mt-6">
                {["LINK", "VIDEO"].includes(materialType) ? (
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Resource URL *</label>
                    <input type="url" required value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="https://..." />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Upload File *</label>
                    <input ref={fileInputRef} type="file" required onChange={e => setFile(e.target.files[0])} className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                  </div>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-12">
                {isLoading ? "Uploading..." : <><Upload className="w-4 h-4 mr-2" /> Upload Material</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "my-materials" && (
        <div className="grid gap-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading materials...</p>
          ) : materials.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-2xl bg-muted/20">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground font-medium">No materials uploaded yet.</p>
              <Button variant="outline" className="mt-4" onClick={() => setActiveTab("upload")}>Upload your first material</Button>
            </div>
          ) : (
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4 text-center">Stats</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {materials.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getIcon(m.material_type)}
                            <div>
                              <p className="font-bold text-foreground">{m.title}</p>
                              <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium">{m.subject || "-"}</p>
                          <p className="text-xs text-muted-foreground">{m.topic || "-"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-4 text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1" title="Views"><Eye className="w-3 h-3" /> {m.views_count}</span>
                            <span className="flex items-center gap-1" title="Downloads"><Download className="w-3 h-3" /> {m.downloads_count}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => window.open(getFullUrl(m.file_url), '_blank')}>View</Button>
                            <Button size="icon" variant="destructive" className="h-9 w-9" onClick={() => handleDelete(m.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  );
}
