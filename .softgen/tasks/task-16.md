---
title: Update Brand Logos and PWA Icons
status: done
priority: medium
type: chore
tags: [ui, branding, pwa]
created_by: softgen
created_at: 2026-04-28T20:05:00Z
---

## Notes
The user has provided two new image assets to replace the text-based logos and default PWA icons.
This is a pure UI update. The core dashboard logic and layout grids MUST NOT be altered.
- Wide logo: Logo_login.png (already in public/)
- Square logo: finazpo_logo_pwa_app.png (already in public/)

## Checklist
- [x] Use existing Logo_login.png from public/ for login and dashboard
- [x] Use existing finazpo_logo_pwa_app.png from public/ for PWA icons
- [x] Update src/components/AuthForm.tsx: Replace the SVG and "Finanzportal" text inside the CardTitle with an img tag pointing to /Logo_login.png
- [x] Update src/components/DashboardLayout.tsx: Replace the text-based "Finanzportal" logo (both desktop sidebar and mobile header) with the /Logo_login.png image
- [x] Update public/manifest.json: Change the icons array to use /finazpo_logo_pwa_app.png for the PWA icons

## Acceptance
- The Login screen displays the new image logo instead of the text/SVG.
- The Dashboard header/sidebar displays the new image logo.
- The PWA manifest points to the new square icon.
- No layout shifts or console errors occur.
