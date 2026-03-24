import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
  className?: string;
}

export function Card({
  title,
  action,
  children,
  noPadding = false,
  className,
}: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-pm-border-base bg-pm-bg-card shadow-pm-card",
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-pm-border-subtle px-5 py-3.5">
          <h3 className="text-sm font-medium text-pm-fg-subtle">{title}</h3>
          {action}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}
