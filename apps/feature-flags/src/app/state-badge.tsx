import { Badge } from "@/components/ui/badge";
import type { FlagState } from "@/flags/machine";

const VARIANT: Record<FlagState, "default" | "secondary" | "outline"> = {
  on: "default",
  percentage: "secondary",
  off: "outline",
};

export function StateBadge({
  state,
  percentage,
  ...rest
}: { state: FlagState; percentage: number | null } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <Badge variant={VARIANT[state]} {...rest}>
      {state === "percentage" ? `${percentage}%` : state}
    </Badge>
  );
}
