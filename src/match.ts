export type Station = {
  name: string;
  blurb: string;
  color: string;
  icon?: string;
  playlist?: string;
  artists: string[];
  similar: string[];
};

export const playlistUrl = ({ name, playlist }: Station) =>
  playlist
    ? `https://open.spotify.com/playlist/${playlist}`
    : `https://open.spotify.com/search/${encodeURIComponent(`GTAVI Radio: ${name}`)}`;

export type Range = "short_term" | "medium_term" | "long_term";

export type History = {
  topArtists: Record<Range, string[]>;
  topTracks: Record<Range, string[][]>;
  recent: string[][];
};

export type Listen = { artist: string; weight: number };

export type Hit = { artist: string; weight: number; similar: boolean };

export type Ranking = {
  station: Station;
  score: number;
  share: number;
  hits: Hit[];
};

export const RANGE_WEIGHTS: Record<Range, number> = {
  short_term: 3,
  medium_term: 2,
  long_term: 1,
};

const TRACK_WEIGHT = 0.5;
const RECENT_WEIGHT = 0.1;
const SIMILAR_WEIGHT = 0.4;

export const normalize = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/^the\s+/, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

const artists = (count: number, verb: string) =>
  `${count} of your artists ${verb}${count === 1 ? "s" : ""}`;

export const matchLabel = (hits: Hit[]) => {
  const similar = hits.filter((hit) => hit.similar).length;
  const direct = hits.length - similar;
  if (!direct)
    return similar
      ? `${artists(similar, "sound")} similar`
      : "None of your artists play here";
  return `${artists(direct, "play")} here${similar ? ` + ${similar} similar` : ""}`;
};

const decay = (index: number, length: number) => 1 - index / length;

export const weighHistory = ({
  topArtists,
  topTracks,
  recent,
}: History): Listen[] =>
  (Object.keys(RANGE_WEIGHTS) as Range[]).flatMap((range) => [
    ...topArtists[range].map((artist, index, all) => ({
      artist,
      weight: RANGE_WEIGHTS[range] * decay(index, all.length),
    })),
    ...topTracks[range].flatMap((artists, index, all) =>
      artists.map((artist) => ({
        artist,
        weight: RANGE_WEIGHTS[range] * TRACK_WEIGHT * decay(index, all.length),
      })),
    ),
    ...(range === "short_term"
      ? recent.flatMap((artists) =>
          artists.map((artist) => ({ artist, weight: RECENT_WEIGHT })),
        )
      : []),
  ]);

export const rankStations = (
  listens: Listen[],
  stations: Station[],
): Ranking[] => {
  const weights = new Map<string, Listen>();
  for (const { artist, weight } of listens) {
    const key = normalize(artist);
    const entry = weights.get(key) ?? { artist, weight: 0 };
    weights.set(key, { ...entry, weight: entry.weight + weight });
  }
  const total = [...weights.values()].reduce(
    (sum, { weight }) => sum + weight,
    0,
  );
  return stations
    .map((station) => {
      const direct = new Set(station.artists.map(normalize));
      const similar = new Set(station.similar.map(normalize));
      const hits = [...weights]
        .flatMap(([key, { artist, weight }]) =>
          direct.has(key)
            ? [{ artist, weight, similar: false }]
            : similar.has(key)
              ? [{ artist, weight: weight * SIMILAR_WEIGHT, similar: true }]
              : [],
        )
        .sort((a, b) => b.weight - a.weight);
      const score = hits.reduce((sum, { weight }) => sum + weight, 0);
      return { station, score, share: total ? score / total : 0, hits };
    })
    .sort((a, b) => b.score - a.score);
};
