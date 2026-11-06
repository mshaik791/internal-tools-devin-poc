"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ESCALATION_CATEGORIES, ESCALATION_CATEGORY_LABELS } from "@/kyc/escalation";

export function TransitionForm({
  caseId,
  options,
}: {
  caseId: string;
  options: { to: string; label: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const canEscalate = options.some((o) => o.to === "escalated");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const data = new FormData(form);
    const reason = String(data.get("reason") ?? "");
    const to = submitter?.value;
    const escalationCategory = to === "escalated" ? String(data.get("escalationCategory") ?? "") : undefined;
    if (to === "escalated" && !escalationCategory) {
      setError("Choose an escalation category");
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetch(`/api/cases/${caseId}/transition`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to, reason, escalationCategory }),
    });
    setPending(false);
    if (!res.ok) {
      setError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? `HTTP ${res.status}`);
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">Reason</Label>
        <Textarea id="reason" name="reason" required placeholder="Why are you making this change?" />
      </div>
      {canEscalate && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="escalationCategory">Escalation category (required to escalate)</Label>
          <Select id="escalationCategory" name="escalationCategory" defaultValue="">
            <option value="">Select…</option>
            {ESCALATION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {ESCALATION_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button
            key={o.to}
            type="submit"
            value={o.to}
            disabled={pending}
            variant={o.to === "rejected" ? "destructive" : o.to === "escalated" ? "outline" : "default"}
          >
            {o.label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
