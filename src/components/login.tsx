import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SpotifyIcon } from "@/components/spotify-icon";
import { StationArt } from "@/components/station-art";
import { STATIONS } from "@/stations.ts";

interface LoginProps {
  error?: string;
  onLogin: () => void;
}

export const Login = ({ error, onLogin }: LoginProps) => (
  <>
    <section className="relative isolate flex min-h-[86svh] items-end overflow-hidden">
      <picture className="absolute inset-0 -z-10">
        <source media="(max-width: 767px)" srcSet="/hero-mobile.webp" />
        <img src="/hero.webp" alt="" className="size-full object-cover" />
      </picture>
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-background/40 via-background/55 to-background" />
      <div className="mx-auto w-full max-w-6xl px-4 pt-32 pb-16 sm:px-6 sm:pb-24">
        <p className="mb-4 text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
          {STATIONS.length} stations · Leonida
        </p>
        <h1 className="max-w-3xl font-display text-6xl leading-[0.9] font-extrabold uppercase sm:text-8xl">
          Find your station
        </h1>
        <p className="mt-6 max-w-xl text-lg text-pretty text-foreground/80">
          Connect Spotify and we rank every GTA VI music station by your top
          artists and tracks. Your last month counts most.
        </p>
        {error && (
          <Alert variant="destructive" className="mt-6 max-w-xl">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button
            size="lg"
            onClick={onLogin}
            className="h-12 rounded-full bg-spotify px-7 text-base font-semibold text-black hover:bg-spotify/90"
          >
            <SpotifyIcon className="size-5" />
            Log in with Spotify
          </Button>
          <p className="text-sm text-muted-foreground">
            Your history stays in your browser.
          </p>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <h2 className="font-display text-3xl font-bold uppercase">On the dial</h2>
      <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-8">
        {STATIONS.map((station) => (
          <li key={station.name}>
            <StationArt station={station} className="w-full" />
          </li>
        ))}
      </ul>
    </section>
  </>
);
