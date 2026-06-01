import { cn } from "@/lib/utils";

export function Card({ className, glow, ...props }: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
  return (
    <div
      className={cn("glass p-4", glow && "ring-1 ring-brand/40 shadow-glow", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-sm font-bold uppercase tracking-wide text-ink-muted", className)} {...props} />;
}
