"use client";

import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";

export function Card({ title, action, children, className, subtitle }: {
  title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={clsx("rounded-xl border border-line bg-panel", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={clsx("mt-1 text-2xl font-semibold tabular-nums",
        tone === "good" && "text-good", tone === "warn" && "text-warn", tone === "bad" && "text-bad")}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  good: "bg-good/15 text-good border-good/30",
  warn: "bg-warn/15 text-warn border-warn/30",
  bad: "bg-bad/15 text-bad border-bad/30",
  info: "bg-info/15 text-info border-info/30",
  accent: "bg-accent/15 text-indigo-300 border-accent/30",
  muted: "bg-white/5 text-muted border-line",
};

export function Badge({ children, tone = "muted", className }: { children: ReactNode; tone?: keyof typeof TONES | string; className?: string }) {
  return <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium", TONES[tone] ?? TONES.muted, className)}>{children}</span>;
}

export function statusTone(s?: string | null): string {
  switch (s) {
    case "healthy": case "passed": case "done": case "active": case "ok": case "deployed": case "high": return "good";
    case "needs_review": case "canary": case "running": case "experimenting": case "medium": case "approved": case "validating": case "training": return "warn";
    case "degraded": case "failed": case "error": case "rolled_back": case "rejected": return "bad";
    case "tested": case "open": case "queued": return "info";
    default: return "muted";
  }
}

export function HealthDot({ health }: { health?: string | null }) {
  const c = health === "healthy" ? "bg-good" : health === "needs_review" ? "bg-warn" : health === "degraded" ? "bg-bad" : "bg-muted";
  return <span className={clsx("inline-block h-2 w-2 rounded-full", c, health === "healthy" && "shadow-[0_0_8px] shadow-good")} />;
}

export function Button({ children, onClick, variant = "primary", disabled, className, title }: {
  children: ReactNode; onClick?: () => unknown | Promise<unknown>; variant?: "primary" | "ghost" | "danger" | "good";
  disabled?: boolean; className?: string; title?: string;
}) {
  const [busy, setBusy] = useState(false);
  const cls = {
    primary: "bg-accent hover:bg-indigo-500 text-white border-accent",
    ghost: "bg-transparent hover:bg-white/5 text-ink border-line",
    danger: "bg-bad/15 hover:bg-bad/25 text-bad border-bad/40",
    good: "bg-good/15 hover:bg-good/25 text-good border-good/40",
  }[variant];
  return (
    <button
      title={title}
      disabled={disabled || busy}
      onClick={async () => {
        if (!onClick) return;
        setBusy(true);
        try { await onClick(); } finally { setBusy(false); }
      }}
      className={clsx("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50", cls, className)}
    >
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{children}</div>;
}

export function ErrorNote({ error }: { error?: string | null }) {
  if (!error) return null;
  return <div className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</div>;
}

export function Bar({ value, max = 1, tone = "accent" }: { value: number; max?: number; tone?: string }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const color = { accent: "bg-accent", good: "bg-good", warn: "bg-warn", bad: "bg-bad", info: "bg-info" }[tone] ?? "bg-accent";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
      <div className={clsx("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Table({ head, children, className }: { head: ReactNode[]; children: ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-x-auto", className)}>
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted">
          <tr>{head.map((h, i) => <th key={i} className="border-b border-line px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line/60">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className, mono }: { children?: ReactNode; className?: string; mono?: boolean }) {
  return <td className={clsx("px-3 py-2 align-top", mono && "mono text-xs", className)}>{children}</td>;
}

export function useToast(): [ReactNode, (msg: string, tone?: "good" | "bad") => void] {
  const [msg, setMsg] = useState<{ text: string; tone: string } | null>(null);
  const show = (text: string, tone: "good" | "bad" = "good") => {
    setMsg({ text, tone });
    setTimeout(() => setMsg(null), 5000);
  };
  const node = msg ? (
    <div className={clsx("fixed bottom-5 right-5 z-50 max-w-md rounded-lg border px-4 py-3 text-sm shadow-xl",
      msg.tone === "good" ? "border-good/40 bg-[#0d2a22] text-good" : "border-bad/40 bg-[#2a1111] text-bad")}>{msg.text}</div>
  ) : null;
  return [node, show];
}
