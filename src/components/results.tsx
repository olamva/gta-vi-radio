import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { ChevronDown, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ProfileAvatar } from "@/components/profile-avatar";
import { SpotifyIcon } from "@/components/spotify-icon";
import { StationArt } from "@/components/station-art";
import {
  matchLabel,
  normalize,
  playlistUrl,
  type Hit,
  type Ranking,
} from "@/match.ts";
import { renderCard, shareCard } from "@/share.ts";
import type { Profiles } from "@/spotify.ts";

interface ResultsProps {
  rankings: Ranking[];
  profiles: Profiles;
}

interface RowProps {
  ranking: Ranking;
  rank: number;
  profiles: Profiles;
}

interface HitListProps {
  title: string;
  hits: Hit[];
  score: number;
  profiles: Profiles;
}

interface ShowMoreProps {
  children: ReactNode;
  expanded: boolean;
  onClick: () => void;
}

const MINOR_SHARE = 0.02;
const MIN_HIDDEN = 3;

const stationStyle = (color: string) =>
  ({ "--station": color }) as CSSProperties;

const ShowMore = ({ children, expanded, onClick }: ShowMoreProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={expanded}
    className="cursor-pointer font-display text-lg font-bold text-muted-foreground uppercase transition-colors hover:text-foreground"
  >
    {expanded ? "− Show less" : <>+ {children}</>}
  </button>
);

