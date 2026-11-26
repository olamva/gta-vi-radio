import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { rankStations, weighHistory, type History } from "../src/match.ts";
import { STATIONS } from "../src/stations.ts";

const station = (name: string, artists: string[], similar: string[] = []) => ({
  name,
  blurb: "",
  color: "",
  artists,
  similar,
});

const history = (overrides: Partial<History>): History => ({
  topArtists: { short_term: [], medium_term: [], long_term: [] },
  topTracks: { short_term: [], medium_term: [], long_term: [] },
  recent: [],
  ...overrides,
});

const winner = (listens: History) =>
  rankStations(weighHistory(listens), STATIONS)[0].station.name;

test("recent favourites outweigh all-time favourites", () => {
  const stations = [station("Rock", ["Queen"]), station("Rap", ["Drake"])];
  const listens = weighHistory(
    history({
      topArtists: {
        short_term: ["Drake"],
        medium_term: [],
        long_term: ["Queen"],
      },
    }),
  );
  assert.deepEqual(
    rankStations(listens, stations).map(({ station }) => station.name),
    ["Rap", "Rock"],
  );
});

test("a station artist outweighs a similar artist", () => {
  const stations = [
    station("Similar", [], ["Queen"]),
    station("Direct", ["Queen"]),
  ];
  const [first, second] = rankStations(
    [{ artist: "Queen", weight: 1 }],
    stations,
  );
  assert.equal(first.station.name, "Direct");
  assert.ok(second.score > 0 && second.score < first.score);
});

test("artist names match across spelling differences", () => {
  const [ranking] = rankStations(
    [
      { artist: "JAY-Z", weight: 1 },
      { artist: "Tom Petty & The Heartbreakers", weight: 1 },
    ],
    [station("Mixed", ["JAŸ-Z", "Tom Petty and the Heartbreakers"])],
  );
  assert.equal(ranking.share, 1);
});

test("a modern rap listener gets Vice City Rap Radio", () => {
  assert.equal(
    winner(
      history({
        topArtists: {
          short_term: ["Future", "Gunna", "Travis Scott", "Playboi Carti"],
          medium_term: ["Lil Baby", "21 Savage"],
          long_term: ["Pop Smoke"],
        },
      }),
    ),
    "Vice City Rap Radio",
  );
});

test("a metal listener gets The Chamber", () => {
  assert.equal(
    winner(
      history({
        topTracks: {
          short_term: [["Metallica"], ["Slayer"], ["Gojira"]],
          medium_term: [["Pantera"]],
          long_term: [["Iron Maiden"]],
        },
      }),
    ),
    "The Chamber 106.6",
  );
});

test("every station icon exists in public", () => {
  const missing = STATIONS.flatMap(({ icon }) =>
    icon && !existsSync(`public${icon}`) ? [icon] : [],
  );
  assert.deepEqual(missing, []);
});
