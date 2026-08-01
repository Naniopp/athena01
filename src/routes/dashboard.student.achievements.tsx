import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Lock, Share2, Medal, Award, Star } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useCampus } from "@/lib/campus/store";
import { seedAchievements, leaderboard, type Achievement } from "@/lib/campus/seed";
import { Card, PageHeader, Chip, Btn, Modal, Skeleton, Progress, Badge, useLoading } from "@/components/campus/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/student/achievements")({
  component: AchievementsPage,
  head: () => ({
    meta: [
      { title: "Achievements — ATHENA" },
      { name: "description", content: "Badges, certificates, points, and the campus leaderboard." },
      { property: "og:title", content: "Achievements — ATHENA" },
      { property: "og:description", content: "Badges, certificates, points, and the campus leaderboard." },
    ],
  }),
});

const CATEGORIES = ["All", "certificate", "badge", "competition"] as const;
// Additional locked achievements to make the grid feel complete
const LOCKED: Achievement[] = [
  { id: "lk1", title: "Research Contributor", issuer: "ATHENA", date: "—", kind: "badge", detail: "Co-author a published paper or project." },
  { id: "lk2", title: "Hackathon Finalist x3", issuer: "ATHENA", date: "—", kind: "competition", detail: "Reach the finals in three separate hackathons." },
  { id: "lk3", title: "Full Attendance Semester", issuer: "ATHENA", date: "—", kind: "badge", detail: "Maintain 100% attendance for a full semester." },
];

const ICONS = { certificate: Award, badge: Medal, competition: Trophy };

function pointsFor(a: Achievement) {
  return a.kind === "competition" ? 350 : a.kind === "certificate" ? 200 : 120;
}

function AchievementsPage() {
  const loading = useLoading();
  const profile = useCampus((s) => s.profile);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [shareOpen, setShareOpen] = useState(false);

  const unlocked = seedAchievements;
  const totalPoints = unlocked.reduce((a, x) => a + pointsFor(x), 0);
  const tierSize = 1500;
  const tierProgress = (totalPoints % tierSize) / tierSize * 100;
  const currentTier = Math.floor(totalPoints / tierSize) + 1;

  const all = useMemo(() => [...unlocked.map((a) => ({ ...a, locked: false })), ...LOCKED.map((a) => ({ ...a, locked: true }))], [unlocked]);
  const filtered = category === "All" ? all : all.filter((a) => a.kind === category);

  const chartData = useMemo(() => {
    const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
    let cum = 0;
    return months.map((m, i) => {
      cum += Math.round(totalPoints / months.length + (i % 2 === 0 ? 40 : -20));
      return { month: m, points: Math.max(0, cum) };
    });
  }, [totalPoints]);

  const shareCopy = () => {
    const text = `${profile.name} has earned ${totalPoints} points on ATHENA Campus with ${unlocked.length} achievements — ranked #${leaderboard.find((l) => l.me)?.rank ?? "-"} on the leaderboard!`;
    navigator.clipboard?.writeText(text);
    toast.success("Summary copied to clipboard");
    setShareOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Achievements"
        subtitle="Badges, certificates, and how you rank across campus."
        action={<Btn variant="accent" onClick={() => setShareOpen(true)}><Share2 className="h-4 w-4" /> Share</Btn>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-muted-foreground">Total points</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{totalPoints}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Tier {currentTier} progress</p>
          <div className="mt-1"><Progress value={tierProgress} /></div>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Unlocked</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{unlocked.length}<span className="text-sm text-muted-foreground"> / {all.length}</span></p>
          <p className="mt-2 text-[11px] text-muted-foreground">Keep going — {LOCKED.length} left to unlock.</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Leaderboard rank</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">#{leaderboard.find((l) => l.me)?.rank}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Out of {leaderboard.length} shown this term.</p>
        </Card>
      </div>

      <Card className="mb-6">
        <p className="mb-3 text-sm font-semibold text-foreground">Points over time</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
              <Line type="monotone" dataKey="points" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c === "All" ? "All" : c[0].toUpperCase() + c.slice(1) + "s"}</Chip>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {filtered.map((a) => {
            const Icon = ICONS[a.kind];
            return (
              <Card key={a.id} className={cn("relative", a.locked && "opacity-60 grayscale")}>
                {a.locked && <Lock className="absolute right-4 top-4 h-4 w-4 text-muted-foreground" />}
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.issuer} · {a.date}</p>
                <p className="mt-2 text-xs text-muted-foreground">{a.detail}</p>
                {!a.locked && <Badge tone="accent">+{pointsFor(a)} pts</Badge>}
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Star className="h-4 w-4 text-[var(--accent)]" /> Leaderboard</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-2 pr-4">Rank</th><th className="py-2 pr-4">Name</th><th className="py-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((l) => (
                <tr key={l.rank} className={cn("border-b border-border/60 last:border-0", l.me && "bg-[var(--accent)]/8")}>
                  <td className="py-2.5 pr-4 font-medium text-foreground">#{l.rank}</td>
                  <td className="py-2.5 pr-4 text-foreground">{l.name}{l.me && <Badge tone="accent">You</Badge>}</td>
                  <td className="py-2.5 text-foreground">{l.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share your achievements">
        <p className="text-sm text-muted-foreground">
          {profile.name} has earned {totalPoints} points on ATHENA Campus with {unlocked.length} achievements — ranked #{leaderboard.find((l) => l.me)?.rank} on the leaderboard!
        </p>
        <Btn variant="accent" className="mt-4 w-full" onClick={shareCopy}>Copy summary</Btn>
      </Modal>
    </div>
  );
}
