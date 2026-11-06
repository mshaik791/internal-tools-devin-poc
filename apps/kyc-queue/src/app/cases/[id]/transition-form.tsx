"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const reason = String(new FormData(form).get("reason") ?? "");
    setPending(true);
    setError(null);
    const res = await fetch(`/api/cases/${caseId}/transition`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to: submitter?.value, reason }),
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
