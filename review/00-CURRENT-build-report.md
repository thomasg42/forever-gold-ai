FGAI SITE BUILD REPORT FOR CLAUDE CODE (Lane 3 Cursor, 2026-10-28 13:52 MDT)

Local working tree on Thomas's Mac. Not a cloud clone and not a background agent. no cross-lane overlap. Newest other handoff before this one is Lane 2 Codex, 2026-10-28 12:25 MDT, Calendar entries. Lane 1's website prompt ends at 12:15 MDT. Neither lane wrote the site repo after 12:30 MDT.

1. Where
Machine: Thomas's Mac, /Users/tg2.0/dev/forever-gold-ai
Repo: https://github.com/thomasg42/forever-gold-ai
Branch: main, tracking origin/main
Coach David: /Users/tg2.0/dev/coach-david-demo
Repo: https://github.com/thomasg42/coach-david-demo

git log --oneline -8 (forever-gold-ai):
43ed1bb Record the preview build report for Lane 1 to verify.
a5c7412 Link the live Coach David demo from the work page.
7e77365 Publish the noindex Forever Gold AI preview.

git status --short at 43ed1bb: empty.
If a newer commit touches only this file, it inserts the 13:54 confirmation below and does not change docs/.

Coach David git log --oneline -8:
5b12aee Publish the noindex Coach David demo.
git status --short: empty
HEAD: 5b12aee0ab9615d44a2854683599db4117814250

2. Tests
node --test tests/site.test.mjs
✔ docs matches a fresh production build (94.521041ms)
✔ dev build refuses docs/ (57.670167ms)
✔ seo, assets, links, and page weight (55.000292ms)
✔ schema stays inside confirmed fields (2.118084ms)
✔ hero gem, footer, and claims gate (56.512791ms)
✔ contrast pairs pass AA (0.335ms)
✔ system pages, work, stripe, and goldie (19.55125ms)
✔ calculators (7.388167ms)
✔ forms fall back to a prefilled text and never fake a send (49.161459ms)
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 506.87775
Skipped tests: none.

Command Center, from the vault root:
node --test cortana-ui/tests/command-center-bubbles.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
ℹ skipped 0
ℹ duration_ms 386.822625
registry json ok

3. site-qa
One run, local preview. Summary line verbatim:
FAIL 6  WARN 0  SKIP 2  PASS 40

FAIL form#0 back-navigation on http://127.0.0.1:8080/free-audit/ [desktop]
Field "type" lost its value on back-navigation (expected "true", got "audit").

FAIL form#0 happy path on http://127.0.0.1:8080/free-audit/ [desktop]
Valid submission produced NO network POST and no navigation — the lead is silently dropped.

FAIL form#0 back-navigation on http://127.0.0.1:8080/free-audit/ [mobile]
Field "type" lost its value on back-navigation (expected "true", got "audit").

FAIL form#0 happy path on http://127.0.0.1:8080/free-audit/ [mobile]
Valid submission produced NO network POST and no navigation — the lead is silently dropped.

FAIL form#0 happy path on http://127.0.0.1:8080/contact/ [desktop]
Valid submission produced NO network POST and no navigation — the lead is silently dropped.

FAIL form#0 happy path on http://127.0.0.1:8080/contact/ [mobile]
Valid submission produced NO network POST and no navigation — the lead is silently dropped.

SKIP forms present on http://127.0.0.1:8080/ [desktop] and [mobile]: No <form> element on the page.

The four happy-path FAILs are required while leadEndpoint is empty. The form shows "Last step: send it to Thomas" and a prefilled sms: link. It does not say the lead was sent. The two back-navigation FAILs are the audit radio: the harness records a check as boolean true, then inputValue returns the radio value "audit". Contact back-navigation passed. Full log: review/site-qa.txt

