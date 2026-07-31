import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, children, hover, ...rest }: { className?: string; children: ReactNode; hover?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-[20px] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(17,17,17,0.04)] transition-all duration-300",
        hover && "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(17,17,17,0.35)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95",
        active
          ? "border-transparent bg-foreground text-background"
          : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:bg-accent/10 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function Btn({
  children, onClick, variant = "primary", className, type = "button", disabled, size = "md",
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "accent" | "ghost" | "outline" | "danger";
  className?: string; type?: "button" | "submit"; disabled?: boolean; size?: "sm" | "md";
}) {
  const styles = {
    primary: "bg-foreground text-background hover:opacity-90",
    accent: "bg-[var(--accent)] text-white hover:brightness-105",
    ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
    outline: "border border-border bg-card text-foreground hover:bg-muted",
    danger: "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15",
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        styles, className,
      )}
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-foreground/30 p-4 backdrop-blur-sm sm:items-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full animate-rise-in rounded-[24px] border border-border bg-card p-6 shadow-[0_40px_100px_-40px_rgba(17,17,17,0.5)]",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label, value, onChange, placeholder, type = "text", error, textarea, maxLength, hint,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
  error?: string; textarea?: boolean; maxLength?: number; hint?: string;
}) {
  const base =
    "w-full rounded-2xl border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10";
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
        {label}
        {maxLength && <span>{value.length}/{maxLength}</span>}
      </span>
      {textarea ? (
        <textarea
          value={value} maxLength={maxLength} placeholder={placeholder} rows={4}
          onChange={(e) => onChange(e.target.value)}
          className={cn(base, "resize-none", error ? "border-destructive" : "border-border")}
        />
      ) : (
        <input
          value={value} maxLength={maxLength} placeholder={placeholder} type={type}
          onChange={(e) => onChange(e.target.value)}
          className={cn(base, error ? "border-destructive" : "border-border")}
        />
      )}
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Search..."}
      className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/70 focus:w-full focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10"
    />
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300", checked ? "bg-[var(--accent)]" : "bg-muted-foreground/30")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted", className)} />;
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-border py-16 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Progress({ value, tone = "accent" }: { value: number; tone?: "accent" | "ink" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all duration-700", tone === "accent" ? "bg-[var(--accent)]" : "bg-foreground")}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "ink" | "success" | "danger" }) {
  const map = {
    muted: "bg-muted text-muted-foreground",
    accent: "bg-[var(--accent)]/12 text-[var(--accent)]",
    ink: "bg-foreground text-background",
    success: "bg-emerald-500/12 text-emerald-600",
    danger: "bg-destructive/12 text-destructive",
  }[tone];
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium", map)}>{children}</span>;
}

export function useLoading(ms = 500) {
  const [loading, setLoading] = useState(true);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    t.current = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t.current);
  }, [ms]);
  return loading;
}

export function timeAgo(at: number) {
  const diff = Date.now() - at;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}
