import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-ink",
        "placeholder:text-ink-faint outline-none transition",
        "focus:border-brand/60 focus:ring-2 focus:ring-brand/30",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-muted", className)}
      {...props}
    />
  );
}
