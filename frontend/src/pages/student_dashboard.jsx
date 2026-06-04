import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  "Attendance",
  "Chatbot",
  "Quizzes",
  "Quizzes History",
  "Studyplan",
  "Recommendations",
  "Quiz Results",
  "Analytics",
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const pdfInputRef = useRef(null);
  const [userName, setUserName] = useState("Akshaya");
  const [activeItem, setActiveItem] = useState("Chatbot");
  const [collapsed, setCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [previousChats, setPreviousChats] = useState(() => {
    const stored = localStorage.getItem("studentChats");
    return stored
      ? JSON.parse(stored)
      : [
          { id: 1, title: "Math revision plan", messages: [{ text: "Help me revise calculus before quiz." }] },
          { id: 2, title: "Physics doubts", messages: [{ text: "Explain Newton's laws with examples." }] },
          { id: 3, title: "Study timetable", messages: [{ text: "Make a weekly study timetable." }] },
        ];
  });
  const [selectedChatId, setSelectedChatId] = useState(previousChats[0]?.id || null);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) {
      navigate("/");
      return;
    }
    const cu = JSON.parse(stored);
    if (cu?.name) setUserName(cu.name);
  }, [navigate]);

  // ✅ MENU CLICK HANDLER (IMPORTANT UPDATE)
  const handleMenuClick = (item) => {
    setActiveItem(item);

    if (item === "Attendance") {
      navigate("/student-dashboard/attendance");
    }
  };

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
    localStorage.setItem("studentChats", JSON.stringify(updatedChats));
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
    localStorage.setItem("studentChats", JSON.stringify(updatedChats));
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
    localStorage.setItem("studentChats", JSON.stringify(updatedChats));
    event.target.value = "";
  };

  const selectedChat = previousChats.find((chat) => chat.id === selectedChatId);
  const selectedMessages = selectedChat?.messages || (selectedChat?.message ? [{ text: selectedChat.message }] : []);
  const firstSelectedMessage = selectedMessages[0]?.text;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-200 text-gray-900">
      <div className="flex min-h-screen w-full flex-col gap-4 p-4 lg:flex-row lg:gap-6 lg:p-6">

        {/* SIDEBAR */}
        <aside className={`rounded-3xl border border-orange-100 bg-white/90 p-4 shadow-2xl shadow-orange-300/30 backdrop-blur transition-all lg:min-h-[calc(100vh-3rem)] lg:shrink-0 ${collapsed ? "lg:w-20" : "lg:w-72"}`}>

          <div className="mb-6 flex items-center justify-between px-2">
            {!collapsed ? (
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                  Student
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">Dashboard</h2>
              </div>
            ) : (
              <div className="text-orange-500 font-bold">S</div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-600 hover:text-gray-900"
            >
              {collapsed ? ">" : "<"}
            </button>
          </div>

          {/* MENU */}
          <nav className="grid gap-2 px-2 sm:grid-cols-2 lg:block lg:space-y-2">
            {menuItems.map((item) => (
              <button
                key={item}
                onClick={() => handleMenuClick(item)}
                className={`flex h-11 w-full items-center rounded-2xl px-3 py-2 text-left text-sm transition ${
                  activeItem === item
                    ? "bg-orange-500 text-white"
                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                <span className="w-8 text-center mr-2 text-gray-600">{item[0]}</span>
                <span className={collapsed ? "lg:hidden" : ""}>{item}</span>
              </button>
            ))}
          </nav>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="mt-6 w-full rounded-2xl border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-orange-500 hover:text-orange-500"
          >
            Logout
          </button>
        </aside>

        {/* MAIN */}
        <main className="flex-1 rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-2xl shadow-orange-300/30 backdrop-blur lg:min-h-[calc(100vh-3rem)] lg:p-8">

          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
            <div>
              <p className="text-gray-600">Welcome back</p>
              <h1 className="text-4xl font-bold text-gray-900">{userName}</h1>
            </div>

            <div className="bg-white px-4 py-2 rounded-2xl border border-gray-300">
              <span className="text-orange-500 font-bold">
                {activeItem}
              </span>{" "}
              active
            </div>
          </div>

          {activeItem === "Chatbot" ? (
            <div className="mt-8 grid min-h-[calc(100vh-14rem)] gap-6 xl:grid-cols-[280px_1fr]">
              <section className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Previous Chats</h2>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="rounded-full bg-orange-500 px-3 py-1 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    New Chat
                  </button>
                </div>

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
              </section>

              <section className="flex min-h-[520px] flex-col justify-between rounded-2xl border border-orange-100 bg-white p-5">
                <div>
                  {selectedChat ? (
                    <div className="max-w-3xl">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">Current chat</p>
                      <h2 className="mt-3 text-2xl font-bold text-gray-900">{selectedChat.title}</h2>
                      {firstSelectedMessage ? (
                        <div className="mt-6">
                          <div className="rounded-2xl bg-orange-500 px-4 py-3 text-white">
                            {firstSelectedMessage}
                          </div>
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
            <div className="mt-10 text-gray-600">
              Select an option from sidebar to view content
            </div>
          )}

        </main>

      </div>
    </div>
  );
}
