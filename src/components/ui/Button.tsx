import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-bg hover:bg-brand/90 shadow-glow font-bold",
  secondary: "bg-white/8 text-ink hover:bg-white/12 border border-white/10",
  ghost: "bg-transparent text-ink-muted hover:text-ink hover:bg-white/5",
  danger: "bg-loss/90 text-white hover:bg-loss",
  gold: "bg-gold text-bg hover:bg-gold/90 shadow-glow-gold font-bold",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-12 px-5 text-sm rounded-xl",
  lg: "h-14 px-7 text-base rounded-2xl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "tap inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
