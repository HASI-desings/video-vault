# Video Vault

A privacy-first, installable PWA for saving direct media links to an offline library on your device, plus a local player with lock-screen controls.

## How it works

1. **Downloader tab** — paste a direct link to a media file (`.mp4`, `.m3u8`, `.mp3`, etc.). The app fetches it client-side as a `Blob` and stores it in IndexedDB (via `localforage`) — never on a server.
2. **Library tab** — browse saved Videos and Music in segmented views. Tap to play, share to Files/Photos manually, or delete.
3. Fully offline after first load — the service worker caches the app shell; your saved media lives in IndexedDB and works with no connection.

## Important: CORS limitation

This app is **pure client-side fetch with no server proxy**. Browsers enforce CORS — `fetch()` will only succeed for URLs whose server explicitly allows cross-origin reads (`Access-Control-Allow-Origin` header). This works well for:

- Files you host yourself (S3/R2/Cloudflare with CORS enabled)
- Many Creative Commons / public-domain media archives
- Direct podcast RSS enclosure URLs
- Any direct file link with permissive CORS headers

It will **fail gracefully** (with an explanatory message) for most third-party streaming/social platforms, which intentionally block this.

## Local development

```bash
npm install
npm run dev
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect the repo in the Vercel dashboard — `vercel.json` is preconfigured for Next.js.

## Installing on iOS

1. Open the deployed URL in Safari.
2. Tap Share → "Add to Home Screen".
3. Launch from the home screen icon — it opens in standalone mode (no URL bar).

## Project structure

```
app/
  page.tsx              # Downloader tab
  library/page.tsx       # Library tab (Videos/Music)
  layout.tsx             # Root layout, PWA meta tags
components/
  BottomNav.tsx
  LibraryItem.tsx
  MediaPlayer.tsx         # Media Session-integrated player
  ServiceWorkerRegistration.tsx
lib/
  storage.ts              # IndexedDB (localforage) schema
  fetchMedia.ts            # Client-side blob fetch + type detection
  useWakeLock.ts
  useMediaSession.ts
public/
  manifest.json
  sw.js                    # Service worker (shell + runtime caching)
  icons/
```

## Replacing icons

The icons in `public/icons/` are placeholders. Replace `icon-192.png`, `icon-512.png`, and `icon-maskable-512.png` with your own branded assets (maskable icon should have safe-zone padding for OS icon shapes).
