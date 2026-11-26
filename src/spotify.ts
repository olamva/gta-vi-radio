import { RANGE_WEIGHTS, normalize, type History, type Range } from "./match.ts";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? "";
const SCOPES = "user-top-read user-read-recently-played";
const TOKEN_KEY = "spotify-token";
const VERIFIER_KEY = "spotify-verifier";
const ACCOUNTS = "https://accounts.spotify.com";

type Token = { accessToken: string; refreshToken: string; expiresAt: number };
type Artist = {
  name: string;
  external_urls: { spotify: string };
  images?: { url: string }[];
};
type User = Omit<Artist, "name"> & { id: string; display_name: string | null };
type Track = { artists: Artist[] };
type Page<T> = { items: T[] };

export type Profile = { name: string; url: string; image?: string };
export type Profiles = Map<string, Profile>;

export class SpotifyError extends Error {}

export const hasClientId = () => CLIENT_ID !== "";

const redirectUri = () => `${location.origin}/`;

const base64url = (bytes: ArrayBuffer | Uint8Array) =>
  new Uint8Array(bytes).toBase64({ alphabet: "base64url", omitPadding: true });

const storedToken = (): Token | undefined => {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) ?? "null") ?? undefined;
  } catch {
    return undefined;
  }
};

export const isLoggedIn = () => storedToken() !== undefined;

export const logout = () => localStorage.removeItem(TOKEN_KEY);

export const login = async () => {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(48)));
  localStorage.setItem(VERIFIER_KEY, verifier);
  const challenge = base64url(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
  );
  location.assign(
    `${ACCOUNTS}/authorize?${new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: redirectUri(),
      code_challenge_method: "S256",
      code_challenge: challenge,
      scope: SCOPES,
    })}`,
  );
};

const requestToken = async (params: Record<string, string>) => {
  const response = await fetch(`${ACCOUNTS}/api/token`, {
    method: "POST",
    body: new URLSearchParams({ client_id: CLIENT_ID, ...params }),
  });
  if (!response.ok) {
    logout();
    throw new SpotifyError("Your Spotify session ended. Log in again.");
  }
  const data = await response.json();
  const token: Token = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? params.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  return token;
};

export const completeLogin = async () => {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const error = params.get("error");
  if (!code && !error) return;
  history.replaceState(null, "", "/");
  const verifier = localStorage.getItem(VERIFIER_KEY);
  localStorage.removeItem(VERIFIER_KEY);
  if (error || !code || !verifier)
    throw new SpotifyError("Spotify login was cancelled.");
  await requestToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  });
};

let refreshing: Promise<Token> | undefined;

const accessToken = async (force = false) => {
  const token = storedToken();
  if (!token) throw new SpotifyError("Log in with Spotify to continue.");
  if (!force && token.expiresAt - 60_000 > Date.now()) return token.accessToken;
  refreshing ??= requestToken({
    grant_type: "refresh_token",
    refresh_token: token.refreshToken,
  }).finally(() => (refreshing = undefined));
  return (await refreshing).accessToken;
};

const api = async <T>(path: string, retry = true, attempt = 0): Promise<T> => {
  const response = await fetch(`https://api.spotify.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${await accessToken(!retry)}` },
  });
  if (response.status === 401 && retry) return api(path, false, attempt);
  if (response.status >= 500 && attempt < 3) {
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    return api(path, retry, attempt + 1);
  }
  if (response.status === 403)
    throw new SpotifyError(
      "This Spotify account is not on the app's user list yet. Ask the site owner to add it.",
    );
  if (!response.ok)
    throw new SpotifyError(`Spotify returned an error (${response.status}).`);
  return response.json();
};

const names = (artists: Artist[]) => artists.map(({ name }) => name);

const byRange = async <T>(load: (range: Range) => Promise<T>) =>
  Object.fromEntries(
    await Promise.all(
      (Object.keys(RANGE_WEIGHTS) as Range[]).map(
        async (range) => [range, await load(range)] as const,
      ),
    ),
  ) as Record<Range, T>;

const byRangeMap = <T, U>(values: Record<Range, T>, map: (value: T) => U) =>
  Object.fromEntries(
    Object.entries(values).map(([range, value]) => [range, map(value as T)]),
  ) as Record<Range, U>;

const profilesOf = (artists: Artist[]): Profiles => {
  const profiles: Profiles = new Map();
  for (const { name, external_urls, images } of artists) {
    const key = normalize(name);
    if (!profiles.get(key)?.image)
      profiles.set(key, {
        name,
        url: external_urls.spotify,
        image: images?.at(-1)?.url,
      });
  }
  return profiles;
};

export const listeningHistory = async (): Promise<{
  history: History;
  profiles: Profiles;
  account: Profile;
}> => {
  await accessToken();
  const [user, artists, tracks, recent] = await Promise.all([
    api<User>("me"),
    byRange(
      async (range) =>
        (await api<Page<Artist>>(`me/top/artists?limit=50&time_range=${range}`))
          .items,
    ),
    byRange(
      async (range) =>
        (await api<Page<Track>>(`me/top/tracks?limit=50&time_range=${range}`))
          .items,
    ),
    api<Page<{ track: Track }>>("me/player/recently-played?limit=50").then(
      ({ items }) => items.map(({ track }) => track),
    ),
  ]);
  const trackArtists = (list: Track[]) =>
    list.map(({ artists }) => names(artists));
  return {
    history: {
      topArtists: byRangeMap(artists, names),
      topTracks: byRangeMap(tracks, trackArtists),
      recent: trackArtists(recent),
    },
    profiles: profilesOf([
      ...Object.values(artists).flat(),
      ...[...Object.values(tracks).flat(), ...recent].flatMap(
        ({ artists }) => artists,
      ),
    ]),
    account: {
      name: user.display_name ?? user.id,
      url: user.external_urls.spotify,
      image: user.images?.at(-1)?.url,
    },
  };
};
