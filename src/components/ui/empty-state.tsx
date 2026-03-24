import type { ReactNode } from "react";
import { InboxIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({
  icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-pm-border-base bg-pm-bg-card px-6 py-12 text-center">
      <div className="mb-3 text-pm-fg-faint">
        {icon ?? <InboxIcon className="h-8 w-8" />}
      </div>
      <h3 className="text-sm font-medium text-pm-fg-subtle">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-pm-fg-muted">{description}</p>
      )}
    </div>
  );
}
