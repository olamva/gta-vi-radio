import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SpotifyIcon } from "@/components/spotify-icon";
import { StationArt } from "@/components/station-art";
import { playlistUrl, type Ranking } from "@/match.ts";

interface ResultsProps {
  rankings: Ranking[];
}

interface WinnerProps {
  ranking: Ranking;
}

interface RowProps {
  ranking: Ranking;
  rank: number;
  top: number;
}

const percent = (share: number) => `${Math.round(share * 100)}%`;

const stationStyle = (color: string) =>
  ({ "--station": color }) as CSSProperties;

const Winner = ({ ranking }: WinnerProps) => (
  <section
    style={stationStyle(ranking.station.color)}
    className="grid gap-8 pt-6 pb-14 md:grid-cols-[minmax(0,280px)_1fr] md:items-end"
  >
    <StationArt
      station={ranking.station}
      className="w-full max-w-72 shadow-2xl shadow-black/50"
    />
    <div>
      <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
        Your station
      </p>
      <h1 className="mt-2 font-display text-6xl leading-[0.9] font-extrabold uppercase sm:text-8xl">
        {ranking.station.name}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-foreground/80">
        {ranking.station.blurb}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {ranking.matches.slice(0, 6).map((artist) => (
          <Badge key={artist} variant="outline" className="px-2.5 py-1">
            {artist}
          </Badge>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button
          asChild
          size="lg"
          className="h-12 rounded-full bg-spotify px-7 text-base font-semibold text-black hover:bg-spotify/90"
        >
          <a
            href={playlistUrl(ranking.station)}
            target="_blank"
            rel="noreferrer"
          >
            <SpotifyIcon className="size-5" />
            Listen on Spotify
          </a>
        </Button>
        <p className="text-sm text-muted-foreground">
          Covers {percent(ranking.share)} of your listening
        </p>
      </div>
    </div>
  </section>
);

const Row = ({ ranking, rank, top }: RowProps) => (
  <li style={stationStyle(ranking.station.color)}>
    <Card className="gap-0 py-0 transition-colors hover:border-[var(--station)]/60 hover:bg-accent/60">
      <a
        href={playlistUrl(ranking.station)}
        target="_blank"
        rel="noreferrer"
        className="group grid grid-cols-[2rem_3.5rem_1fr_auto] items-center gap-x-4 gap-y-3 p-4 sm:grid-cols-[2.5rem_4rem_1fr_10rem_auto]"
      >
        <span className="text-center font-display text-3xl font-bold text-muted-foreground tabular-nums">
          {rank}
        </span>
        <StationArt station={ranking.station} className="w-full" />
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl font-bold uppercase">
            {ranking.station.name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {ranking.matches.length
              ? ranking.matches.slice(0, 4).join(", ")
              : ranking.station.blurb}
          </p>
        </div>
        <div className="col-span-full flex items-center gap-3 sm:col-span-1">
          <span className="w-10 text-right text-sm font-semibold tabular-nums">
            {percent(ranking.share)}
          </span>
          <Progress
            value={top ? (ranking.score / top) * 100 : 0}
            className="bg-white/10 *:data-[slot=progress-indicator]:bg-[var(--station)]"
          />
        </div>
        <ArrowUpRight
          aria-label="Open playlist on Spotify"
          className="col-start-4 row-start-1 size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground sm:col-start-5"
        />
      </a>
    </Card>
  </li>
);

export const Results = ({ rankings }: ResultsProps) => {
  const [best] = rankings;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {best.score ? (
        <Winner ranking={best} />
      ) : (
        <p className="py-14 text-lg text-muted-foreground">
          None of your top artists play on a GTA VI station yet.
        </p>
      )}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-3xl font-bold uppercase">
            All stations
          </h2>
          <p className="text-sm text-muted-foreground">
            Share of your weighted listening. Select a station to open its
            playlist.
          </p>
        </div>
        <ol className="mt-6 grid gap-3">
          {rankings.map((ranking, index) => (
            <Row
              key={ranking.station.name}
              ranking={ranking}
              rank={index + 1}
              top={best.score}
            />
          ))}
        </ol>
      </section>
    </div>
  );
};
