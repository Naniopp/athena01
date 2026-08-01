import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot, Plus, Pin, Pencil, Trash2, Search, Send, Copy, Sparkles, User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCampus } from "@/lib/campus/store";
import { Btn, Empty, SearchInput, timeAgo } from "@/components/campus/ui";

export const Route = createFileRoute("/dashboard/student/ai")({
  component: AthenaAI,
  head: () => ({
    meta: [
      { title: "Athena AI · ATHENA" },
      { name: "description", content: "Chat with Athena AI about attendance, assignments, placements, and your campus life." },
      { property: "og:title", content: "Athena AI · ATHENA" },
      { property: "og:description", content: "Your personal campus assistant." },
    ],
  }),
});

const SUGGESTIONS = [
  "What's my attendance?",
  "Assignments due this week",
  "Placement matches",
  "Today's classes",
];

function useAutosize(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [ref, value]);
}

function AthenaAI() {
  const chats = useCampus((s) => s.aiChats);
  const { newChat, sendAi, renameChat, pinChat, clearChats } = useCampus.getState();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [typing, setTyping] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  useAutosize(taRef, draft);

  useEffect(() => {
    if (!activeId && chats.length > 0) setActiveId(chats[0].id);
  }, [chats, activeId]);

  const active = chats.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, typing]);

  const filteredChats = useMemo(() => {
    const t = search.trim().toLowerCase();
    const list = [...chats].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at - a.at);
    return t ? list.filter((c) => c.title.toLowerCase().includes(t)) : list;
  }, [chats, search]);

  function handleNewChat() {
    const id = newChat();
    setActiveId(id);
  }

  function handleSend(body?: string) {
    const text = (body ?? draft).trim();
    if (!text) return;
    let id = activeId;
    if (!id) {
      id = newChat();
      setActiveId(id);
    }
    sendAi(id, text);
    setDraft("");
    setTyping(true);
    setTimeout(() => setTyping(false), 950);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function commitRename(id: string) {
    const t = editTitle.trim();
    if (t) renameChat(id, t);
    setEditingId(null);
  }

  function copyMessage(body: string) {
    navigator.clipboard?.writeText(body).then(() => toast.success("Copied to clipboard"));
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4 overflow-hidden">
      {/* Left rail */}
      <div className="flex w-[280px] shrink-0 flex-col rounded-[20px] border border-border bg-card p-3">
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[var(--accent)]" />
            <span className="text-sm font-semibold text-foreground">Athena AI</span>
          </div>
          <Btn size="sm" variant="accent" onClick={handleNewChat}>
            <Plus className="h-3.5 w-3.5" /> New
          </Btn>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search chats..." />
        <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
          {filteredChats.length === 0 && (
            <p className="px-2 py-8 text-center text-xs text-muted-foreground">No conversations yet.</p>
          )}
          {filteredChats.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "group flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-2.5 text-sm transition",
                c.id === activeId ? "bg-[var(--accent)]/10 text-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {editingId === c.id ? (
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => commitRename(c.id)}
                  onKeyDown={(e) => e.key === "Enter" && commitRename(c.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none"
                />
              ) : (
                <span className="flex-1 truncate">{c.title || "New conversation"}</span>
              )}
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); pinChat(c.id); }}
                  className={cn("rounded-md p-1 hover:text-[var(--accent)]", c.pinned && "text-[var(--accent)]")}
                  aria-label="Pin chat"
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setEditTitle(c.title); }}
                  className="rounded-md p-1 hover:text-foreground"
                  aria-label="Rename chat"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => { clearChats(); setActiveId(null); toast.success("All chats cleared"); }}
          className="mt-2 flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs text-destructive transition hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear all chats
        </button>
      </div>

      {/* Main pane */}
      <div className="flex flex-1 flex-col rounded-[20px] border border-border bg-card">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!active || active.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--accent)]/10">
                <Sparkles className="h-8 w-8 text-[var(--accent)]" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Ask Athena anything</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Attendance, assignments, placements, events — I can help across your whole campus life.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/8"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-5">
              {active.messages.map((m) => (
                <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    m.role === "user" ? "bg-foreground text-background" : "bg-[var(--accent)]/12 text-[var(--accent)]",
                  )}>
                    {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn("group relative max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed", m.role === "user" ? "bg-foreground text-background" : "bg-muted text-foreground")}>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <div className={cn("mt-1 flex items-center gap-2 text-[10px] opacity-60", m.role === "user" ? "justify-end" : "justify-start")}>
                      {timeAgo(m.at)}
                      <button
                        onClick={() => copyMessage(m.body)}
                        className="rounded-md p-0.5 opacity-0 transition group-hover:opacity-100 hover:opacity-100"
                        aria-label="Copy message"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent)]">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          {active && active.messages.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground transition hover:border-[var(--accent)]/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-3xl border border-border bg-background px-3 py-2 focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent)]/10">
            <textarea
              ref={taRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Message Athena... (Enter to send, Shift+Enter for newline)"
              className="max-h-40 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
            />
            <Btn variant="accent" onClick={() => handleSend()} disabled={!draft.trim()}>
              <Send className="h-4 w-4" />
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
