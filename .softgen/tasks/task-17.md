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
- Created icon-192.png and icon-512.png from finazpo_logo_pwa_app.png
- Updated manifest.json to use PNG icons instead of SVG
- PWA banner should remain functional while showing the new logo

## Checklist
- [x] Copy finazpo_logo_pwa_app.png to icon-192.png and icon-512.png
- [x] Update manifest.json to reference the new PNG icons
- [x] Verify PWA install banner still appears

## Acceptance
- PWA install banner appears in browser
- Installed app shows the new logo icon
