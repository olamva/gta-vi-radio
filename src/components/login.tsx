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
      <div className="mx-auto w-full max-w-6xl px-4 pt-36 pb-16 sm:pt-48 sm:px-6 sm:pb-24">
        <h1 className="max-w-3xl font-display text-6xl leading-[0.85] font-black uppercase sm:text-8xl">
          Find your station
        </h1>
        {error && (
          <Alert variant="destructive" className="mt-6 max-w-xl">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          size="lg"
          onClick={onLogin}
          className="mt-8 h-12 rounded-full bg-spotify px-7 text-base font-semibold text-black hover:bg-spotify/90"
        >
          <SpotifyIcon className="size-5" />
          Log in with Spotify
        </Button>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <h2 className="font-display text-3xl font-black uppercase">
        On the dial
      </h2>
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
