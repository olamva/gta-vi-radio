import type { Station } from "@/match.ts";
import { cn } from "@/lib/utils";

interface StationArtProps {
  station: Station;
  className?: string;
}

export const StationArt = ({ station, className }: StationArtProps) =>
  station.icon ? (
    <img
      src={station.icon}
      alt={`${station.name} logo`}
      loading="lazy"
      className={cn(
        "aspect-square shrink-0 rounded-md object-cover",
        className,
      )}
    />
  ) : (
    <div
      role="img"
      aria-label={`${station.name} logo`}
      style={{ color: station.color }}
      className={cn(
        "@container grid aspect-square shrink-0 place-items-center rounded-md border border-current/25 bg-current/10 p-[8%]",
        className,
      )}
    >
      <span className="font-display text-[19cqi] leading-[0.9] font-extrabold text-balance text-center uppercase">
        {station.name}
      </span>
    </div>
  );
