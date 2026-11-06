"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Options come from transitionsFor() on the server; the API re-checks the same rules. */
export function TransitionForm({
  flagId,
  flagKey,
  options,
  compact = false,
}: {
  flagId: string;
  flagKey: string;
  options: { to: string; label: string }[];
  compact?: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const hasPercentage = options.some((o) => o.to === "percentage");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const data = new FormData(form);
    setPending(true);
    setError(null);
    const res = await fetch(`/api/flags/${flagId}/transition`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to: submitter?.value, reason: data.get("reason"), percentage: data.get("percentage") }),
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
    <form onSubmit={onSubmit} className={cn("flex gap-2", compact ? "flex-wrap items-center" : "flex-col gap-3")}>
      {compact ? (
        <input
          name="reason"
          required
          aria-label={`Reason for ${flagKey}`}
          placeholder="Reason"
          className="h-8 w-40 rounded-md border px-2 text-sm"
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-reason`}>Reason</Label>
          <Textarea id={`${id}-reason`} name="reason" required placeholder="Why are you making this change?" />
        </div>
      )}
      {hasPercentage && (
        <input
          name="percentage"
          type="number"
          min={1}
          max={99}
          aria-label={`Percentage for ${flagKey}`}
          placeholder="%"
          className="h-8 w-16 rounded-md border px-2 text-sm"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button
            key={o.to}
            type="submit"
            value={o.to}
            size={compact ? "sm" : "default"}
            disabled={pending}
            variant={o.to === "off" ? "outline" : "default"}
          >
            {o.label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="w-full text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
