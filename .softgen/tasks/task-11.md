---
title: Update PWA branding and icon background
status: done
priority: low
type: chore
tags: [ui, pwa]
created_by: agent
created_at: 2026-04-25T18:15:00.000Z
position: 11
---

## Notes
Der Nutzer möchte den Namen der PWA (der auf dem Homescreen angezeigt wird) und die Hintergrundfarbe der PWA-Icons ändern. Dies ist eine rein statische Konfigurations- und Designänderung, die absolut keine Auswirkungen auf die Funktionalität (APIs, DB, Berechnungen) hat.

## Checklist
- [ ] In `public/manifest.json`: Ändere den `short_name` von "BTC Portal" zu "Finanzportal"
- [ ] In `public/icon-192.svg`: Ändere den `fill`-Wert des Hintergrund-`<rect>` von `#1E293B` auf `#FFFFFF`
- [ ] In `public/icon-512.svg`: Ändere den `fill`-Wert des Hintergrund-`<rect>` von `#1E293B` auf `#FFFFFF`

## Acceptance
- Die PWA wird bei der Installation als "Finanzportal" vorgeschlagen.
- Die Icons (192x192 und 512x512) haben einen weißen Hintergrund statt des dunklen Schiefergraus.
- Die Funktionalität des Dashboards ist zu 100% unverändert.