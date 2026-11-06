import { getSession } from "@internal/core/auth/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFlag, listAudit } from "@/flags/flags";
import { TRANSITION_LABELS, transitionsFor } from "@/flags/machine";
import { formatTs } from "@/lib/format";
import { cn } from "@/lib/utils";
import { can } from "@/permissions";
import { StateBadge } from "../../state-badge";
import { TransitionForm } from "../../transition-form";

export const dynamic = "force-dynamic";

const describe = (v: unknown) => {
  if (!v || typeof v !== "object" || !("state" in v)) return "—";
  const { state, percentage } = v as { state: string; percentage?: number | null };
  return state === "percentage" ? `percentage (${percentage}%)` : state;
};

export default async function FlagPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session, "flag", "read")) return <p>403 — you do not have access to feature flags.</p>;

  const flag = await getFlag(session, (await params).id);
  if (!flag) notFound();

  const tab = (await searchParams).tab === "audit" && can(session, "audit", "read") ? "audit" : "details";
  const options = transitionsFor(session, flag).map((to) => ({ to, label: TRANSITION_LABELS[to] }));
  const auditRows = tab === "audit" ? ((await listAudit(session, flag.id)) ?? []) : [];

  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← Flags
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-xl font-semibold">{flag.key}</h1>
        <span className="rounded border px-2 py-0.5 text-xs uppercase">{flag.env}</span>
        <StateBadge state={flag.state} percentage={flag.percentage} data-testid="flag-state" />
      </div>

      <nav className="flex gap-1 border-b">
        {(["details", "audit"] as const)
          .filter((t) => t === "details" || can(session, "audit", "read"))
          .map((t) => (
            <Link
              key={t}
              href={t === "audit" ? `/flags/${flag.id}?tab=audit` : `/flags/${flag.id}`}
              aria-current={tab === t ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm capitalize",
                tab === t ? "border-primary font-medium" : "border-transparent text-muted-foreground",
              )}
            >
              {t}
            </Link>
          ))}
      </nav>

      {tab === "details" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Flag</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Description</dt>
                <dd>{flag.description}</dd>
                <dt className="text-muted-foreground">Env</dt>
                <dd>{flag.env}</dd>
                <dt className="text-muted-foreground">State</dt>
                <dd>{describe(flag)}</dd>
                <dt className="text-muted-foreground">Owner</dt>
                <dd>{flag.owner}</dd>
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{formatTs(flag.updatedAt)}</dd>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {options.length > 0 ? (
                <TransitionForm flagId={flag.id} flagKey={flag.key} options={options} />
              ) : (
                <p className="text-sm text-muted-foreground">No transitions available to you for this flag.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Before</TableHead>
                  <TableHead>After</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Request</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No audit entries yet.
                    </TableCell>
                  </TableRow>
                )}
                {auditRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">{formatTs(row.ts)}</TableCell>
                    <TableCell>{row.actor}</TableCell>
                    <TableCell>{row.action}</TableCell>
                    <TableCell>{describe(row.before)}</TableCell>
                    <TableCell>{describe(row.after)}</TableCell>
                    <TableCell>{row.reason}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.requestId.slice(0, 8)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
