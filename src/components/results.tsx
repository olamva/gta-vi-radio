import { useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SpotifyIcon } from "@/components/spotify-icon";
import { StationArt } from "@/components/station-art";
import {
  matchLabel,
  normalize,
  playlistUrl,
  type Hit,
  type Ranking,
} from "@/match.ts";
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
  profiles: Profiles;
}

interface ArtistAvatarProps {
  artist: string;
  profiles: Profiles;
  className?: string;
}

interface HitListProps {
  title: string;
  hits: Hit[];
  score: number;
  profiles: Profiles;
}

const MINOR_SHARE = 0.02;
const MIN_HIDDEN = 3;

const stationStyle = (color: string) =>
  ({ "--station": color }) as CSSProperties;

const featured = (hits: Hit[], profiles: Profiles, count: number) => {
  const pictured = hits.filter(
    ({ artist }) => profiles.get(normalize(artist))?.image,
  );
  return (pictured.length >= 4 ? pictured : hits)
    .slice(0, count)
    .map(({ artist }) => artist);
};

const ArtistAvatar = ({ artist, profiles, className }: ArtistAvatarProps) => (
  <Avatar className={className}>
    <AvatarImage src={profiles.get(normalize(artist))?.image} alt={artist} />
    <AvatarFallback className="font-semibold">
      {artist.slice(0, 1)}
    </AvatarFallback>
  </Avatar>
);

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
        {featured(ranking.hits, profiles, 8).map((artist) => (
          <li key={artist}>
            <a
              href={profiles.get(normalize(artist))?.url}
              target="_blank"
              rel="noreferrer"
              title={artist}
              className="block rounded-full ring-offset-2 ring-offset-background transition hover:ring-2 hover:ring-[var(--station)]"
            >
              <ArtistAvatar
                artist={artist}
                profiles={profiles}
                className="size-12"
              />
            </a>
          </li>
        ))}
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
          {matchLabel(ranking.hits)}
        </p>
      </div>
    </div>
  </section>
);

const HitList = ({ title, hits, score, profiles }: HitListProps) => {
  const [expanded, setExpanded] = useState(false);
  const major = hits.filter(({ weight }) => weight / score >= MINOR_SHARE);
  const visible =
    expanded || hits.length - major.length < MIN_HIDDEN ? hits : major;
  return (
    hits.length > 0 && (
      <section>
        <h4 className="text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase">
          {title}
        </h4>
        <ul className="mt-3 flex flex-wrap gap-2">
          {visible.map(({ artist }) => (
            <li key={artist} className="min-w-0">
              <a
                href={profiles.get(normalize(artist))?.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 min-w-0 items-center gap-2 rounded-full bg-white/5 pr-3.5 pl-1 transition hover:bg-white/10 hover:ring-1 hover:ring-[var(--station)]"
              >
                <ArtistAvatar
                  artist={artist}
                  profiles={profiles}
                  className="size-7"
                />
                <span className="truncate text-sm font-medium">{artist}</span>
              </a>
            </li>
          ))}
          {visible.length < hits.length && (
            <li>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full px-3.5 text-muted-foreground"
                onClick={() => setExpanded(true)}
              >
                +{hits.length - visible.length} more
              </Button>
            </li>
          )}
        </ul>
      </section>
    )
  );
};

const Row = ({ ranking, rank, profiles }: RowProps) => {
  const { station, hits, score } = ranking;
  return (
    <li style={stationStyle(station.color)}>
      <Collapsible asChild disabled={!hits.length}>
        <Card className="group/row gap-0 py-0 transition-colors hover:border-[var(--station)]/60 data-[state=open]:border-[var(--station)]/60">
          <div className="relative grid grid-cols-[2rem_3.5rem_minmax(0,1fr)_auto] items-center gap-x-4 p-4 sm:grid-cols-[2.5rem_4rem_minmax(0,1fr)_auto_auto]">
            <span className="text-center font-display text-3xl font-bold text-muted-foreground tabular-nums">
              {rank}
            </span>
            <StationArt station={station} className="w-full" />
            <div className="min-w-0">
              <h3>
                <CollapsibleTrigger className="block max-w-full truncate text-left font-display text-xl font-bold uppercase outline-none after:absolute after:inset-0 after:rounded-xl enabled:cursor-pointer focus-visible:after:ring-2 focus-visible:after:ring-ring">
                  {station.name}
                </CollapsibleTrigger>
              </h3>
              <p className="text-sm text-muted-foreground">
                {matchLabel(hits)}
              </p>
            </div>
            <div className="hidden -space-x-2 transition-opacity group-data-[state=open]/row:opacity-0 sm:flex">
              {featured(hits, profiles, 4).map((artist) => (
                <ArtistAvatar
                  key={artist}
                  artist={artist}
                  profiles={profiles}
                  className="size-8 ring-2 ring-card"
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative z-10 rounded-full text-muted-foreground hover:text-spotify"
              >
                <a
                  href={playlistUrl(station)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${station.name} on Spotify`}
                  title="Open on Spotify"
                >
                  <SpotifyIcon className="size-5" />
                </a>
              </Button>
              <ChevronDown
                aria-hidden
                className={`size-5 text-muted-foreground transition-transform group-data-[state=open]/row:rotate-180 ${hits.length ? "" : "invisible"}`}
              />
            </div>
          </div>
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="grid gap-6 border-t px-4 py-5 sm:pr-24 sm:pl-[9.5rem]">
              <HitList
                title="Play on this station"
                hits={hits.filter(({ similar }) => !similar)}
                score={score}
                profiles={profiles}
              />
              <HitList
                title="Sound similar · count less"
                hits={hits.filter(({ similar }) => similar)}
                score={score}
                profiles={profiles}
              />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </li>
  );
};

export const Results = ({ rankings, profiles }: ResultsProps) => {
  const [expanded, setExpanded] = useState(false);
  const [best] = rankings;
  const matched = rankings.filter(({ hits }) => hits.length);
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
              profiles={profiles}
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
