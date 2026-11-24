# Chokepoint news proxy (Cloudflare Worker)

A ~90-line Cloudflare Worker that powers the **Live Threat Wire** with real worldwide
cyber-incident headlines, while keeping any API key as a **server-side secret** — nothing
sensitive ships in the client or this repo.

## Why a proxy?

Chokepoint is an open, static, no-backend app. Calling a news API directly from the
browser would either (a) expose an API key to everyone, or (b) hit CORS / rate-limit walls
(GDELT). This Worker solves both: the key lives in a Cloudflare secret, responses are
cached for 10 minutes, and CORS is set so the static site can read it.

## Providers

- **Exa** (preferred) — set an `EXA_API_KEY` secret and the Worker queries Exa's news
  category for recent cyber-incident coverage.
- **GDELT** (fallback) — if no key is set, it proxies the keyless GDELT DOC 2.0 API.

Either way it returns `{ "items": [ { title, url, source, country, date } ] }`, the shape
`src/news/types.ts` expects.

## Deploy

```bash
cd worker
npm i -g wrangler            # or: bunx wrangler ...
wrangler login
# optional but recommended — use Exa for reliable results:
wrangler secret put EXA_API_KEY     # paste a key you control (rotate anytime)
wrangler deploy
```

Wrangler prints a URL like `https://chokepoint-news-proxy.<you>.workers.dev`.

## Connect the app

Open Chokepoint → the **Live Threat Wire** panel → the settings (gear) → paste the Worker
URL. It's stored in your browser's `localStorage` only. The panel will switch from the
offline sample to live headlines.

## Notes

- **Never commit an API key.** Use `wrangler secret put`; the secret is not in
  `wrangler.toml` or anywhere in the repo.
- The Worker caps results at 30 and caches per query for 10 minutes — cheap and
  rate-limit-friendly.
- To rotate the key: `wrangler secret put EXA_API_KEY` again, then `wrangler deploy`.
