# Landing page placeholders

This folder is reserved for landing page images. The one-pager currently uses placeholder URLs (e.g. picsum.photos). You can replace them by adding files here and updating the image sources in `src/app/page.js`:

- **Hero + Intro background**: e.g. `hero-intro-bg.jpg` — used as CSS background for the combined Hero (title) and Intro block. In `page.js`, set `HERO_INTRO_BG` to use `url(/placeholders/hero-intro-bg.jpg)` (with the same overlay gradient).
- NPO features: e.g. `npo-features.jpg`
- Volunteer features: e.g. `volunteer-features.jpg`
- Impact: e.g. `impact-1.jpg`, `impact-2.jpg`, `impact-3.jpg`
- App mobile screenshot: e.g. `app-mobile.png`
- App desktop screenshot: e.g. `app-desktop.png`

Use these paths with Next.js Image as `src={"/placeholders/filename.jpg"}`. For the hero-intro background, use it in the `HERO_INTRO_BG` constant as `url(/placeholders/hero-intro-bg.jpg)`.
