"use client";

import Link from "next/link";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DemoPanel from "@/components/DemoPanel";
import { Badge, Card, Empty, HealthDot, PageHeader, Stat, Table, Td, statusTone } from "@/components/ui";
import { fmt, LABEL, useConnection, usePoll } from "@/lib/api";

export default function Dashboard() {
  const [cid] = useConnection();
  const { data: ov, reload } = usePoll<any>(cid ? `/connections/${cid}/overview` : null, 5000);
  const { data: cands } = usePoll<any[]>(cid ? `/candidates?connection_id=${cid}` : null, 8000);

  if (!cid) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Empty>No MySQL connection yet. <Link className="text-indigo-300 underline" href="/connections">Add one</Link> to start observing.</Empty>
      </>
    );
  }
  const hist = (ov?.history ?? []).map((h: any) => ({ t: new Date(h.ts).toLocaleTimeString(), qpm: Math.round(h.qpm), p95: +h.p95_ms.toFixed(2), avg: +h.avg_ms.toFixed(2) }));
  const opps = (cands ?? []).filter((c) => !["rejected", "dismissed"].includes(c.status)).slice(0, 6);
  const degraded = ov?.structures?.some((s: any) => s.health === "degraded");
  return (
    <>
      <PageHeader title="What is happening with my database?"
        subtitle={ov ? `${ov.connection.name} · MySQL ${ov.connection.server_version ?? "?"} · last collected ${fmt.ago(ov.connection.last_collected_at)}` : "loading…"}
        action={ov && <Badge tone={degraded ? "bad" : "good"}><HealthDot health={degraded ? "degraded" : "healthy"} /> {degraded ? "Attention" : "Healthy"}</Badge>} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Tables" value={fmt.n(ov?.tables)} hint={`${fmt.n(ov?.rows)} rows · ${ov ? ov.index_mb.toFixed(1) : "—"} MB indexes`} />
        <Stat label="Queries / min" value={fmt.n(ov?.qpm)} hint={`${fmt.n(ov?.digests)} statement digests`} />
        <Stat label="P95 latency" value={fmt.ms(ov?.p95_ms)} hint={`avg ${fmt.ms(ov?.avg_latency_ms)} all-time`} tone={ov?.p95_ms > 20 ? "warn" : undefined} />
        <Stat label="Optimizations" value={fmt.n(ov?.opportunities)} hint="open or in progress" />
        <Stat label="Write ratio" value={fmt.pct(ov?.write_ratio, 0)} hint="last collection window" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Query performance" subtitle="Per collection window (Performance Schema digest deltas)" className="xl:col-span-2">
          {hist.length < 2 ? <Empty>Collect at least twice while traffic runs to see the time series.</Empty> : (
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={hist}>
                  <CartesianGrid stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="t" stroke="#8b95a7" fontSize={11} />
                  <YAxis yAxisId="l" stroke="#8b95a7" fontSize={11} />
                  <YAxis yAxisId="r" orientation="right" stroke="#8b95a7" fontSize={11} unit="ms" />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1f2937", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line yAxisId="l" type="monotone" dataKey="qpm" name="queries/min" stroke="#6366f1" dot={false} strokeWidth={2} />
                  <Line yAxisId="r" type="monotone" dataKey="p95" name="p95 ms" stroke="#f59e0b" dot={false} strokeWidth={2} />
                  <Line yAxisId="r" type="monotone" dataKey="avg" name="avg ms" stroke="#38bdf8" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <DemoPanel cid={cid} onChange={reload} compact />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="AI opportunities" action={<Link href="/opportunities" className="text-xs text-indigo-300">all →</Link>}>
          {opps.length === 0 ? <Empty>No opportunities yet — run traffic, then Collect &amp; analyze.</Empty> : (
            <Table head={["Column", "Score", "Leaning", "Status"]}>
              {opps.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <Td><Link href={`/opportunities/${c.id}`} className="mono text-indigo-300">{c.table_name}.{c.column_name}</Link></Td>
                  <Td><Badge tone={statusTone(c.priority)}>{c.score.toFixed(0)} · {c.priority}</Badge></Td>
                  <Td>{LABEL[c.recommended_type]}</Td>
                  <Td><Badge tone={statusTone(c.status)}>{c.last_experiment?.winner ? `tested → ${LABEL[c.last_experiment.winner]}` : c.status}</Badge></Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <Card title="Active structures" action={<Link href="/monitoring" className="text-xs text-indigo-300">drift monitor →</Link>}>
          {!ov?.structures?.length ? <Empty>Nothing deployed yet.</Empty> : (
            <Table head={["Column", "Structure", "Mode", "Health"]}>
              {ov.structures.map((s: any) => (
                <tr key={s.deployment_id}>
                  <Td mono>{s.column}</Td>
                  <Td>{LABEL[s.type]}{s.version ? ` v${s.version}` : ""}</Td>
                  <Td><Badge tone={statusTone(s.mode)}>{s.mode}</Badge></Td>
                  <Td><span className="inline-flex items-center gap-2"><HealthDot health={s.health} />{s.health}</span></Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
      {ov?.class_totals && (
        <Card title="Workload mix (all-time executions)" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(ov.class_totals as Record<string, number>).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <Badge key={k} tone={k === "equality" ? "accent" : k === "write" ? "warn" : "muted"}>{k}: {fmt.n(v)}</Badge>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
