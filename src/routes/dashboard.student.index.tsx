import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon, BarChart3, Megaphone, Heart, MessageCircle, Share2, Bookmark,
  MoreHorizontal, Sparkles, Send, Trash2, Pencil, Flag, Calendar as CalendarIcon,
  ArrowUpRight, TrendingUp, Zap, CheckCircle2, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCampus } from "@/lib/campus/store";
import {
  campusNews, seedAssignments, seedCalendar, seedEvents, type Post, type PostCategory, type PostKind,
} from "@/lib/campus/seed";
import { Badge, Btn, Card, Chip, Empty, Modal, Progress, Skeleton, timeAgo, useLoading } from "@/components/campus/ui";

const R = "/dashboard/student";

const CATEGORIES: (PostCategory | "All")[] = [
  "All", "Announcements", "Academics", "Assignments", "Clubs", "Placements", "Research", "Events",
];

export const Route = createFileRoute("/dashboard/student/")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
    compose: typeof s.compose === "string" ? s.compose : "",
  }),
  component: FeedPage,
  head: () => ({
    meta: [
      { title: "Campus Feed · ATHENA" },
      { name: "description", content: "Your live campus feed — announcements, assignments, clubs, placements and AI insights in one premium student workspace." },
      { property: "og:title", content: "Campus Feed · ATHENA" },
      { property: "og:description", content: "The digital heartbeat of your university." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function FeedPage() {
  const { q, compose } = Route.useSearch();
  const loading = useLoading(450);
  const posts = useCampus((s) => s.posts);
  const profile = useCampus((s) => s.profile);
  const [cat, setCat] = useState<PostCategory | "All">("All");
  const [query, setQuery] = useState(q);
  const [sort, setSort] = useState<"recent" | "top">("recent");
  const [showCompose, setShowCompose] = useState(compose === "1");

  const shown = useMemo(() => {
    const t = query.trim().toLowerCase();
    return posts
      .filter((p) => (cat === "All" ? true : p.category === cat))
      .filter((p) => (!t ? true : (p.body + p.author + p.category).toLowerCase().includes(t)))
      .sort((a, b) => (sort === "recent" ? b.createdAt - a.createdAt : b.likes - a.likes));
  }, [posts, cat, query, sort]);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        <Composer open={showCompose} setOpen={setShowCompose} />

        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the feed..."
            className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10"
          />
          <div className="flex gap-2">
            <Chip active={sort === "recent"} onClick={() => setSort("recent")}>Recent</Chip>
            <Chip active={sort === "top"} onClick={() => setSort("top")}>Top</Chip>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : shown.length === 0 ? (
          <Empty title="Nothing here yet" hint="Try another category, or post the first update for your campus." />
        ) : (
          <div className="space-y-4">
            {shown.map((p) => <PostCard key={p.id} post={p} me={profile.name} />)}
          </div>
        )}
      </div>

      <aside className="hidden space-y-5 xl:block">
        <div className="sticky top-[84px] space-y-5">
          <AiWidget />
          <TodayWidget />
          <DeadlinesWidget />
          <EventsWidget />
          <NewsWidget />
        </div>
      </aside>
    </div>
  );
}

/* --------------------------------- Composer -------------------------------- */

function Composer({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const profile = useCampus((s) => s.profile);
  const addPost = useCampus((s) => s.addPost);
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<PostCategory>("Academics");
  const [kind, setKind] = useState<PostKind>("text");
  const [image, setImage] = useState<string | undefined>();
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setBody(""); setKind("text"); setImage(undefined); setPollOptions(["", ""]); setError(null); setOpen(false);
  };

  const submit = () => {
    if (body.trim().length < 3) { setError("Write at least a few words."); return; }
    if (kind === "poll" && pollOptions.filter((o) => o.trim()).length < 2) {
      setError("A poll needs at least two options."); return;
    }
    addPost({
      body: body.trim(),
      category,
      kind,
      image,
      pollOptions: kind === "poll" ? pollOptions.map((o) => o.trim()).filter(Boolean) : undefined,
    });
    toast.success("Posted to the campus feed");
    reset();
  };

  const onFile = (f?: File | null) => {
    if (!f) return;
    if (f.size > 4_000_000) { toast.error("Image must be under 4 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { setImage(String(reader.result)); setKind("image"); };
    reader.readAsDataURL(f);
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <img src={profile.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-left text-sm text-muted-foreground transition hover:border-foreground/20"
          >
            Share something with your campus, {profile.name.split(" ")[0]}...
          </button>
        ) : (
          <div className="min-w-0 flex-1 space-y-3">
            <textarea
              autoFocus
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder="What's happening on campus?"
              className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10"
            />

            {image && (
              <div className="relative overflow-hidden rounded-2xl border border-border">
                <img src={image} alt="Attached preview" className="max-h-72 w-full object-cover" />
                <button
                  onClick={() => { setImage(undefined); setKind("text"); }}
                  className="absolute right-2 top-2 rounded-full bg-foreground/70 p-1.5 text-background"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {kind === "poll" && (
              <div className="space-y-2">
                {pollOptions.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={o}
                      onChange={(e) => setPollOptions((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => setPollOptions((p) => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive" aria-label="Remove option">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 5 && (
                  <Btn variant="ghost" size="sm" onClick={() => setPollOptions((p) => [...p, ""])}>+ Add option</Btn>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              <Btn variant="outline" size="sm" onClick={() => fileRef.current?.click()}><ImageIcon className="h-3.5 w-3.5" /> Photo</Btn>
              <Btn variant={kind === "poll" ? "primary" : "outline"} size="sm" onClick={() => setKind(kind === "poll" ? "text" : "poll")}><BarChart3 className="h-3.5 w-3.5" /> Poll</Btn>
              <Btn variant={kind === "announcement" ? "primary" : "outline"} size="sm" onClick={() => setKind(kind === "announcement" ? "text" : "announcement")}><Megaphone className="h-3.5 w-3.5" /> Announcement</Btn>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PostCategory)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none"
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="ml-auto flex items-center gap-2">
                <Btn variant="ghost" size="sm" onClick={reset}>Cancel</Btn>
                <Btn variant="accent" size="sm" onClick={submit}><Send className="h-3.5 w-3.5" /> Post</Btn>
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

/* --------------------------------- PostCard -------------------------------- */

function PostCard({ post, me }: { post: Post; me: string }) {
  const liked = useCampus((s) => s.likedPosts.includes(post.id));
  const saved = useCampus((s) => s.bookmarkedPosts.includes(post.id));
  const { toggleLike, toggleBookmark, sharePost, reportPost, deletePost, editPost, addComment, votePoll } = useCampus.getState();
  const [openComments, setOpenComments] = useState(false);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.body);
  const [burst, setBurst] = useState(false);

  const totalVotes = post.poll?.options.reduce((a, o) => a + o.votes, 0) ?? 0;
  const commentCount = countComments(post.comments);

  const like = () => {
    toggleLike(post.id);
    if (!liked) { setBurst(true); setTimeout(() => setBurst(false), 420); }
  };

  return (
    <Card hover className="overflow-hidden p-0">
      <div className="flex items-start gap-3 p-5 pb-3">
        <img src={post.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{post.author}</p>
            {post.kind === "announcement" && <Badge tone="accent">Announcement</Badge>}
            {post.own && <Badge tone="muted">You</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{post.authorRole} · {timeAgo(post.createdAt)} · {post.category}</p>
        </div>
        <div className="relative">
          <button onClick={() => setMenu((m) => !m)} aria-label="Post options" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menu && (
            <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-2xl border border-border bg-card p-1 shadow-[0_20px_50px_-30px_rgba(17,17,17,0.6)]">
              {post.own || post.author === me ? (
                <>
                  <MenuItem icon={<Pencil className="h-3.5 w-3.5" />} label="Edit post" onClick={() => { setEditing(true); setMenu(false); }} />
                  <MenuItem icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete post" danger onClick={() => { deletePost(post.id); toast.success("Post deleted"); }} />
                </>
              ) : (
                <MenuItem icon={<Flag className="h-3.5 w-3.5" />} label={post.reported ? "Reported" : "Report post"} onClick={() => { reportPost(post.id); setMenu(false); toast.success("Thanks — reported to moderators"); }} />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-3">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={draft} onChange={(e) => setDraft(e.target.value)} rows={3}
              className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            />
            <div className="flex gap-2">
              <Btn size="sm" variant="accent" onClick={() => { editPost(post.id, draft.trim() || post.body); setEditing(false); toast.success("Post updated"); }}>Save</Btn>
              <Btn size="sm" variant="ghost" onClick={() => { setDraft(post.body); setEditing(false); }}>Cancel</Btn>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{post.body}</p>
        )}

        {post.eventMeta && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-background p-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{post.eventMeta.title}</p>
              <p className="text-xs text-muted-foreground">{post.eventMeta.date} · {post.eventMeta.venue}</p>
            </div>
            <Link to={`${R}/events`} className="ml-auto text-xs font-medium text-[var(--accent)] hover:underline">View event</Link>
          </div>
        )}
      </div>

      {post.image && (
        <img src={post.image} alt="" className="max-h-[440px] w-full object-cover" />
      )}

      {post.poll && (
        <div className="space-y-2 px-5 py-4">
          {post.poll.options.map((o) => {
            const pct = totalVotes ? Math.round((o.votes / totalVotes) * 100) : 0;
            const votedThis = post.poll?.votedId === o.id;
            return (
              <button
                key={o.id}
                disabled={!!post.poll?.votedId}
                onClick={() => { votePoll(post.id, o.id); toast.success("Vote recorded"); }}
                className={cn(
                  "w-full rounded-2xl border px-4 py-2.5 text-left transition",
                  votedThis ? "border-[var(--accent)] bg-[var(--accent)]/8" : "border-border hover:border-foreground/20",
                )}
              >
                <div className="flex items-center justify-between text-sm text-foreground">
                  <span className="flex items-center gap-2">
                    {votedThis && <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)]" />}
                    {o.label}
                  </span>
                  {post.poll?.votedId && <span className="text-xs text-muted-foreground">{pct}%</span>}
                </div>
                {post.poll?.votedId && <div className="mt-2"><Progress value={pct} /></div>}
              </button>
            );
          })}
          <p className="text-xs text-muted-foreground">{totalVotes} vote{totalVotes === 1 ? "" : "s"}</p>
        </div>
      )}

      <div className="flex items-center gap-1 border-t border-border px-3 py-2">
        <Action onClick={like} active={liked} icon={<Heart className={cn("h-4 w-4 transition-transform", liked && "fill-current", burst && "scale-125")} />} label={String(post.likes)} />
        <Action onClick={() => setOpenComments((o) => !o)} icon={<MessageCircle className="h-4 w-4" />} label={String(commentCount)} />
        <Action onClick={() => { sharePost(post.id); navigator.clipboard?.writeText(`${typeof window !== "undefined" ? window.location.origin : ""}${R}`); toast.success("Link copied to clipboard"); }} icon={<Share2 className="h-4 w-4" />} label={String(post.shares)} />
        <Action
          className="ml-auto"
          onClick={() => { toggleBookmark(post.id); toast.success(saved ? "Removed from saved" : "Saved for later"); }}
          active={saved}
          icon={<Bookmark className={cn("h-4 w-4", saved && "fill-current")} />}
          label={saved ? "Saved" : "Save"}
        />
      </div>

      {openComments && (
        <div className="space-y-3 border-t border-border bg-background/60 p-5">
          {post.comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet — start the conversation.</p>}
          {post.comments.map((c) => (
            <CommentNode key={c.id} c={c} depth={0} onReply={(id) => setReplyTo(id)} activeReply={replyTo} onSubmitReply={(id, body) => { addComment(post.id, body, id); setReplyTo(null); }} />
          ))}
          <div className="flex items-center gap-2 pt-1">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && comment.trim()) { addComment(post.id, comment.trim()); setComment(""); }
              }}
              placeholder="Write a comment..."
              className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <Btn size="sm" variant="accent" disabled={!comment.trim()} onClick={() => { addComment(post.id, comment.trim()); setComment(""); }}>
              <Send className="h-3.5 w-3.5" />
            </Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

function countComments(list: { replies: unknown[] }[]): number {
  return list.reduce((a, c) => a + 1 + countComments(c.replies as { replies: unknown[] }[]), 0);
}

function CommentNode({
  c, depth, onReply, activeReply, onSubmitReply,
}: {
  c: { id: string; author: string; avatar: string; body: string; createdAt: number; replies: never[] | any[] };
  depth: number;
  onReply: (id: string) => void;
  activeReply: string | null;
  onSubmitReply: (id: string, body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div style={{ marginLeft: depth * 20 }} className="space-y-2">
      <div className="flex items-start gap-2.5">
        <img src={c.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
        <div className="min-w-0 flex-1 rounded-2xl bg-card px-3.5 py-2">
          <p className="text-xs font-semibold text-foreground">{c.author} <span className="font-normal text-muted-foreground">· {timeAgo(c.createdAt)}</span></p>
          <p className="mt-0.5 text-sm text-foreground">{c.body}</p>
          <button onClick={() => onReply(c.id)} className="mt-1 text-[11px] font-medium text-muted-foreground hover:text-[var(--accent)]">Reply</button>
        </div>
      </div>
      {activeReply === c.id && (
        <div className="ml-9 flex items-center gap-2">
          <input
            autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { onSubmitReply(c.id, draft.trim()); setDraft(""); } }}
            placeholder={`Reply to ${c.author}...`}
            className="flex-1 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          <Btn size="sm" variant="accent" disabled={!draft.trim()} onClick={() => { onSubmitReply(c.id, draft.trim()); setDraft(""); }}>Send</Btn>
        </div>
      )}
      {c.replies.map((r: any) => (
        <CommentNode key={r.id} c={r} depth={depth + 1} onReply={onReply} activeReply={activeReply} onSubmitReply={onSubmitReply} />
      ))}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition hover:bg-muted", danger ? "text-destructive" : "text-foreground")}
    >
      {icon} {label}
    </button>
  );
}

function Action({ icon, label, onClick, active, className }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition active:scale-95",
        active ? "text-[var(--accent)]" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {icon} {label}
    </button>
  );
}

/* --------------------------------- Widgets --------------------------------- */

function AiWidget() {
  const [q, setQ] = useState("");
  const newChat = useCampus((s) => s.newChat);
  const sendAi = useCampus((s) => s.sendAi);
  const nav = Route.useNavigate();

  const ask = (text: string) => {
    if (!text.trim()) return;
    const id = newChat();
    sendAi(id, text.trim());
    nav({ to: `${R}/ai` as never });
  };

  return (
    <Card className="bg-foreground text-background">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--accent)] text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold">Athena AI</p>
      </div>
      <p className="mt-2 text-xs text-background/70">Ask about deadlines, attendance, placements or events.</p>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(q)}
          placeholder="Ask anything..."
          className="min-w-0 flex-1 rounded-full bg-background/10 px-3.5 py-2 text-xs text-background outline-none placeholder:text-background/50"
        />
        <button onClick={() => ask(q)} aria-label="Ask Athena" className="rounded-full bg-[var(--accent)] p-2 text-white">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["My attendance", "Due this week", "Placement matches"].map((s) => (
          <button key={s} onClick={() => ask(s)} className="rounded-full border border-background/20 px-2.5 py-1 text-[11px] text-background/80 hover:bg-background/10">
            {s}
          </button>
        ))}
      </div>
    </Card>
  );
}

function TodayWidget() {
  const today = new Date().toISOString().slice(0, 10);
  const items = seedCalendar.filter((c) => c.date === today);
  return (
    <Card>
      <WidgetHead title="Today's classes" to={`${R}/calendar`} />
      <div className="mt-3 space-y-2.5">
        {items.length === 0 && <p className="text-xs text-muted-foreground">No classes scheduled today.</p>}
        {items.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs font-medium text-[var(--accent)]">{c.time}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{c.title}</span>
            <Badge tone={c.type === "exam" ? "danger" : "muted"}>{c.type}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DeadlinesWidget() {
  const submissions = useCampus((s) => s.submissions);
  const pending = seedAssignments
    .filter((a) => !submissions[a.id] && a.status === "pending")
    .sort((a, b) => a.due - b.due)
    .slice(0, 3);
  return (
    <Card>
      <WidgetHead title="Upcoming deadlines" to={`${R}/assignments`} />
      <div className="mt-3 space-y-3">
        {pending.length === 0 && <p className="text-xs text-muted-foreground">You're all caught up.</p>}
        {pending.map((a) => {
          const days = Math.max(0, Math.ceil((a.due - Date.now()) / 86400000));
          return (
            <div key={a.id}>
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm text-foreground">{a.title}</p>
                <span className={cn("shrink-0 text-xs font-medium", days <= 2 ? "text-destructive" : "text-muted-foreground")}>{days}d</span>
              </div>
              <p className="text-xs text-muted-foreground">{a.courseCode} · {a.points} pts</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function EventsWidget() {
  const registered = useCampus((s) => s.registeredEvents);
  const upcoming = seedEvents.slice(0, 3);
  return (
    <Card>
      <WidgetHead title="Happening soon" to={`${R}/events`} />
      <div className="mt-3 space-y-3">
        {upcoming.map((e) => (
          <div key={e.id} className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-xl" style={{ background: e.cover }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{e.title}</p>
              <p className="text-xs text-muted-foreground">{e.date} · {e.venue}</p>
            </div>
            {registered.includes(e.id) && <Badge tone="success">Going</Badge>}
          </div>
        ))}
      </div>
    </Card>
  );
}

function NewsWidget() {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
        <p className="text-sm font-semibold text-foreground">Campus pulse</p>
      </div>
      <ul className="mt-3 space-y-2">
        {campusNews.map((n) => (
          <li key={n} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Zap className="mt-0.5 h-3 w-3 shrink-0 text-[var(--accent)]" /> {n}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function WidgetHead({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <Link to={to as never} className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-[var(--accent)]">
        View all <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
