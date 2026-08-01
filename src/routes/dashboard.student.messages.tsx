import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Paperclip, Search, ArrowLeft, Users, FileText, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCampus } from "@/lib/campus/store";
import { SearchInput, Empty, timeAgo } from "@/components/campus/ui";

export const Route = createFileRoute("/dashboard/student/messages")({
  component: MessagesPage,
  validateSearch: (s: Record<string, unknown>): { c?: string } => ({
    c: typeof s.c === "string" ? s.c : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Messages · ATHENA" },
      { name: "description", content: "Chat with faculty, classmates and club groups across your campus conversations." },
      { property: "og:title", content: "Messages · ATHENA" },
      { property: "og:description", content: "Direct messages and group chats in one place." },
    ],
  }),
});

function timeLabel(at: number) {
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessagesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const conversations = useCampus((s) => s.conversations);
  const sendMessage = useCampus((s) => s.sendMessage);
  const markConversationRead = useCampus((s) => s.markConversationRead);

  const [activeId, setActiveId] = useState<string | null>(search.c ?? null);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; kind: "file" | "image" } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (search.c && search.c !== activeId) setActiveId(search.c);
  }, [search.c]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    if (active) markConversationRead(active.id);
  }, [active?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, typing]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return conversations
      .filter((c) => !t || c.name.toLowerCase().includes(t) || c.messages.some((m) => m.body.toLowerCase().includes(t)))
      .sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0));
  }, [conversations, q]);

  const selectConversation = (id: string) => {
    setActiveId(id);
    navigate({ to: "/dashboard/student/messages", search: { c: id } });
  };

  const backToList = () => {
    setActiveId(null);
    navigate({ to: "/dashboard/student/messages", search: {} });
  };

  const handleSend = () => {
    if (!active) return;
    if (!draft.trim() && !attachment) return;
    sendMessage(active.id, draft.trim() || "(attachment)", attachment ?? undefined);
    setDraft("");
    setAttachment(null);
    setTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setTyping(false), 2000);
  };

  const pickAttachment = (kind: "file" | "image") => {
    const names = kind === "image"
      ? ["screenshot.png", "diagram.jpg", "photo.jpeg"]
      : ["lab-report.pdf", "notes.docx", "dataset.csv"];
    const name = names[Math.floor(Math.random() * names.length)];
    setAttachment({ name, kind });
    toast.success(`Attached ${name}`);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[520px] overflow-hidden rounded-[20px] border border-border bg-card">
      {/* Conversation list */}
      <div className={cn("flex w-full flex-col border-r border-border md:w-[340px]", active && "hidden md:flex")}>
        <div className="border-b border-border p-4">
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">Messages</h2>
          <SearchInput value={q} onChange={setQ} placeholder="Search conversations..." />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && <div className="p-6"><Empty title="No conversations" hint="Try a different search." /></div>}
          {filtered.map((c) => {
            const last = c.messages.at(-1);
            return (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition hover:bg-muted",
                  activeId === c.id && "bg-[var(--accent)]/8",
                )}
              >
                <img src={c.avatar} alt={c.name} className="h-11 w-11 shrink-0 rounded-full border border-border object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                      {c.kind === "group" && <Users className="h-3 w-3 text-muted-foreground" />}
                      {c.name}
                    </p>
                    {last && <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(last.at)}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-muted-foreground">{last?.body ?? "No messages yet"}</p>
                    {c.unread > 0 && <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-white">{c.unread}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat pane */}
      <div className={cn("flex w-full flex-1 flex-col", !active && "hidden md:flex")}>
        {!active ? (
          <div className="flex flex-1 items-center justify-center">
            <Empty title="Select a conversation" hint="Choose a chat from the list to start messaging." />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border p-4">
              <button onClick={backToList} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted md:hidden"><ArrowLeft className="h-4 w-4" /></button>
              <img src={active.avatar} alt={active.name} className="h-9 w-9 rounded-full border border-border object-cover" />
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {active.kind === "group" && <Users className="h-3.5 w-3.5 text-muted-foreground" />}
                  {active.name}
                </p>
                <p className="text-xs text-muted-foreground">{active.kind === "group" ? `${active.members ?? 0} members` : "Direct message"}</p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {active.messages.map((m) => (
                <div key={m.id} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                    m.from === "me" ? "bg-[var(--accent)] text-white" : "bg-muted text-foreground",
                  )}>
                    {m.attachment && (
                      <div className={cn("mb-1.5 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]", m.from === "me" ? "bg-white/20" : "bg-card")}>
                        {m.attachment.kind === "image" ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        <span className="truncate">{m.attachment.name}</span>
                      </div>
                    )}
                    <p>{m.body}</p>
                    <p className={cn("mt-1 text-[10px]", m.from === "me" ? "text-white/70" : "text-muted-foreground")}>{timeLabel(m.at)}</p>
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-border p-3">
              {attachment && (
                <div className="mb-2 flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-foreground">
                  {attachment.kind === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                  <span className="truncate">{attachment.name}</span>
                  <button onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => pickAttachment("file")} aria-label="Attach file" className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Paperclip className="h-4 w-4" /></button>
                <button onClick={() => pickAttachment("image")} aria-label="Attach image" className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><ImageIcon className="h-4 w-4" /></button>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10"
                />
                <button
                  onClick={handleSend}
                  aria-label="Send"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition hover:brightness-105 active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
