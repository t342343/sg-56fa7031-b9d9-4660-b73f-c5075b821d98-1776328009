---
title: Anpassung der täglichen Rendite-Prozentsätze
status: done
priority: high
type: feature
tags:
  - math
  - frontend
created_by: agent
---

## Notes
Die prozentuale tägliche Rendite (Gewinnberechnung) wird exakt an 4 Stellen im Frontend-Code angepasst. 
WICHTIG: Die zugrundeliegende Logik (Zinseszins, Zeitberechnung) bleibt zu 100% unangetastet, um Auszahlungen und Verlängerungen nicht zu gefährden. Es ist eine reine "Suchen & Ersetzen"-Operation der Schwellenwerte. 
Da die Berechnung im Frontend stattfindet, wird die Self-Hosted Supabase Datenbank nicht berührt.

**Neue Staffelung:**
- Ab 1€: 0,5%
- Ab 10.000€: 0,8%
- Ab 25.000€: 1,0%
- Ab 35.000€: 1,2%
- Ab 50.000€: 1,3%
- Ab 75.000€: 1,4%
- Ab 100.000€: 1,5%
- Ab 130.000€: 1,6%

## Checklist
- [x] In `src/pages/dashboard.tsx`: Passe die mathematischen Faktoren in `calculateCurrentBalance` an (ACHTUNG: strikt mit Punkt, z.B. `0.005` statt `0.014`)
- [x] In `src/pages/dashboard.tsx`: Passe die UI-Texte in `getDailyRateInfo` an (mit Komma, z.B. `"0,5%"`)
- [x] In `src/pages/gewinnberechnung.tsx`: Passe den Initial-State und die `if/else`-Schwellenwerte an (z.B. `"0,5%"`)
- [x] In `src/pages/gewinnberechnung.tsx`: Aktualisiere die visuellen Tabellen-Zeilen (`renderRateRow`) mit den neuen Prozenten

## Acceptance
- Im Dashboard wird die korrekte neue Rendite (z.B. 0,5% bei neuem Account) angezeigt.
- Das Gesamtguthaben wächst nach der neuen, reduzierten Formel.
- Die Info-Seite "Gewinnberechnung" zeigt die neue Staffelung korrekt an.
- Verlängerungen und Auszahlungen funktionieren weiterhin fehlerfrei.