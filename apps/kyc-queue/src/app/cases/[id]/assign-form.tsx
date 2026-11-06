"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function AssignForm({
  caseId,
  current,
  users,
}: {
  caseId: string;
  current: string | null;
  users: { sub: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setError(null);
    const res = await fetch(`/api/cases/${caseId}/assign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assignedTo: data.get("assignedTo") || null, reason: data.get("assignReason") }),
    });
    if (!res.ok) {
      setError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? `HTTP ${res.status}`);
      return;
    }
    (form.elements.namedItem("assignReason") as HTMLTextAreaElement).value = "";
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assignedTo">Assignee</Label>
        <Select id="assignedTo" name="assignedTo" defaultValue={current ?? ""}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.sub} value={u.sub}>
              {u.name} ({u.sub})
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assignReason">Reason</Label>
        <Textarea id="assignReason" name="assignReason" required />
      </div>
      <Button type="submit" className="self-start">
        Save assignment
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
