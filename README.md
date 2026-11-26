# GTA VI Radio

Find the GTA VI radio station that fits your Spotify listening history.

https://gta-vi-radio.vercel.app

## Spotify

Create an app in the [Spotify developer dashboard](https://developer.spotify.com/dashboard) with the Web API.
Add these redirect URIs:

- `https://gta-vi-radio.vercel.app/`
- `http://127.0.0.1:5173/`

Set `VITE_SPOTIFY_CLIENT_ID` to the app's client ID in Vercel and in `.env.local`.
In Development Mode, add each listener's Spotify email under User Management. Spotify allows 5 users.

The page uses the PKCE flow. It keeps the refresh token in `localStorage`, so users stay logged in until they log out or revoke access.

## Development

Run `pnpm install`, then `pnpm dev`.

Ignored files, such as `.vercel` and `.env.local`, exist only in the checkout that created them.
Run this command in each new worktree to get its own copy:

```sh
vercel link --yes --project gta-vi-radio && vercel env pull .env.local
```
