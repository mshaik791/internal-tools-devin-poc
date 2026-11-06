import { getSession } from "@internal/core/auth/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assignableUsers, getCase, isOverdue, listAudit } from "@/kyc/cases";
import { ESCALATION_CATEGORY_LABELS, parseEscalationCategory } from "@/kyc/escalation";
import { TRANSITION_LABELS, transitionsFor } from "@/kyc/machine";
import { formatTs } from "@/lib/format";
import { cn } from "@/lib/utils";
import { can } from "@/permissions";
import { StatusBadge } from "../../status-badge";
import { AssignForm } from "./assign-form";
import { TransitionForm } from "./transition-form";

export const dynamic = "force-dynamic";

const statusOf = (v: unknown) => {
  if (!v || typeof v !== "object" || !("status" in v)) return null;
  const category = "escalationCategory" in v ? parseEscalationCategory(v.escalationCategory) : null;
  return category ? `${String(v.status)} (${ESCALATION_CATEGORY_LABELS[category]})` : String(v.status);
};
const assigneeOf = (v: unknown) =>
  v && typeof v === "object" && "assignedTo" in v ? String(v.assignedTo ?? "unassigned") : null;

export default async function CasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session, "case", "read")) return <p>403 — you do not have access to KYC cases.</p>;

  const { id } = await params;
  const kase = await getCase(session, id);
  if (!kase) notFound();

  const tab = (await searchParams).tab === "audit" && can(session, "audit", "read") ? "audit" : "details";
  const options = transitionsFor(session, kase.status).map((to) => ({ to, label: TRANSITION_LABELS[to] }));
  const overdue = isOverdue(kase);
  const auditRows = tab === "audit" ? ((await listAudit(session, kase.id)) ?? []) : [];

  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← Queue
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-xl font-semibold">{kase.id}</h1>
        <StatusBadge status={kase.status} data-testid="case-status" />
        {overdue && <Badge variant="destructive">Overdue</Badge>}
      </div>

      <nav className="flex gap-1 border-b">
        {(["details", "audit"] as const)
          .filter((t) => t === "details" || can(session, "audit", "read"))
          .map((t) => (
            <Link
              key={t}
              href={t === "audit" ? `/cases/${kase.id}?tab=audit` : `/cases/${kase.id}`}
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
              <CardTitle>Case</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Customer</dt>
                <dd>{kase.customerName}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{kase.customerEmail}</dd>
                <dt className="text-muted-foreground">Region</dt>
                <dd>{kase.region}</dd>
                <dt className="text-muted-foreground">Risk score</dt>
                <dd>{kase.riskScore}</dd>
                <dt className="text-muted-foreground">Escalation category</dt>
                <dd data-testid="escalation-category">
                  {kase.escalationCategory ? ESCALATION_CATEGORY_LABELS[kase.escalationCategory] : "—"}
                </dd>
                <dt className="text-muted-foreground">Assigned to</dt>
                <dd>{kase.assignedTo ?? "—"}</dd>
                <dt className="text-muted-foreground">SLA due</dt>
                <dd className={cn(overdue && "font-medium text-destructive")}>{formatTs(kase.slaDueAt)}</dd>
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatTs(kase.createdAt)}</dd>
              </dl>
            </CardContent>
          </Card>
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {options.length > 0 ? (
                  <TransitionForm caseId={kase.id} options={options} />
                ) : (
                  <p className="text-sm text-muted-foreground">No transitions available to you for this case.</p>
                )}
              </CardContent>
            </Card>
            {can(session, "case", "assign") && (
              <Card>
                <CardHeader>
                  <CardTitle>Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <AssignForm
                    caseId={kase.id}
                    current={kase.assignedTo}
                    users={(await assignableUsers(kase.region)).map(({ sub, name }) => ({ sub, name }))}
                  />
                </CardContent>
              </Card>
            )}
          </div>
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
                    <TableCell>{statusOf(row.before) ?? assigneeOf(row.before) ?? "—"}</TableCell>
                    <TableCell>{statusOf(row.after) ?? assigneeOf(row.after) ?? "—"}</TableCell>
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
