import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Paperclip, Send, Loader2, Mic, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

export function ChatBubble({ message, sources, isUser, isTyping = false }) {
  const [feedback, setFeedback] = React.useState(null);

  return (
    <div className={cn("flex w-full gap-4 p-4 md:p-6 transition-all", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--border)] shadow-sm bg-[var(--card)] text-[var(--foreground)]">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      )}
      
      <div className={cn(
        "flex flex-col space-y-2 overflow-hidden px-4 py-3 rounded-2xl max-w-[85%]",
        isUser 
          ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md rounded-br-sm" 
          : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] shadow-sm rounded-bl-sm"
      )}>
        <div className={cn("prose prose-sm max-w-none break-words font-medium", isUser ? "text-white" : "text-[var(--foreground)]")}>
          {isTyping ? (
            <div className="flex gap-1 py-1.5 items-center">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></span>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></span>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"></span>
            </div>
          ) : (
            <>
              <ReactMarkdown>{message}</ReactMarkdown>
              {sources && sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-primary/20 text-xs text-muted-foreground/80 space-y-1">
                  <p className="font-semibold text-primary/80 mb-1">Sources:</p>
                  {sources.map((s, idx) => (
                    <div key={idx} className="flex flex-col mb-2 p-2 bg-primary/5 rounded-md border border-primary/10">
                      <span className="font-medium text-foreground">{typeof s === 'string' ? s : s.source}</span>
                      {typeof s !== 'string' && (
                        <div className="flex gap-2 mt-1 opacity-70">
                          <span>{s.source_type}</span>
                          <span>&bull;</span>
                          <span>{s.timestamp_or_page}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!isUser && (
                <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-border/10">
                  <button 
                    onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                    className={cn("p-1 rounded transition-colors", feedback === 'up' ? "text-green-500 bg-green-500/10" : "text-muted-foreground opacity-60 hover:opacity-100 hover:text-green-500 hover:bg-green-500/10")} 
                    title="Helpful"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                    className={cn("p-1 rounded transition-colors", feedback === 'down' ? "text-red-500 bg-red-500/10" : "text-muted-foreground opacity-60 hover:opacity-100 hover:text-red-500 hover:bg-red-500/10")} 
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md shadow-sm bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

export function ChatInput({ input, setInput, onSubmit, isSending = false, onAttachClick }) {
  const [isListening, setIsListening] = React.useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isSending) {
        onSubmit();
      }
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + " " + transcript : transcript));
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);

      let errorMessage = `Microphone error (${event.error}). Please try again.`;
      if (event.error === 'not-allowed') {
        errorMessage = "Microphone access was denied. Please click the microphone icon in your address bar to allow it.";
      } else if (event.error === 'no-speech') {
        errorMessage = "No speech was detected.";
      } else if (event.error === 'audio-capture') {
        errorMessage = "No microphone was found. Please ensure a microphone is plugged in and recognized by your system.";
      } else if (event.error === 'network') {
        errorMessage = "Network error. Speech recognition requires an internet connection.";
      }
      
      // Use toast or alert depending on what's available
      alert(errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-lg focus-within:ring-2 focus-within:ring-[var(--primary)]/50 transition-all">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? "Listening..." : "Message KnowledgeX Copilot..."}
        className="min-h-[60px] w-full resize-none bg-transparent px-4 pt-4 pb-12 focus:outline-none sm:text-sm custom-scrollbar text-[var(--foreground)]"
        rows={1}
        style={{ height: 'auto', maxHeight: '200px' }}
      />
      <div className="absolute left-2 bottom-2 flex items-center gap-1">
        {onAttachClick && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
            onClick={onAttachClick}
            title="Attach File"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleVoiceInput}
          className={cn("h-8 w-8 rounded-full transition-all", isListening ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 animate-pulse" : "text-muted-foreground hover:bg-muted")}
          title="Voice Input"
        >
          <Mic className="h-4 w-4" />
        </Button>
      </div>
      <div className="absolute right-2 bottom-2 flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full transition-all shadow-sm",
            input.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
          )}
          disabled={!input.trim() || isSending}
          onClick={onSubmit}
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
