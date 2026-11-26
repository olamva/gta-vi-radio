import { useState, type CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SpotifyIcon } from "@/components/spotify-icon";
import { StationArt } from "@/components/station-art";
import { normalize, playlistUrl, type Ranking } from "@/match.ts";
import type { Profiles } from "@/spotify.ts";

interface ResultsProps {
  rankings: Ranking[];
  profiles: Profiles;
}

interface WinnerProps {
  ranking: Ranking;
  profiles: Profiles;
}

interface RowProps {
  ranking: Ranking;
  rank: number;
}

const percentOf = (share: number) => Math.round(share * 100);

const stationStyle = (color: string) =>
  ({ "--station": color }) as CSSProperties;

const Winner = ({ ranking, profiles }: WinnerProps) => (
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
      <ul className="mt-6 flex flex-wrap gap-2">
        {ranking.matches.slice(0, 8).map((artist) => {
          const profile = profiles.get(normalize(artist));
          return (
            <li key={artist}>
              <a
                href={profile?.url}
                target="_blank"
                rel="noreferrer"
                title={artist}
                className="block rounded-full ring-offset-2 ring-offset-background transition hover:ring-2 hover:ring-[var(--station)]"
              >
                <Avatar className="size-12">
                  <AvatarImage src={profile?.image} alt={artist} />
                  <AvatarFallback className="font-semibold">
                    {artist.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
              </a>
            </li>
          );
        })}
      </ul>
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
          {percentOf(ranking.share)}% of your listening
        </p>
      </div>
    </div>
  </section>
);

const Row = ({ ranking, rank }: RowProps) => (
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
            {ranking.matches.slice(0, 4).join(", ")}
          </p>
        </div>
        <div className="col-span-full flex items-center gap-3 sm:col-span-1">
          <span className="w-10 text-right text-sm font-semibold tabular-nums">
            {percentOf(ranking.share)}%
          </span>
          <Progress
            value={percentOf(ranking.share)}
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

export const Results = ({ rankings, profiles }: ResultsProps) => {
  const [expanded, setExpanded] = useState(false);
  const [best] = rankings;
  const matched = rankings.filter(({ share }) => percentOf(share) > 0);
  const visible = expanded ? rankings : matched;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {best.score ? (
        <Winner ranking={best} profiles={profiles} />
      ) : (
        <p className="py-14 text-lg text-muted-foreground">
          None of your top artists play on a GTA VI station yet.
        </p>
      )}
      <section>
        <h2 className="font-display text-3xl font-bold uppercase">
          All stations
        </h2>
        <ol className="mt-6 grid gap-3">
          {visible.map((ranking, index) => (
            <Row
              key={ranking.station.name}
              ranking={ranking}
              rank={index + 1}
            />
          ))}
        </ol>
        {visible.length < rankings.length && (
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => setExpanded(true)}
          >
            Show {rankings.length - visible.length} more stations
          </Button>
        )}
      </section>
    </div>
  );
};
