import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dates";
import type { clientStatus } from "@/lib/ledger";

type Status = ReturnType<typeof clientStatus>;

export function DueStatusBadge({ status }: { status: Status }) {
  if (status.credit > 0) {
    return <Badge variant="secondary">Advance / credit</Badge>;
  }
  if (status.outstanding <= 0) {
    return <Badge variant="secondary">Settled</Badge>;
  }
  if (status.overdue) {
    return <Badge variant="destructive">Overdue {status.daysOverdue}d</Badge>;
  }
  if (status.dueToday) {
    return <Badge>Due today</Badge>;
  }
  if (status.promised) {
    return <Badge variant="outline">Promised {formatDate(status.promised)}</Badge>;
  }
  return <Badge variant="outline">Unscheduled</Badge>;
}
