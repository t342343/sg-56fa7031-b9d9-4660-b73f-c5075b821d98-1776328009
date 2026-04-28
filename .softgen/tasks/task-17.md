---
title: Fix PWA Install Banner (Manifest Icons)
status: done
priority: urgent
type: bug
tags: [pwa, bugfix]
created_by: softgen
created_at: 2026-04-28T20:25:00Z
---

## Notes
The recent change to `public/manifest.json` replaced the SVG icons with a single PNG (`finazpo_logo_pwa_app.png`) for both 192x192 and 512x512 sizes. The PNG file does not have the exact dimensions required, causing Chrome/Safari to reject the PWA install criteria and blocking the `beforeinstallprompt` event (meaning the PWA install banner is hidden).
We need to revert ONLY the icons in the manifest back to the original scalable SVGs to restore the PWA install functionality.

## Checklist
- [ ] Open `public/manifest.json`
- [ ] Restore the `icons` array to use the original `/icon-192.svg` and `/icon-512.svg` (change `src`, `type` back to `image/svg+xml`, and ensure sizes are correct)
- [ ] Do NOT change any other files (keep the new logos in `AuthForm.tsx` and `DashboardLayout.tsx`)

## Acceptance
- The `manifest.json` points to the valid SVG icons.
- The PWA install criteria are met, and the install banner appears again in the browser.
 