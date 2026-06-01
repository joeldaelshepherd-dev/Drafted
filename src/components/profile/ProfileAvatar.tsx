import { cn, initials } from "@/lib/utils";
import { Flag } from "@/components/ui";
import { flagUrlFor, getWorldCupTeam } from "@/lib/data/wc2026";
import type { AvatarConfig } from "@/lib/profile/types";

const sizes = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-lg",
  lg: "h-24 w-24 text-3xl",
} as const;

/** Renders a player's chosen avatar — a team crest, or a coloured jersey number. */
export function ProfileAvatar({
  config,
  name,
  size = "md",
  className,
}: {
  config: AvatarConfig;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (config.style === "crest" && config.teamId) {
    const team = getWorldCupTeam(config.teamId);
    return (
      <div
        className={cn(
          "grid place-items-center overflow-hidden rounded-full ring-2 ring-white/15",
          sizes[size],
          className,
        )}
        style={{ backgroundColor: config.color }}
      >
        {team ? (
          <Flag url={flagUrlFor(team)} code={team.shortCode} className="h-3/5 w-3/5" />
        ) : (
          <span className="font-black text-white">{initials(name)}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid place-items-center rounded-full font-black text-white ring-2 ring-white/15",
        "drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: config.color }}
    >
      {config.number != null ? <span className="tabular-nums">{config.number}</span> : initials(name)}
    </div>
  );
}
