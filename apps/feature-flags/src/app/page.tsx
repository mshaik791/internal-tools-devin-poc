import { getSession } from "@internal/core/auth/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { groupByEnv, listFlags } from "@/flags/flags";
import { FLAG_ENVS, FLAG_STATES, TRANSITION_LABELS, transitionsFor } from "@/flags/machine";
import { formatTs } from "@/lib/format";
import { can } from "@/permissions";
import { StateBadge } from "./state-badge";
import { TransitionForm } from "./transition-form";

export const dynamic = "force-dynamic";

type Search = { state?: string; q?: string; sort?: string };

export default async function FlagsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session, "flag", "read")) return <p>403 — you do not have access to feature flags.</p>;

  const { state = "", q = "", sort = "key" } = await searchParams;
  const groups = groupByEnv(await listFlags(session, { state, q, sort: sort === "updated" ? "updated" : "key" }));

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-wrap items-end gap-2" method="get">
        <label className="flex flex-col gap-1 text-xs">
          Key
          <input name="q" defaultValue={q} className="h-9 rounded-md border px-2 text-sm" aria-label="Key search" />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          State
          <Select name="state" defaultValue={state} aria-label="State filter">
            <option value="">All</option>
            {FLAG_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Sort
          <Select name="sort" defaultValue={sort} aria-label="Sort">
            <option value="key">Key</option>
            <option value="updated">Recently updated</option>
          </Select>
        </label>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      {FLAG_ENVS.map((env) => (
        <Card key={env} data-testid={`env-${env}`}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="capitalize">{env}</CardTitle>
            <span className="text-sm text-muted-foreground">{groups[env].length} flags</span>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups[env].map((f) => {
                  const options = transitionsFor(session, f).map((to) => ({ to, label: TRANSITION_LABELS[to] }));
                  return (
                    <TableRow key={f.id} data-testid={`flag-row-${f.id}`}>
                      <TableCell>
                        <Link href={`/flags/${f.id}`} className="font-mono underline-offset-4 hover:underline">
                          {f.key}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{f.description}</TableCell>
                      <TableCell>
                        <StateBadge state={f.state} percentage={f.percentage} data-testid="flag-state" />
                      </TableCell>
                      <TableCell className="text-sm">{f.owner}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{formatTs(f.updatedAt)}</TableCell>
                      <TableCell>
                        {options.length > 0 ? (
                          <TransitionForm flagId={f.id} flagKey={f.key} options={options} compact />
                        ) : (
                          <span className="text-xs text-muted-foreground">read only</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
