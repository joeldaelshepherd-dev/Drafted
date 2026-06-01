import { Flag } from "@/components/ui";
import { flagUrlFor, getWorldCupTeam } from "@/lib/data/wc2026";
import type { GroupTable, GroupTableRow } from "@/lib/hub/types";
import { cn } from "@/lib/utils";

/**
 * 12 group tables. The top two positions are tinted as projected qualifiers so
 * the knockout picture reads at a glance, even before a ball is kicked.
 */

function StandingRow({ row }: { row: GroupTableRow }) {
  const team = getWorldCupTeam(row.teamId);
  const qualifying = row.position <= 2;
  return (
    <tr className={cn("border-t border-white/5", qualifying && "bg-brand/8")}>
      <td className="py-2 pl-2 pr-1 text-center">
        <span
          className={cn(
            "inline-grid h-5 w-5 place-items-center rounded text-[11px] font-bold",
            qualifying ? "bg-brand/25 text-brand" : "text-ink-faint",
          )}
        >
          {row.position}
        </span>
      </td>
      <td className="py-2 pr-2">
        <div className="flex items-center gap-2">
          <Flag url={team ? flagUrlFor(team) : null} code={team?.shortCode} size="sm" />
          <span className="truncate text-sm font-semibold text-ink">{team?.name ?? row.teamId}</span>
        </div>
      </td>
      <td className="px-1 text-center text-xs tabular-nums text-ink-muted">{row.played}</td>
      <td className="px-1 text-center text-xs tabular-nums text-ink-muted">{row.won}</td>
      <td className="px-1 text-center text-xs tabular-nums text-ink-muted">{row.drawn}</td>
      <td className="px-1 text-center text-xs tabular-nums text-ink-muted">{row.lost}</td>
      <td className="hidden px-1 text-center text-xs tabular-nums text-ink-muted sm:table-cell">{row.goalsFor}</td>
      <td className="hidden px-1 text-center text-xs tabular-nums text-ink-muted sm:table-cell">{row.goalsAgainst}</td>
      <td className="px-1 text-center text-xs tabular-nums text-ink-muted">
        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
      </td>
      <td className="px-2 text-center text-sm font-black tabular-nums text-ink">{row.points}</td>
    </tr>
  );
}

function GroupCard({ table }: { table: GroupTable }) {
  return (
    <div className="glass overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2.5">
        <h3 className="font-display text-sm font-black uppercase tracking-wide text-ink">
          Group {table.group}
        </h3>
        <span className="pill bg-white/8 text-[10px] text-ink-faint">Top 2 advance</span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-ink-faint">
            <th className="py-1.5 pl-2 font-semibold">#</th>
            <th className="py-1.5 text-left font-semibold">Team</th>
            <th className="px-1 font-semibold">P</th>
            <th className="px-1 font-semibold">W</th>
            <th className="px-1 font-semibold">D</th>
            <th className="px-1 font-semibold">L</th>
            <th className="hidden px-1 font-semibold sm:table-cell">GF</th>
            <th className="hidden px-1 font-semibold sm:table-cell">GA</th>
            <th className="px-1 font-semibold">GD</th>
            <th className="px-2 font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <StandingRow key={row.teamId} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GroupStandings({ tables }: { tables: GroupTable[] }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-faint">
        Tables update live once matches kick off. Until then teams are ordered by FIFA seeding.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        {tables.map((table) => (
          <GroupCard key={table.group} table={table} />
        ))}
      </div>
    </div>
  );
}
