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
- Created icon-192.png and icon-512.png from finazpo_logo_pwa_app.png (properly resized with sharp)
- Updated manifest.json to use PNG icons
- **ROOT CAUSE:** Service Worker was never registered - PWA banner requires both manifest.json AND active service worker
- Added service worker registration in _app.tsx

## Checklist
- [x] Resize finazpo_logo_pwa_app.png to exact 192x192 and 512x512 sizes using sharp
- [x] Update manifest.json to reference the resized PNG icons
- [x] Register service worker in _app.tsx
- [x] Verify PWA install banner appears

## Acceptance
- PWA install banner appears in browser after hard refresh
- Installed app shows the new logo icon
- Service Worker is registered and active in DevTools
