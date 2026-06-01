import { cn } from "@/lib/utils";

const sizes = { sm: "h-4 w-6", md: "h-5 w-7", lg: "h-8 w-12" } as const;

/** Country flag chip. `url` is a flagcdn (or provider) SVG/PNG. */
export function Flag({
  url,
  code,
  size = "md",
  className,
}: {
  url?: string | null;
  code?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (!url) {
    return (
      <span className={cn("grid place-items-center rounded bg-white/8 text-[10px] font-bold text-ink-muted", sizes[size], className)}>
        {code ?? "?"}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={code ?? "flag"}
      className={cn("rounded object-cover ring-1 ring-white/10", sizes[size], className)}
    />
  );
}
