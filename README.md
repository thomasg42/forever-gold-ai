# Forever Gold AI website

Noindex preview: https://thomasg42.github.io/forever-gold-ai/

Words, phone, stats, and offers come from the vault claims file `FGA-AIOS/forever-gold-agency/forever-gold-ai/context/product-facts.md`. A number stays off the page until that file marks it verified.

## Build and test

```sh
cd ~/dev/forever-gold-ai
node tools/make-og.mjs
node build.mjs
node --test tests/
node tools/serve.mjs docs 8080
```

`node build.mjs` writes `docs/` for GitHub Pages (`main` / `docs`). `node build.mjs --dev` writes `dev-build/` and refuses to write `docs/`. Tests and screenshots load linkedom and Playwright from `~/dev/fga-tools`. Do not npm install in this repo.

## LEAD-API

`leadEndpoint` in `site.config.mjs` is empty until Lane 1 ships the backend. The browser reads it from `docs/assets/config.js`.

`POST {leadEndpoint}` with `Content-Type: application/json`:

```json
{
  "form": "audit",
  "name": "",
  "phone": "",
  "email": "",
  "business": "",
  "industry": "",
  "teamSize": "",
  "stage": "",
  "needs": [],
  "contactPref": "",
  "notes": "",
  "smsConsent": false,
  "calc": { "leakYearly": null, "hoursYearly": null },
  "page": "",
  "submittedAt": "",
  "website": ""
}
```

`form` is `audit`, `call`, or `contact`. `calc` is `null` when both calculator fields are empty. `website` is the honeypot and must arrive empty.

Success: HTTP 200 and `{ "ok": true }`. The page may then say "Sent to Thomas."

Failure: HTTP 4xx or 5xx and `{ "ok": false, "error": "..." }`. The page keeps every answer and offers a prefilled text. It must not say the request was received.

While `leadEndpoint` is empty, a valid submit does not POST. It shows "Last step: send it to Thomas" and a `sms:+14066986693` link whose body lists every field.

## Launch checklist

Do these only when Thomas says launch. `launched` stays false until then.

1. Confirm forevergoldai.com auto-renew is on.
2. Replace the stale `sites.ludicrous.cloud` and Vercel web records with GitHub Pages DNS. Keep the Google mail records.
3. Set `customDomain` in `site.config.mjs`. The build writes `docs/CNAME`.
4. Set `launched` to true, rebuild, test, and push. That removes noindex and changes `robots.txt` to allow.
5. Add the property in Search Console.
6. Point the Google Business Profile website at the live domain.
7. Update the Instagram and Facebook bio links.

## Push

Finish, test, and commit named paths. Ask "Ready to push?". Push only when Thomas says "push", then confirm the live page shows the new copy. The 2026-10-28 build prompt authorized the first noindex preview only.
