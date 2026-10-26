# Home Row — Project Handoff

## 1. Goal

A typing speed test (WPM tester) — the first "game-like" tool in the portfolio rather than a pure calculator. Picked deliberately to diversify: it has built-in shareability (people share their WPM score) and encourages repeat visits ("beat your personal best") in a way one-shot calculators don't. Built to feel like a warm, unhurried typewriter — not another cold hacker-terminal aesthetic.

## 2. Current State

- **Live at:** a Netlify subdomain (check your Netlify dashboard for the exact `*.netlify.app` URL) — **`homerow.app` has not actually been purchased or connected yet.** It was used throughout the code as a placeholder domain, same as every OG tag, canonical tag, and sitemap URL assumes it. This is the single biggest open item versus your other live sites.
- **Repo:** `github.com/thatcodingman/homerow` (GitHub displayed a notice that it was renamed to `Homerow` with a capital H at some point — cosmetic, doesn't affect functionality, but worth knowing if a future clone/push behaves oddly)
- **AdSense:** Verification meta tag live on homepage; `ads.txt` in place; approval status pending
- **Analytics:** Google Analytics live (property ID `G-HXKYZ1HK0V`), added to all 6 pages
- **SEO:** `robots.txt`, `sitemap.xml` (6 URLs), OG tags + canonical tags on every page, custom OG image
- **Personal best tracking:** live via `localStorage`, separate best stored per test duration

## 3. Active Files

| File | Purpose |
|---|---|
| `index.html` | Homepage — the typing test itself: duration selector, live passage with character-by-character coloring, live WPM/accuracy, sparkline, results screen |
| `homerow-about.html` | About page |
| `homerow-faq.html` | FAQ |
| `homerow-contact.html` | Contact page |
| `homerow-terms.html` | Terms of Service (incl. advertising disclosure) |
| `homerow-privacy.html` | Privacy Policy (incl. Analytics and localStorage best-score disclosure) |
| `homerow-styles.css` | Shared stylesheet — warm dark typewriter identity (charcoal-navy bg, brass/gold correct-text glow, rust-red errors) |
| `homerow-app.js` | Full typing engine — passage generator, character diffing, WPM/accuracy math, timer, sparkline, synthesized key-click sound, personal-best tracking |
| `ads.txt` | AdSense verification file |
| `robots.txt` | Points to sitemap |
| `sitemap.xml` | 6 URLs |
| `homerow-og.png` | Open Graph share image (1200×630) — shows a live example of the actual color-coded typing interface |

## 4. Changes Made (chronological)

1. Initial build: full typing engine with WPM/accuracy formulas hand-verified against 3 calculable scenarios before any UI was written; warm dark visual identity (Special Elite + Red Hat Mono + Manrope); 6 pages; full AdSense/SEO setup from day one
2. **First round of real-world bugs, caught from your own testing:**
   - Passage text rendered as one unbroken line running off the screen ("giraffe neck") — root cause was using `&nbsp;` for every space, which tells the browser never to break a line there. Fixed to a normal space.
   - A related bug caught while investigating the first one, before you'd hit it: the passage was always exactly 60 words regardless of test length, meaning a fast typist could exhaust it before the timer ended on the 60s/120s modes and get cut off early. Fixed by scaling passage length to duration, verified against 220 WPM (elite-level) typing speed with real safety margin.
   - Added visual "pop" per your feedback: warm radial glow behind the hero, richer color saturation on correct/incorrect characters, glowing stats and sparkline.
3. **Second real-world bug:** the page auto-scrolled to the bottom while typing, hiding the passage. Root cause: the invisible input field capturing keystrokes was a `<textarea>`, and browsers auto-scroll to keep a focused textarea's cursor in view. Fixed with three layers of defense: switched to `<input type="text">` (the actually-correct element for this), pinned it to `position: fixed` so there's nothing to scroll toward, and added `preventScroll: true` to both focus calls.
4. Added personal-best tracking via `localStorage` — tested the "lower is not what we want, higher WPM is better" comparison logic specifically since Trigger's later reaction-time version needed the opposite (lower is better) and mixing those up would have been an easy silent bug. Updated Privacy Policy and FAQ to accurately describe the new local storage use.
5. Added Google Analytics to all 6 pages, updated Privacy Policy to disclose it.

## 5. Failed Attempts / Issues Hit Along the Way

- **Two real bugs shipped and caught via your live testing** (detailed above) — the non-breaking-space line-wrap bug and the page-scroll-while-typing bug. Both were root-caused precisely rather than patched blindly, and both fixes were verified against the actual shipped code before being sent back.
- **GitHub push failed on the first attempt** — "Repository not found" — because a retry attempt had a typo (`homeroom.git` instead of `homerow.git`). The next attempt with the correct name succeeded.
- **Domain was never actually purchased** — this isn't a bug, but it means every OG tag, canonical URL, and sitemap entry in the live code currently points to a domain (`homerow.app`) that isn't actually serving the site yet.

## 6. Next Steps

- [ ] **Purchase `homerow.app`** (or confirm a different domain) and connect it via Netlify + DNS — this is the one thing every other live site has that this one doesn't yet
- [ ] Confirm AdSense approval status once submitted
- [ ] Submit `sitemap.xml` to Google Search Console
- [ ] Consider whether the GitHub repo's capitalization (`homerow` vs `Homerow`) is worth formally renaming for consistency, or just leaving as-is since it doesn't affect function
