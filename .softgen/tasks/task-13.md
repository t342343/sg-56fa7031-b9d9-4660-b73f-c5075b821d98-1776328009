---
title: Restore Withdrawals Tab
status: done
priority: urgent
type: bug
tags: [admin, ui, bug]
created_by: agent
created_at: 2026-04-25T18:25:00.000Z
position: 13
---
## Notes
Der TabsTrigger für "withdrawals" (Auszahlungen) wurde in der TabsList in `admin.tsx` überschrieben. Der TabsContent existiert weiterhin.

## Checklist
- [ ] In `src/pages/admin.tsx` die `TabsList` suchen
- [ ] Die CSS-Klasse von `grid-cols-5` auf `grid-cols-6` ändern
- [ ] Den Eintrag `<TabsTrigger value="withdrawals">Auszahlungen</TabsTrigger>` wieder in die Liste einfügen