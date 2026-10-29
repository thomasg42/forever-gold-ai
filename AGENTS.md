# Forever Gold AI website

Live site: https://forevergoldai.com/ (GitHub Pages custom domain, launched and indexable since 2026-10-28; the github.io URL redirects)

Source of truth for words, phone, stats, and offers: the vault file `FGA-AIOS/forever-gold-agency/forever-gold-ai/context/product-facts.md`. Do not invent a claim, a price, a client name, or a result number.

## Build

```sh
node tools/make-og.mjs
node build.mjs
node --test tests/
node tools/serve.mjs docs 8080
```

`node build.mjs` writes `docs/` for GitHub Pages. `node build.mjs --dev` writes `dev-build/` and refuses to write `docs/`. Dependencies for tests and screenshots live in `~/dev/fga-tools`. Do not npm install in this repo.

## Push

Finish the change, run the tests, commit named paths only, and ask "Ready to push?". Push to `main` only when Thomas says "push" in that message. Then open the live URL and confirm a string from the new commit, not only HTTP 200. GitHub Pages can cache `index.html` for about ten minutes.

The first noindex preview was authorized by the 2026-10-28 build prompt. That authorization does not cover later edits, the domain, `launched: true`, or `leadEndpoint`.

## Do not

- Set `launched` back to false, or remove docs/CNAME. Thomas said "launch" on 2026-10-28; the site is indexed on forevergoldai.com.
- Add a third-party script or an analytics tag. The only allowed one is the pinned ElevenLabs Goldie widget on /systems/ai-receptionist/.
- Name a hidden client, print Calendly, or claim 24/7.
- Commit secrets. This repo is public.
