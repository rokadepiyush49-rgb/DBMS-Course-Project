"use client";

import clsx from "clsx";
import {
  Activity, Boxes, Database, FlaskConical, Gauge, History, LayoutDashboard, Lightbulb, Rocket, Search, Settings, Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { usePoll, useConnection } from "@/lib/api";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/connections", label: "Databases", icon: Database },
  { href: "/workloads", label: "Workload", icon: Activity },
  { href: "/opportunities", label: "Opportunities", icon: Lightbulb },
  { href: "/experiments", label: "Experiments", icon: FlaskConical },
  { href: "/deployments", label: "Deployments", icon: Rocket },
  { href: "/models", label: "Model registry", icon: Boxes },
  { href: "/monitoring", label: "Drift monitor", icon: Gauge },
  { href: "/lookup", label: "Lookup playground", icon: Search },
  { href: "/audit", label: "Audit log", icon: History },
  { href: "/settings", label: "Rules & thresholds", icon: Settings },
];

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [cid, choose, conns] = useConnection();
  const { data: health } = usePoll<any>("/health", 10000);
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-panel-2 md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/20 text-indigo-300"><Workflow className="h-4 w-4" /></div>
          <div>
            <div className="text-sm font-semibold">LearnSQL</div>
            <div className="text-[11px] text-muted">Adaptive access structures</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href}
                className={clsx("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                  active ? "bg-accent/15 text-ink" : "text-muted hover:bg-white/5 hover:text-ink")}>
                <Icon className={clsx("h-4 w-4", active && "text-indigo-300")} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-line p-3 text-xs text-muted">
          <label className="block">
            <span className="mb-1 block">MySQL connection</span>
            <select value={cid ?? ""} onChange={(e) => choose(Number(e.target.value))}
              className="w-full rounded-md border border-line bg-panel px-2 py-1.5 text-ink">
              {conns.length === 0 && <option value="">none yet</option>}
              {conns.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.host}:{c.port})</option>)}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <span className={clsx("h-2 w-2 rounded-full", health?.ok ? "bg-good" : "bg-bad")} />
            {health?.ok ? `API up · monitor every ${health.monitor.interval_s}s` : "API unreachable"}
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
        <nav className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-line px-4 pb-2 md:hidden">
          {NAV.map(({ href, label }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return <Link key={href} href={href} className={clsx("whitespace-nowrap rounded-md px-2.5 py-1 text-xs",
              active ? "bg-accent/20 text-ink" : "text-muted")}>{label}</Link>;
          })}
        </nav>
        {children}
      </main>
    </div>
  );
}
