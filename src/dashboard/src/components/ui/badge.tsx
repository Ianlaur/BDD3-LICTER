import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

const variants: Record<Variant, string> = {
  default: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  neutral: "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
