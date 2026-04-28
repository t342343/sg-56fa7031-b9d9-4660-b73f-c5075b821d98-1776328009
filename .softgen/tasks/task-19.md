---
title: Remove External Website Links
status: done
priority: high
type: chore
tags: [ui, cleanup]
created_by: softgen
created_at: 2026-04-28T21:18:00Z
---

## Notes
The user decided to completely remove the external "Website" links from the UI instead of updating their URLs. This simplifies the interface and avoids the broken admin settings entirely.

## Checklist
- [x] In `src/components/DashboardLayout.tsx`, remove the sidebar navigation item for "Website". (Also clean up the `websiteLinkUrl` state and fetch logic if it's no longer used).
- [x] In `src/pages/info.tsx`, remove the "Zur Website" button at the bottom of the page. (Also clean up the `websiteUrl` state and fetch logic if it's no longer used).

## Acceptance
- The "Website" menu item is completely gone from the dashboard sidebar.
- The "Zur Website" button is completely gone from the Info page.
- No layout breakage occurs.