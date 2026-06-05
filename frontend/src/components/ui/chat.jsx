import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Paperclip, Send, Loader2, Mic } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

export function ChatBubble({ message, isUser, isTyping = false }) {
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
          ? "bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-md rounded-br-sm" 
          : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] shadow-sm rounded-bl-sm"
      )}>
        <div className={cn("prose prose-sm max-w-none break-words font-medium", isUser ? "text-white" : "dark:prose-invert text-[var(--foreground)]")}>
          {isTyping ? (
            <div className="flex gap-1 py-1.5 items-center">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></span>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></span>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"></span>
            </div>
          ) : (
            <ReactMarkdown>{message}</ReactMarkdown>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md shadow-sm bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

export function ChatInput({ input, setInput, onSubmit, isSending = false, onAttachClick }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isSending) {
        onSubmit();
      }
    }
  };

  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-lg focus-within:ring-2 focus-within:ring-[var(--primary)]/50 transition-all">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message KnowledgeX Copilot..."
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
          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
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