4. Live preview
FGAI URL: https://thomasg42.github.io/forever-gold-ai/
Pages: status built, commit 43ed1bb037f570e2d4981053cc74326c8de1eb87
Docs content is a5c7412. 43ed1bb adds this report and does not change docs/.
Curl of / at 13:54 MDT, after that build:
h1 True
noindex True
css True (20261028-v1-b665c514)
calendly False
Curl of /work/ :
coach True
url True (https://thomasg42.github.io/coach-david-demo/)
kraken False
daddy False
robots.txt:
User-agent: *
Disallow: /

Coach David URL: https://thomasg42.github.io/coach-david-demo/
Pages: status built, commit 5b12aee0ab9615d44a2854683599db4117814250
Curl of / :
len 52987
daddy_count 0
noindex True
demo True (the sentence "This is a demo." is in the page)
Curl of /blueprint.html :
len 31285
daddy_count 0
noindex True
robots.txt:
User-agent: *
Disallow: /
Repo description, gh repo view: "Demo website by Forever Gold AI"

5. Built output
21 HTML files. docs/ total 778002 bytes.
docs/404.html 9793
docs/about/index.html 13280
docs/contact/index.html 14049
docs/faq/index.html 13947
docs/free-audit/index.html 15096
docs/gold-standard/index.html 12168
docs/index.html 30324
docs/privacy/index.html 10769
docs/sms-terms/index.html 10664
docs/stages/index.html 12669
docs/systems/ai-operations/index.html 16445
docs/systems/ai-receptionist/index.html 17032
docs/systems/booking/index.html 16135
docs/systems/documents/index.html 15972
docs/systems/index.html 14309
docs/systems/job-to-invoice/index.html 15963
docs/systems/speed-to-lead/index.html 16525
docs/systems/team-apps/index.html 15858
docs/systems/websites/index.html 16284
docs/the-numbers/index.html 17015
docs/work/index.html 12451

Five largest files:
128451 docs/assets/brand/gold-flakes-quiet.jpg
96980 docs/assets/brand/forever-gold-ai-logo.png
92445 docs/assets/og.png
30324 docs/index.html
24452 docs/assets/fonts/inter-latin-600.woff2

6. Files created or changed
Site repo, content commit a5c7412, plus this report. git ls-files is the inventory. One line each for the files that are not generated copies:

site.config.mjs — offers, stats, work cards, booking URL, launched false, leadEndpoint empty.
build.mjs — writes docs/ from the config. A dev build refuses to write docs/.
src/layout.mjs — header, footer, tap bar, SEO, schema.
src/components.mjs — gem, forms, calculators, cards.
src/pages.mjs — 21 pages.
src/systems-copy.mjs — the eight system essays.
src/faqs.mjs — nine answers.
src/assets/site.css — black and gold, motion only on reveal, gem, timeline, receipts.
src/assets/site.js — nav, gem, count-up, calculators.
src/assets/forms.js — prefilled text when there is no endpoint. Success only on ok true.
src/assets/calc.js — missed-call leak and hours back.
src/assets/favicon.svg — FG monogram.
src/assets/fonts/ — Playfair and Inter, SIL OFL, self-hosted.
src/assets/brand/forever-gold-ai-logo.png — the existing logo, not recolored.
src/assets/brand/gold-flakes-quiet.jpg — hero and the closing band.
src/assets/og.png — 1200x630, the headline, no third-party host.
tests/site.test.mjs — 9 tests.
tools/dev-deps.mjs, tools/serve.mjs, tools/make-og.mjs, tools/screenshot.mjs
README.md, AGENTS.md, CLAUDE.md, HERO-SLOT.md, IMAGE-SLOTS.md, .cursor/rules/push-protocol.mdc
review/00-CURRENT-copy-for-thomas.md — draft checkboxes.
review/00-CURRENT-build-report.md — this file.
review/site-qa.txt, review/qa-browser.txt, review/screenshots/ — evidence.
docs/ — generated. 21 HTML files plus assets, robots, sitemap, .nojekyll.

Coach David repo, five files: index.html, blueprint.html, coach-david-hero.mp4, robots.txt, .nojekyll.

Vault, edited in place, not committed:
FGA-AIOS/command-center/registry.json — inserted fgai-site and coach-david-demo immediately before idea-board. The parked coachdaddy entry was not edited. Earlier uncommitted registry edits from other work were left as they were.
FGA-AIOS/forever-gold-agency/forever-gold-ai/website/README.md — newest bullet is the live preview.
FGA-AIOS/forever-gold-agency/forever-gold-ai/00-START-HERE.md — Current list points at the preview.
wiki/builds/forever-gold-ai-website.md — build record, newest first.
FGA-AIOS/model-routing/session-handoff.md — this session's entry at the top.
wiki/conversations/2026-10-28.md — activity note appended. Personal notes already in that file were not rewritten.

7. Stats
Rendered, status verified:
S1 69% — Quo (formerly OpenPhone), Small business callback statistics, August 20, 2026. On the home page and the receptionist page.
S2 31% — same Quo source. On The Numbers.
S3 19.8% — U.S. Census Bureau, Large Firms With at Least 20 Employees Biggest AI Users, May 26, 2026. On the home page.
S4 55% — Thryv survey of 540 small business decision makers, released July 17, 2025. On the home page.
S5 58%, and 66% save 500 to 2,000 dollars a month — same Thryv source. On The Numbers. Dollars are spelled out.
S6 88% McKinsey was not verified. I did not open the McKinsey page. status is unverified. data-stat-id="s6" is absent from docs/. It is not rendered.

8. Every deviation
Favicon is an FG monogram. A crop of the gem did not stay readable at 32px.
Under 900px the gem is shown complete. There is no long sticky pin on the phone, so the headline and buttons stay on screen.
Stage labels read "Only you", "A crew", "Crews or locations". The picker sits above the eight cards.
Extra modules: src/systems-copy.mjs, src/faqs.mjs, src/components.mjs.
The Montana Movers reference repo was not cloned. Birdies and Bridger were enough. Nothing from Montana Movers is on the site.
FGAI is two content commits, then this report, not a commit per milestone.
S5 spells out dollars so a dollar sign stays inside the calculators.
S6 is withheld because the source page was not opened.
The 23-of-23 error-handler count is not printed.
Coach David still loads the original Google Fonts stylesheet. The Forever Gold AI site loads no third-party script.
The audit radio back-navigation FAIL is the harness mismatch in item 3. The form field order was left as specified.
The Thryv investor URL returned HTTP 403 to a non-browser fetch. The citation link stays.
Lighthouse was not run.
The first full-gem screenshots were taken before the 360ms draw finished and were retaken after a 450ms wait.
A count-up screenshot can show a number mid-animation. The HTML has the final figure.
"Just me" remains the team-size option the prompt required.
The Coach David repo was created with a shorter description, then gh repo edit set it to "Demo website by Forever Gold AI". gh repo view confirmed that string.

9. Copy that is not verbatim
The eight system essays are written for this site from the system list in product-facts. They are not a paste of a client page.
The free-audit page says we look at calls, leads, scheduling, quotes, and invoices, then name the first three systems. product-facts still marks the exact deliverable UNCONFIRMED. It is a checkbox in review/00-CURRENT-copy-for-thomas.md.
Privacy and SMS terms are preview drafts, not a lawyer's text. Same copy file.
FAQ: "Your plan includes a timeline." It does not name a number of days.
FAQ: "Every build is scoped to your business. The audit is free."
Calculator empty state: "Enter each number above zero to see a result." The phrase "your best guess" is on the calculator.
Approved and on the page: "More money. More time. Fewer mistakes." "Built in Montana. Working with businesses anywhere." "Succeed at any stage."
The stats are industry figures with sources. They are not Forever Gold AI results. The home page says the three home figures measure different things.

10. Lighthouse
not run
Budgets, measured:
Home HTML docs/index.html 30324 bytes, under 70KB.
Other HTML 9793 to 17032 bytes.
site.css 14974 bytes, under 60KB.
site.js 11195, forms.js 8343, calc.js 1949, config.js 372. Each under 50KB.

11. Screenshot paths
review/screenshots/home-top-390.png
review/screenshots/home-top-1440.png
review/screenshots/home-gem-mid-390.png
review/screenshots/home-gem-mid-1440.png
review/screenshots/home-gem-full-390.png
review/screenshots/home-gem-full-1440.png
review/screenshots/home-tuesday-390.png
review/screenshots/home-tuesday-1440.png
review/screenshots/home-calc-390.png
review/screenshots/home-calc-1440.png
review/screenshots/home-reduced-motion-1440.png
review/screenshots/system-receptionist-390.png
review/screenshots/system-receptionist-1440.png
review/screenshots/numbers-390.png
review/screenshots/numbers-1440.png
review/screenshots/audit-empty-390.png
review/screenshots/audit-handoff-390.png
review/screenshots/missing-390.png

12. Known gaps
leadEndpoint is empty. A valid form never POSTs. That is the happy-path FAIL.
launched is false. noindex and robots Disallow stay on.
forevergoldai.com is not connected.
The Goldie widget is not on the page. The slot is empty on the receptionist page.
No analytics, no photos of Thomas, no new images generated.
S6 was not verified.
Lighthouse was not run.
FGA-Brain PR #13 is still open. This lane did not merge it, close it, or switch the vault branch.
The vault was not committed. registry.json also contains earlier uncommitted edits from other work. Those were not reverted.
GitHub Pages caches HTML for about 10 minutes. The curls above were against the built commits named in item 4.

13. Open questions for Thomas
Say "launch" when the preview should be indexed and the domain should move. Until then it stays noindex.
Check the three boxes in review/00-CURRENT-copy-for-thomas.md: free-audit deliverable, privacy, SMS terms.
A role email is still UNCONFIRMED. None is printed.
Prices stay off until you fill product-facts.
Close FGA-Brain PR #13 without merging, when you want that cloud stop-record gone.
