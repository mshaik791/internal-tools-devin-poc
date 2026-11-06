import { getSession } from "@internal/core/auth/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isOverdue, listCases } from "@/kyc/cases";
import { KYC_STATUSES } from "@/kyc/machine";
import { visibleRegions } from "@/kyc/regions";
import { formatTs } from "@/lib/format";
import { cn } from "@/lib/utils";
import { can } from "@/permissions";
import { StatusBadge } from "./status-badge";

export const dynamic = "force-dynamic";

type Search = { status?: string; region?: string; sort?: string };

export default async function QueuePage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session, "case", "read")) return <p>403 — you do not have access to the KYC queue.</p>;

  const { status = "", region = "", sort = "asc" } = await searchParams;
  const cases = await listCases(session, { status, region, sort: sort === "desc" ? "desc" : "asc" });
  const now = new Date();
  const overdueCount = cases.filter((c) => isOverdue(c, now)).length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>KYC review queue</CardTitle>
        <span className="text-sm text-muted-foreground">
          {cases.length} cases · <span className="text-destructive">{overdueCount} overdue</span>
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form className="flex flex-wrap items-end gap-2" method="get">
          <label className="flex flex-col gap-1 text-xs">
            Status
            <Select name="status" defaultValue={status} aria-label="Status filter">
              <option value="">All</option>
              {KYC_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Region
            <Select name="region" defaultValue={region} aria-label="Region filter">
              <option value="">All visible</option>
              {visibleRegions(session).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            SLA due
            <Select name="sort" defaultValue={sort} aria-label="Sort">
              <option value="asc">Soonest first</option>
              <option value="desc">Latest first</option>
            </Select>
          </label>
          <Button type="submit" variant="outline">
            Apply
          </Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>SLA due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => {
              const overdue = isOverdue(c, now);
              return (
                <TableRow key={c.id} data-overdue={overdue} className={cn(overdue && "bg-red-50 hover:bg-red-100")}>
                  <TableCell>
                    <Link href={`/cases/${c.id}`} className="font-mono underline-offset-4 hover:underline">
                      {c.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>{c.customerName}</div>
                    <div className="text-xs text-muted-foreground">{c.customerEmail}</div>
                  </TableCell>
                  <TableCell>{c.region}</TableCell>
                  <TableCell>{c.riskScore}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>{c.assignedTo ?? "—"}</TableCell>
                  <TableCell className={cn(overdue && "font-medium text-destructive")}>
                    {formatTs(c.slaDueAt)} {overdue && <Badge variant="destructive">Overdue</Badge>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
