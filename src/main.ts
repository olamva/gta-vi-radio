import "./style.css";
import { rankStations, weighHistory, type Ranking } from "./match.ts";
import {
  SpotifyError,
  completeLogin,
  hasClientId,
  isLoggedIn,
  listeningHistory,
  login,
  logout,
} from "./spotify.ts";
import { STATIONS } from "./stations.ts";

const SPOTIFY_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.38-1.32 9.78-.66 13.5 1.62.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"/></svg>`;

const app = document.querySelector<HTMLElement>("#app")!;
const logoutButton = document.querySelector<HTMLButtonElement>("#logout")!;

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const artistList = (matches: string[], count: number) =>
  matches.length
    ? `Because you play ${escape(matches.slice(0, count).join(", "))}`
    : "None of your artists play here";

const showLogin = (message = "") => {
  logoutButton.hidden = true;
  app.innerHTML = `
    <section class="hero">
      <h1>Which Leonida radio station is yours?</h1>
      <p class="lead">Log in with Spotify. We weigh your top artists and tracks from the last 4 weeks, 6 months and year, then rank all ${STATIONS.length} GTA VI music stations for you.</p>
      ${message ? `<p class="notice">${escape(message)}</p>` : ""}
      <button class="spotify" type="button">${SPOTIFY_ICON}Log in with Spotify</button>
      <p class="fine">Only your browser reads your listening history. You stay logged in on this device.</p>
    </section>`;
  app.querySelector("button")!.addEventListener("click", login);
};

const showLoading = () => {
  app.innerHTML = `<p class="loading">Tuning in to your listening history…</p>`;
};

const row = (
  { station, score, share, matches }: Ranking,
  index: number,
  top: number,
) => `
  <li class="card" style="--station: ${station.color}; --fill: ${top ? (score / top) * 100 : 0}%">
    <span class="rank">${index + 1}</span>
    <div class="info">
      <h3>${escape(station.name)}</h3>
      <p>${escape(station.blurb)}</p>
      <p class="matches">${artistList(matches, 4)}</p>
    </div>
    <div class="meter">
      <span class="score">${Math.round(share * 100)}%</span>
      <span class="bar"><span></span></span>
    </div>
  </li>`;

const showResults = (rankings: Ranking[]) => {
  logoutButton.hidden = false;
  const [best] = rankings;
  app.innerHTML = `
    ${
      best.score
        ? `<section class="winner card" style="--station: ${best.station.color}">
            <p class="eyebrow">Your station</p>
            <h1>${escape(best.station.name)}</h1>
            <p class="lead">${escape(best.station.blurb)}</p>
            <p class="matches">${artistList(best.matches, 6)}</p>
          </section>`
        : `<p class="notice">None of your top artists play on a GTA VI station yet. Listen to more music and come back later.</p>`
    }
    <section>
      <h2>All stations</h2>
      <p class="fine">The percentage is the share of your weighted listening that each station covers.</p>
      <ol class="ranking">${rankings.map((ranking, index) => row(ranking, index, best.score)).join("")}</ol>
    </section>`;
};

const run = async () => {
  if (!hasClientId())
    return showLogin(
      "Spotify login is not set up yet. Set VITE_SPOTIFY_CLIENT_ID.",
    );
  try {
    await completeLogin();
    if (!isLoggedIn()) return showLogin();
    showLoading();
    showResults(rankStations(weighHistory(await listeningHistory()), STATIONS));
  } catch (error) {
    showLogin(
      error instanceof SpotifyError
        ? error.message
        : "Something went wrong. Try again.",
    );
  }
};

logoutButton.addEventListener("click", () => {
  logout();
  showLogin();
});

run();
