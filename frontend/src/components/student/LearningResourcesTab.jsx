import React, { useState, useEffect } from "react";
import { materialApi } from "../../api";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { BookOpen, Search, Download, Eye, Bookmark, BookmarkCheck, FileText, File, Video, Link as LinkIcon, Filter, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export function LearningResourcesTab() {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState("");
  const [materialType, setMaterialType] = useState("");

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const res = await materialApi.getStudentMaterials({ search, subject, department, material_type: materialType });
      setMaterials(res.data);
    } catch (error) {
      toast.error("Failed to fetch materials");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [subject, department, materialType]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  const handleAction = async (material, action) => {
    try {
      if (action === "VIEW") {
        window.open(material.file_url, '_blank');
      } else if (action === "DOWNLOAD") {
        const link = document.createElement('a');
        link.href = material.file_url;
        link.download = material.title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      // Track action silently
      await materialApi.trackAction(material.id, action);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleBookmark = async (id) => {
    try {
      const res = await materialApi.toggleBookmark(id);
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, is_bookmarked: res.data.is_bookmarked } : m));
      toast.success(res.data.is_bookmarked ? "Bookmarked!" : "Removed from bookmarks");
    } catch (error) {
      toast.error("Failed to update bookmark");
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case "PDF": return <FileText className="text-red-500 w-8 h-8" />;
      case "PPT": return <File className="text-orange-500 w-8 h-8" />;
      case "DOC": return <File className="text-blue-500 w-8 h-8" />;
      case "VIDEO": return <Video className="text-purple-500 w-8 h-8" />;
      case "LINK": return <LinkIcon className="text-green-500 w-8 h-8" />;
      case "NOTES": return <BookOpen className="text-emerald-500 w-8 h-8" />;
      default: return <FileText className="text-primary w-8 h-8" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Learning Resources</h1>
          <p className="text-muted-foreground">Discover, learn, and grow with materials from your faculty.</p>
        </div>
      </div>

      <Card className="glass-card mb-8">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                placeholder="Search materials by title..." 
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              <select value={materialType} onChange={e => setMaterialType(e.target.value)} className="rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none whitespace-nowrap">
                <option value="">All Types</option>
                <option value="PDF">PDF</option>
                <option value="PPT">PPT</option>
                <option value="DOC">Word Doc</option>
                <option value="VIDEO">Video</option>
                <option value="LINK">Link</option>
                <option value="NOTES">Notes</option>
                <option value="ASSIGNMENT">Assignment</option>
              </select>
              <select value={subject} onChange={e => setSubject(e.target.value)} className="rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none whitespace-nowrap">
                <option value="">All Subjects</option>
                <option value="Computer Networks">Computer Networks</option>
                <option value="Operating Systems">Operating Systems</option>
                <option value="DBMS">DBMS</option>
              </select>
              <Button type="submit" className="shrink-0 h-[46px]">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 rounded-xl bg-muted/20 animate-pulse border"></div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-2xl bg-muted/10">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No resources found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
          <Button variant="outline" className="mt-6" onClick={() => {setSearch(""); setSubject(""); setMaterialType("");}}>Clear Filters</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => (
            <Card key={m.id} className="group glass-card overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="p-6 relative">
                  <div className="absolute top-4 right-4">
                    <button onClick={() => handleToggleBookmark(m.id)} className="text-muted-foreground hover:text-primary transition-colors">
                      {m.is_bookmarked ? <BookmarkCheck className="w-6 h-6 text-primary fill-primary/20" /> : <Bookmark className="w-6 h-6" />}
                    </button>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {getIcon(m.material_type)}
                  </div>
                  <h3 className="text-lg font-bold leading-tight mb-2 line-clamp-2" title={m.title}>{m.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">{m.material_type}</span>
                    <span>• {m.subject || "General"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{m.description || "No description provided."}</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{m.faculty_name?.charAt(0)}</div>
                      <span>{m.faculty_name}</span>
                    </div>
                    <span>{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 border-t divide-x divide-border">
                  <button onClick={() => handleAction(m, 'VIEW')} className="py-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-muted/50 hover:text-primary transition-colors">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  {["LINK", "VIDEO"].includes(m.material_type) ? (
                    <button onClick={() => handleAction(m, 'VIEW')} className="py-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-muted/50 hover:text-primary transition-colors">
                      <ExternalLink className="w-4 h-4" /> Open
                    </button>
                  ) : (
                    <button onClick={() => handleAction(m, 'DOWNLOAD')} className="py-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-muted/50 hover:text-primary transition-colors">
                      <Download className="w-4 h-4" /> Download
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
