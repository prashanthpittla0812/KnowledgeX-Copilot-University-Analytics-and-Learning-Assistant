import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";

const defaultFacultyChats = [
  { id: 1, title: "Course Syllabus AI", messages: [] },
];

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const pdfInputRef = useRef(null);
  const [userName, setUserName] = useState("Professor");
  const [activeItem, setActiveItem] = useState("Chatbot");
  const [chatHistoryCollapsed, setChatHistoryCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previousChats, setPreviousChats] = useState(() => {
    const stored = localStorage.getItem("facultyChats");
    return stored ? JSON.parse(stored) : defaultFacultyChats;
  });
  const [selectedChatId, setSelectedChatId] = useState(previousChats[0]?.id || null);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) {
      navigate("/");
      return;
    }
    const cu = JSON.parse(stored);
    if (cu && cu.name) setUserName(cu.name);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New chat",
      messages: [],
    };
    const updatedChats = [newChat, ...previousChats];
    setPreviousChats(updatedChats);
    setSelectedChatId(newChat.id);
    setChatInput("");
    localStorage.setItem("facultyChats", JSON.stringify(updatedChats));
  };

  const handleSendChat = () => {
    const message = chatInput.trim();
    if (!message) return;

    const updatedChats = previousChats.map((chat) => {
      if (chat.id !== selectedChatId) return chat;

      const messages = chat.messages || [{ text: chat.message }];
      return {
        ...chat,
        messages: [...messages, { text: message }],
      };
    });

    setPreviousChats(updatedChats);
    setChatInput("");
    localStorage.setItem("facultyChats", JSON.stringify(updatedChats));
  };

  const handleAttachPdf = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please select a PDF file");
      event.target.value = "";
      return;
    }

    const pdfMessage = {
      text: `Attached PDF: ${file.name}`,
      fileName: file.name,
      fileType: "pdf",
    };

    const updatedChats = previousChats.map((chat) => {
      if (chat.id !== selectedChatId) return chat;

      const messages = chat.messages || [{ text: chat.message }];
      return {
        ...chat,
        messages: [...messages, pdfMessage],
      };
    });

    setPreviousChats(updatedChats);
    localStorage.setItem("facultyChats", JSON.stringify(updatedChats));
    event.target.value = "";
  };

  const selectedChat = previousChats.find((chat) => chat.id === selectedChatId);
  const selectedMessages = selectedChat?.messages || (selectedChat?.message ? [{ text: selectedChat.message }] : []);

  return (
    <DashboardLayout
      role="faculty"
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      userName={userName}
      handleLogout={handleLogout}
    >
      <div className={`h-full flex flex-col ${activeItem === 'Chatbot' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        
        {/* Render Dashboard Overview or Subview */}
        {activeItem === "Dashboard" ? (
          <div className="mx-auto w-full max-w-[1400px] flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight mb-2">Welcome back, {userName}</h1>
              <p className="text-sm lg:text-base text-gray-500 font-medium">Here's your faculty overview for today.</p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl">🎓</div>
                  <h3 className="font-bold text-gray-500">Active Courses</h3>
                </div>
                <p className="text-4xl font-black text-foreground">4</p>
                <p className="text-sm font-medium text-primary mt-2">CS101, PHY204...</p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 text-xl">👥</div>
                  <h3 className="font-bold text-gray-500">Students</h3>
                </div>
                <p className="text-4xl font-black text-foreground">120</p>
                <p className="text-sm font-medium text-emerald-500 mt-2">↑ 5 enrolled recently</p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 text-xl">📊</div>
                  <h3 className="font-bold text-gray-500">Avg Attendance</h3>
                </div>
                <p className="text-4xl font-black text-foreground">87%</p>
                <p className="text-sm font-medium text-emerald-500 mt-2">Steady across all batches</p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 text-xl">📝</div>
                  <h3 className="font-bold text-gray-500">Quizzes Pending Review</h3>
                </div>
                <p className="text-4xl font-black text-foreground">2</p>
                <p className="text-sm font-medium text-gray-400 mt-2">Physics Midterm, CS Quiz 3</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm min-h-[300px]">
                <h3 className="text-xl font-bold text-foreground mb-6">Recent Alerts</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
                    <p className="font-bold text-red-600 dark:text-red-400 mb-1">Low Attendance Alert</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">5 students in CS101 have dropped below 75% attendance this week.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm min-h-[300px]">
                <h3 className="text-xl font-bold text-foreground mb-6">AI Recommendations</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <p className="font-bold text-primary mb-1">Suggest Study Plan: Data Structures</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Class average for Graph Theory was 65%. Would you like the AI to generate a supplementary study guide for the class?</p>
                    <button onClick={() => setActiveItem("Chatbot")} className="mt-3 text-sm font-bold text-primary hover:underline">Draft with Copilot →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`mx-auto w-full flex flex-col ${activeItem === 'Chatbot' ? 'max-w-[1800px] flex-1 min-h-0 overflow-hidden' : 'max-w-[1400px] min-h-[calc(100vh-10rem)] p-5 lg:p-7 bg-transparent'}`}>
            
            {activeItem === "Chatbot" && (
              <div className={`flex-1 min-h-0 grid gap-8 ${chatHistoryCollapsed ? "xl:grid-cols-[82px_1fr]" : "xl:grid-cols-[450px_1fr]"}`}>
                <section className="min-h-0 rounded-[2rem] border border-gray-100 bg-white p-5 lg:p-6 shadow-xl shadow-gray-200/40 transition-all flex flex-col">
                  <div className="mb-5 flex items-center justify-between">
                    {!chatHistoryCollapsed && <h2 className="text-base font-black text-gray-800 tracking-tight pl-1">Chat History</h2>}
                    <button onClick={() => setChatHistoryCollapsed(!chatHistoryCollapsed)} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all shadow-sm font-bold text-base">{chatHistoryCollapsed ? ">" : "<"}</button>
                  </div>
                  {!chatHistoryCollapsed && (
                    <>
                      <button onClick={handleNewChat} className="mb-5 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3 text-xs font-black tracking-wide text-white transition-all hover:opacity-90 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-95 shadow-lg">+ NEW CHAT</button>
                      <div className="space-y-2 overflow-y-auto flex-1 pr-3 custom-scrollbar">
                        {previousChats.map((chat) => (
                          <button key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`w-full rounded-xl px-3 py-1.5 text-left transition-all duration-300 ${selectedChatId === chat.id ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-none scale-[1.01]" : "bg-card text-foreground hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-border hover:shadow-sm"}`}>
                            <span className={`block truncate font-extrabold text-xs ${selectedChatId === chat.id ? "text-primary" : ""}`}>{chat.title}</span>
                            <span className={`block truncate text-[10px] font-medium leading-tight ${selectedChatId === chat.id ? "text-primary/70" : "text-gray-400 dark:text-gray-500"}`}>{chat.messages?.at(-1)?.text || "Empty chat"}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </section>
                <section className="min-h-0 flex flex-col justify-between rounded-[2rem] border border-gray-100 bg-white p-5 lg:p-6 shadow-xl shadow-gray-200/40">
                  <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar mb-6">
                    {selectedChat ? (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="mb-8 border-b border-gray-100 pb-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 mb-1">Current Thread</p>
                          <h2 className="text-xl font-black text-gray-900 tracking-tight">{selectedChat.title}</h2>
                        </div>
                        {selectedMessages.length > 0 ? (
                          <div className="space-y-6">
                            {selectedMessages.map((msg, index) => (
                              <div key={index} className="ml-auto max-w-2xl">
                                <div className="rounded-2xl rounded-tr-sm bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/20">
                                  {msg.text}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center opacity-50">
                            <div className="h-16 w-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center text-2xl">👨‍🏫</div>
                            <h2 className="text-xl font-bold text-gray-900">How can Copilot assist your teaching?</h2>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center opacity-50">
                        <div className="h-16 w-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center text-2xl">✨</div>
                        <h2 className="text-xl font-bold text-gray-900">Select a chat to begin</h2>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 pt-2">
                    <div className="mx-auto w-full max-w-4xl relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl rounded-full opacity-50"></div>
                      <div className="relative flex items-center gap-3 rounded-full border border-gray-200 bg-white/90 backdrop-blur-md p-2 shadow-xl">
                        <button onClick={() => pdfInputRef.current?.click()} className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-primary transition-all">
                          <span className="text-xl font-bold">+</span>
                        </button>
                        <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handleAttachPdf} className="hidden" />
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendChat()} className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none" placeholder="Message Copilot..." />
                        <button onClick={handleSendChat} disabled={isLoading} className="flex h-11 px-6 items-center justify-center rounded-full bg-gradient-to-r from-gray-900 to-black text-sm font-black tracking-wide text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shrink-0">
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Fallback for other modules not fully redesigned yet */}
            {activeItem !== "Dashboard" && activeItem !== "Chatbot" && (
              <div className="mt-8 rounded-3xl border border-border bg-card p-12 text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚧</span>
                </div>
                <h3 className="text-2xl font-black text-foreground mb-2">{activeItem}</h3>
                <p className="text-gray-500 font-medium">
                  This module is currently being upgraded to the new SaaS platform standard.
                </p>
              </div>
            )}

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
