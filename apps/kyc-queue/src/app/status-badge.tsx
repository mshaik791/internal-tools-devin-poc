import { Badge } from "@/components/ui/badge";
import type { KycStatus } from "@/kyc/machine";

const VARIANT: Record<KycStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  in_review: "secondary",
  escalated: "destructive",
  approved: "default",
  rejected: "outline",
};

export function StatusBadge({ status, ...rest }: { status: KycStatus } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <Badge variant={VARIANT[status]} {...rest}>
      {status}
    </Badge>
  );
}