const HitList = ({ title, hits, score, profiles }: HitListProps) => {
  const [expanded, setExpanded] = useState(false);
  const major = hits.filter(({ weight }) => weight / score >= MINOR_SHARE);
  const hidden = hits.length - major.length;
  const collapsible = hidden >= MIN_HIDDEN;
  const visible = expanded || !collapsible ? hits : major;
  return (
    hits.length > 0 && (
      <section>
        <h4 className="font-display text-base font-bold text-muted-foreground uppercase">
          {title}
        </h4>
        <ul className="mt-3 flex flex-wrap gap-2">
          {visible.map(({ artist }) => (
            <li key={artist} className="min-w-0">
              <a
                href={profiles.get(normalize(artist))?.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 min-w-0 items-center gap-2.5 bg-white/5 pr-3 transition-colors hover:bg-white/10"
              >
                <ProfileAvatar
                  name={artist}
                  image={profiles.get(normalize(artist))?.image}
                  className="size-9"
                />
                <span className="truncate text-sm font-medium">{artist}</span>
              </a>
            </li>
          ))}
          {collapsible && (
            <li className="flex items-center px-1">
              <ShowMore
                expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                {hidden} more
              </ShowMore>
            </li>
          )}
        </ul>
      </section>
    )
  );
};

const Row = ({ ranking, rank, profiles }: RowProps) => {
  const { station, hits, score } = ranking;
  const [open, setOpen] = useState(rank === 1 && hits.length > 0);
  const morph = (part: string) => ({ viewTransitionName: `${part}-${rank}` });
  const toggle = (next: boolean) =>
    document.startViewTransition
      ? document.startViewTransition(() => flushSync(() => setOpen(next)))
      : setOpen(next);
  return (
    <li
      style={{ ...stationStyle(station.color), ...morph("row") }}
      className="border-b border-white/15 [view-transition-class:clip]"
    >
      <Collapsible
        open={open}
        onOpenChange={toggle}
        disabled={!hits.length}
        className="group/row"
      >
        {!open && (
          <div className="relative grid grid-cols-[2rem_3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 py-4 sm:grid-cols-[3.5rem_4rem_minmax(0,1fr)_auto] sm:gap-x-4">
            <span
              style={morph("rank")}
              className="w-fit font-display text-3xl font-black text-muted-foreground tabular-nums transition-colors group-hover/row:text-[var(--station)] sm:text-4xl"
            >
              {rank}
            </span>
            <div style={morph("art")}>
              <StationArt station={station} className="w-full" />
            </div>
            <div className="min-w-0">
              <h2>
                <CollapsibleTrigger
                  style={morph("title")}
                  className="max-w-full text-left font-display text-xl leading-tight font-black uppercase outline-none after:absolute after:inset-0 enabled:cursor-pointer focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset sm:truncate sm:text-2xl"
                >
                  {station.name}
                </CollapsibleTrigger>
              </h2>
              <p
                style={morph("meta")}
                className="text-sm text-muted-foreground [view-transition-class:clip]"
              >
                {matchLabel(hits)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative z-10 text-muted-foreground hover:text-spotify"
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
                style={morph("chevron")}
                className={`size-5 text-muted-foreground ${hits.length ? "" : "invisible"}`}
              />
            </div>
          </div>
        )}
        <CollapsibleContent>
          <div className="relative grid gap-8 pt-6 pb-14 md:grid-cols-[minmax(0,280px)_1fr]">
            <div style={morph("art")} className="w-full max-w-72">
              <StationArt station={station} className="w-full" />
            </div>
            <div className="min-w-0">
              <p
                style={morph("rank")}
                className="w-fit font-display text-2xl font-bold text-sunset uppercase"
              >
                Your{" "}
                <span className="text-[var(--station)] tabular-nums">
                  #{rank}
                </span>{" "}
                station
              </p>
              <h2
                style={morph("title")}
                className="mt-2 w-fit font-display text-5xl leading-[0.85] font-black uppercase sm:text-8xl"
              >
                {station.name}
              </h2>
              <div
                style={morph("meta")}
                className="[view-transition-class:clip]"
              >
                <p className="mt-3 text-muted-foreground">{matchLabel(hits)}</p>
                <Button
                  asChild
                  size="lg"
                  className="mt-6 h-12 rounded-sm bg-spotify px-6 font-display text-xl font-black text-black uppercase hover:bg-spotify/90"
                >
                  <a
                    href={playlistUrl(station)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <SpotifyIcon className="size-5" />
                    Listen on Spotify
                  </a>
                </Button>
                <div className="mt-10 grid gap-6">
                  <HitList
                    title="On this station"
                    hits={hits.filter(({ similar }) => !similar)}
                    score={score}
                    profiles={profiles}
                  />
                  <HitList
                    title="Matched by sound only"
                    hits={hits.filter(({ similar }) => similar)}
                    score={score}
                    profiles={profiles}
                  />
                </div>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Collapse ${station.name}`}
                className="absolute top-6 right-0 text-muted-foreground"
              >
                <ChevronDown
                  aria-hidden
                  style={morph("chevron")}
                  className="size-5 rotate-180"
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
};

export const Results = ({ rankings, profiles }: ResultsProps) => {
  const [expanded, setExpanded] = useState(false);
  const [card, setCard] = useState<File>();
  const matched = rankings.filter(({ hits }) => hits.length);
  const visible = expanded ? rankings : matched;
  useEffect(() => {
    const hits = rankings.filter(({ hits }) => hits.length);
    if (hits.length) renderCard(hits).then(setCard);
  }, [rankings]);
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {card && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => shareCard(card, matched[0].station.name)}
          >
            <Share2 />
            Share my results
          </Button>
        </div>
      )}
      {!matched.length && (
        <p className="py-14 text-lg text-muted-foreground">
          None of your top artists play on a GTA VI station yet.
        </p>
      )}
      <ol className="mb-3">
        {visible.map((ranking, index) => (
          <Row
            key={ranking.station.name}
            ranking={ranking}
            rank={index + 1}
            profiles={profiles}
          />
        ))}
      </ol>
      {matched.length < rankings.length && (
        <div style={{ viewTransitionName: "more-stations" }}>
          <ShowMore expanded={expanded} onClick={() => setExpanded(!expanded)}>
            {rankings.length - matched.length} more stations
          </ShowMore>
        </div>
      )}
    </div>
  );
};
