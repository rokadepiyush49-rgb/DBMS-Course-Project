"use client";

import { Pause, Play, Sprout, Zap } from "lucide-react";
import { useState } from "react";
import { post, usePoll, waitJob } from "@/lib/api";
import { Badge, Button, Card, useToast } from "./ui";

/** Controls for the bundled demo database: seed, simulated app traffic, drift scenarios. */
export default function DemoPanel({ cid, onChange, compact }: { cid: number; onChange?: () => void; compact?: boolean }) {
  const { data: wl, reload } = usePoll<any>("/demo/workload", 3000);
  const [toast, show] = useToast();
  const [status, setStatus] = useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<any>) => {
    setStatus(label);
    try {
      const r = await fn();
      show(`${label}: done`);
      onChange?.();
      reload();
      return r;
    } catch (e) {
      show(`${label}: ${(e as Error).message}`, "bad");
    } finally {
      setStatus(null);
    }
  };

  const collectAnalyze = () => run("Collect + analyze", async () => {
    await post(`/connections/${cid}/collect?sync=true`);
    await post(`/connections/${cid}/analyze?sync=true`);
  });

  return (
    <Card title="Demo control" subtitle="Bundled shopdemo schema, simulated application traffic and drift scenarios"
      action={wl && <Badge tone={wl.running ? "good" : "muted"}>{wl.running ? `traffic: ${wl.profile} · ${wl.qps.toFixed(0)} q/s` : "traffic stopped"}</Badge>}>
      {toast}
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => window.confirm(
          "Re-create the shopdemo schema? This drops its tables and retires every structure deployed on them.") && run("Seed demo data", async () => {
          const { job_id } = await post("/demo/seed", { connection_id: cid });
          return waitJob(job_id);
        })}><Sprout className="h-4 w-4" />Seed demo DB</Button>
        {wl?.running ? (
          <Button variant="ghost" onClick={() => run("Stop traffic", () => post("/demo/workload/stop"))}><Pause className="h-4 w-4" />Stop traffic</Button>
        ) : (
          <Button variant="ghost" onClick={() => run("Start traffic", () => post("/demo/workload/start", { connection_id: cid, threads: 6, qps: 80 }))}>
            <Play className="h-4 w-4" />Start app traffic</Button>
        )}
        <Button onClick={collectAnalyze}><Zap className="h-4 w-4" />Collect &amp; analyze</Button>
      </div>
      {!compact && wl?.scenarios && (
        <div className="mt-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-muted">Drift scenarios</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(wl.scenarios as Record<string, string>).map(([k, v]) => (
              <button key={k} disabled={!!status}
                onClick={() => run(`Scenario ${k}`, async () => {
                  const r = await post(`/demo/scenarios/${k}`, { connection_id: cid });
                  return r.job_id ? waitJob(r.job_id) : r;
                })}
                className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-left text-xs transition hover:border-accent/60 disabled:opacity-50">
                <div className="mono text-[11px] text-indigo-300">{k}</div>
                <div className="mt-0.5 text-muted">{v}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {status && <p className="mt-3 text-xs text-warn">{status}…</p>}
      {wl?.last_error && <p className="mt-2 text-xs text-bad">last traffic error: {wl.last_error}</p>}
    </Card>
  );
}
