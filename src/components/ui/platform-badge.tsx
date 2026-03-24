import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platform: string;
  size?: "sm" | "md";
}

export function PlatformBadge({ platform, size = "sm" }: PlatformBadgeProps) {
  const isPoly =
    platform.toLowerCase() === "polymarket" || platform.toLowerCase() === "poly";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset",
        isPoly
          ? "bg-violet-500/10 text-violet-400 ring-violet-500/20"
          : "bg-blue-500/10 text-blue-400 ring-blue-500/20",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isPoly ? "bg-violet-400" : "bg-blue-400"
        )}
      />
      {isPoly ? "Polymarket" : "Kalshi"}
    </span>
  );
}
