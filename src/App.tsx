import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Login } from "@/components/login";
import { Results } from "@/components/results";
import { rankStations, weighHistory, type Ranking } from "@/match.ts";
import {
  SpotifyError,
  completeLogin,
  hasClientId,
  isLoggedIn,
  listeningHistory,
  login,
  logout,
} from "@/spotify.ts";
import { STATIONS } from "@/stations.ts";

type State =
  | { status: "login"; error?: string }
  | { status: "loading" }
  | { status: "done"; rankings: Ranking[] };

const loadRankings = async (): Promise<State> => {
  if (!hasClientId())
    return { status: "login", error: "Spotify login is not set up yet." };
  try {
    await completeLogin();
    if (!isLoggedIn()) return { status: "login" };
    return {
      status: "done",
      rankings: rankStations(weighHistory(await listeningHistory()), STATIONS),
    };
  } catch (error) {
    return {
      status: "login",
      error:
        error instanceof SpotifyError
          ? error.message
          : "Something went wrong. Try again.",
    };
  }
};

const initialLoad = loadRankings();

const Loading = () => (
  <div className="mx-auto grid max-w-6xl gap-3 px-4 pt-6 sm:px-6">
    <Skeleton className="mb-10 h-72 w-full max-w-72" />
    {Array.from({ length: 6 }, (_, index) => (
      <Skeleton key={index} className="h-24 w-full" />
    ))}
  </div>
);

export const App = () => {
  const [state, setState] = useState<State>(
    isLoggedIn() || location.search
      ? { status: "loading" }
      : { status: "login" },
  );

  useEffect(() => {
    initialLoad.then(setState);
  }, []);

  const signOut = () => {
    logout();
    setState({ status: "login" });
  };

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <a href="/" className="flex items-center gap-3">
            <img src="/favicon.svg" alt="Grand Theft Auto VI" className="h-9" />
            <span className="font-display text-xl font-bold tracking-wide uppercase">
              Radio Match
            </span>
          </a>
          {state.status === "done" && (
            <Button variant="ghost" size="sm" onClick={signOut}>
              Log out
            </Button>
          )}
        </div>
      </header>
      <main className={state.status === "login" ? "" : "pt-20"}>
        {state.status === "login" && (
          <Login error={state.error} onLogin={login} />
        )}
        {state.status === "loading" && <Loading />}
        {state.status === "done" && <Results rankings={state.rankings} />}
      </main>
    </>
  );
};
