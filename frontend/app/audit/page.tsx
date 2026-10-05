"use client";

import { Badge, Card, Empty, PageHeader, Table, Td } from "@/components/ui";
import { usePoll } from "@/lib/api";

const TONE = (a: string) => a.includes("rolled_back") || a.includes("rejected") ? "bad"
  : a.includes("promoted") || a.includes("approved") ? "good"
  : a.includes("drift") || a.includes("retrain") || a.includes("canary") ? "warn" : "muted";

export default function Audit() {
  const { data } = usePoll<any[]>("/audit?limit=300", 4000);
  return (
    <>
      <PageHeader title="Audit log" subtitle="Every approval, deployment, rollback, retraining and automatic drift action, with its actor and details." />
      <Card>
        {!data?.length ? <Empty>No events.</Empty> : (
          <Table head={["Time", "Actor", "Action", "Target", "Details"]}>
            {data.map((a) => (
              <tr key={a.id}>
                <Td className="whitespace-nowrap text-muted">{new Date(a.ts).toLocaleString()}</Td>
                <Td>{a.actor}</Td>
                <Td><Badge tone={TONE(a.action)}>{a.action}</Badge></Td>
                <Td mono>{a.target}</Td>
                <Td mono className="max-w-2xl break-all text-muted">{JSON.stringify(a.details)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
