import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { facultyMenuItems } from "./faculty_menu";

const defaultFacultyChats = [
  { id: 1, title: "New chat", messages: [] },
];

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const pdfInputRef = useRef(null);
  const [userName, setUserName] = useState("Akshaya");
  const [activeItem, setActiveItem] = useState(facultyMenuItems[0]);
  const [collapsed, setCollapsed] = useState(false);
  const [chatHistoryCollapsed, setChatHistoryCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState("");
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
        title: messages.length === 0 ? (message.length > 34 ? `${message.slice(0, 34)}...` : message) : chat.title,
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
        title: messages.length === 0 ? file.name : chat.title,
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
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-200 text-gray-900">
      <div className="flex min-h-screen w-full flex-col gap-4 p-4 lg:flex-row lg:gap-6 lg:p-6">
        <aside className={`rounded-3xl border border-orange-100 bg-white/90 p-4 shadow-2xl shadow-orange-300/30 backdrop-blur transition-all lg:min-h-[calc(100vh-3rem)] lg:shrink-0 ${collapsed ? 'lg:w-20' : 'lg:w-72'}`}>
          <div className="mb-6 flex items-center justify-between px-2">
            {!collapsed ? (
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Faculty</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">Dashboard</h2>
              </div>
            ) : (
              <div className="text-orange-500 font-bold">F</div>
            )}
            <button onClick={() => setCollapsed((s) => !s)} className="text-gray-600 hover:text-gray-900">
              {collapsed ? '>' : '<'}
            </button>
          </div>

          <nav className="grid gap-2 px-2 sm:grid-cols-2 lg:block lg:space-y-2">
            {facultyMenuItems.map((item) => (
              <button
                key={item}
                onClick={() => setActiveItem(item)}
                className={`flex h-11 w-full items-center rounded-2xl px-3 py-2 text-left text-sm transition ${
                  activeItem === item
                    ? "bg-orange-500 text-white"
                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                }`}>
                <span className="w-8 text-center mr-2 text-gray-600">{item[0]}</span>
                <span className={collapsed ? "lg:hidden" : ""}>{item}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-6 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 transition hover:border-orange-500 hover:text-orange-500"
          >
            Logout
          </button>
        </aside>

        <main className="flex-1 rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-2xl shadow-orange-300/30 backdrop-blur lg:min-h-[calc(100vh-3rem)] lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-gray-600">Welcome back,</p>
              <h1 className="text-4xl font-bold text-gray-900">{userName}</h1>
            </div>
            <div className="rounded-3xl bg-white border border-gray-300 px-4 py-3 text-sm text-gray-600">
              <span className="font-semibold text-orange-500">{activeItem}</span> active
            </div>
          </div>

          {activeItem === "Open Chatbot" ? (
            <div className={`mt-8 grid min-h-[calc(100vh-14rem)] gap-6 ${chatHistoryCollapsed ? "xl:grid-cols-[72px_1fr]" : "xl:grid-cols-[280px_1fr]"}`}>
              <section className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 transition-all">
                <div className="mb-4 flex items-center justify-between">
                  {!chatHistoryCollapsed && <h2 className="text-lg font-semibold text-gray-900">Previous Chats</h2>}
                  <button
                    type="button"
                    onClick={() => setChatHistoryCollapsed((value) => !value)}
                    className="grid h-9 w-9 place-items-center rounded-full border border-orange-200 bg-white text-sm font-semibold text-orange-500 hover:border-orange-500"
                  >
                    {chatHistoryCollapsed ? ">" : "<"}
                  </button>
                </div>

                {chatHistoryCollapsed ? (
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="grid h-11 w-full place-items-center rounded-2xl bg-orange-500 text-lg font-semibold text-white hover:bg-orange-600"
                  >
                    +
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleNewChat}
                      className="mb-4 w-full rounded-full bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                      New Chat
                    </button>

                    <div className="space-y-2">
                      {previousChats.map((chat) => {
                        const chatMessages = chat.messages || (chat.message ? [{ text: chat.message }] : []);
                        const lastMessage = chatMessages.at(-1)?.text || "Start a new conversation";

                        return (
                          <button
                            key={chat.id}
                            type="button"
                            onClick={() => setSelectedChatId(chat.id)}
                            className={`w-full rounded-2xl px-3 py-3 text-left text-sm transition ${
                              selectedChatId === chat.id
                                ? "bg-orange-500 text-white"
                                : "bg-white text-gray-700 hover:bg-orange-100"
                            }`}
                          >
                            <span className="block truncate font-semibold">{chat.title}</span>
                            <span className={`mt-1 block truncate text-xs ${selectedChatId === chat.id ? "text-orange-50" : "text-gray-500"}`}>
                              {lastMessage}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>

              <section className="flex min-h-[520px] flex-col justify-between rounded-2xl border border-orange-100 bg-white p-5">
                <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                  {selectedChat ? (
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">Current chat</p>
                      <h2 className="mt-3 text-2xl font-bold text-gray-900">{selectedChat.title}</h2>
                      {selectedMessages.length > 0 ? (
                        <div className="mt-6 space-y-3">
                          {selectedMessages.map((chatMessage, index) => (
                            <div key={index} className="ml-auto max-w-3xl rounded-2xl bg-orange-500 px-4 py-3 text-white">
                              {chatMessage.text}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                          <h2 className="text-3xl font-semibold text-gray-900">How can KnowledgeX assist you today?</h2>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                      <h2 className="text-3xl font-semibold text-gray-900">What's on your mind today?</h2>
                    </div>
                  )}
                </div>

                <div className="mx-auto w-full max-w-4xl">
                  <div className="flex items-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-3 shadow-xl shadow-orange-100">
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="text-2xl text-gray-600 hover:text-orange-500"
                    >
                      +
                    </button>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleAttachPdf}
                      className="hidden"
                    />
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendChat();
                      }}
                      className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none"
                      placeholder="Ask anything"
                    />
                    <button
                      type="button"
                      onClick={handleSendChat}
                      className="grid h-11 w-11 place-items-center rounded-full bg-black text-sm font-semibold text-white hover:bg-orange-600"
                    >
                      Go
                    </button>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-gray-300 bg-white p-6">
                  <p className="text-sm text-gray-600">Courses Assigned</p>
                  <h2 className="mt-3 text-2xl font-semibold text-gray-900">4 active courses</h2>
                </div>
                <div className="rounded-3xl border border-gray-300 bg-white p-6">
                  <p className="text-sm text-gray-600">Next Meeting</p>
                  <h2 className="mt-3 text-2xl font-semibold text-gray-900">Faculty briefing in 2 days</h2>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-gray-300 bg-white p-6">
                <h3 className="text-xl font-semibold text-gray-900">{activeItem}</h3>
                <p className="mt-3 text-gray-600">
                  This is your {activeItem.toLowerCase()} section. Use the left sidebar to switch between dashboard options.
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
