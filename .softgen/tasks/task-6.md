---
title: Persistente Speicherung der ausgeblendeten Benutzer
status: done
priority: medium
type: bug
tags:
  - admin
  - ui
created_by: agent
created_at: 2026-04-16T22:50:00Z
position: 6
---
## Notes
Context: Im Admin-Bereich werden ausgeblendete Nutzer nach einem Hard-Refresh wieder angezeigt, da der Zustand nur im React State (`hiddenUsers`) liegt.
Requirements:
- 100% risikofreie Persistenz der Liste ohne Änderung der Datenbankstruktur.
- Speicherung der ausgeblendeten IDs als JSON in der `site_settings` Tabelle unter dem Key `hidden_users`.
- Kein Einfluss auf RLS oder andere Tabellen.

## Checklist
- [x] Erstelle `loadHiddenUsers()` Funktion mit try/catch für sicheres JSON.parse
- [x] Erstelle `saveHiddenUsers(newSet)` Funktion mit Fehlerbehandlung
- [x] Erstelle `toggleHiddenUser(userId)` Wrapper-Funktion
- [x] Rufe `loadHiddenUsers()` in `checkAuth()` nach `loadSettings()` auf
- [x] Ersetze den bestehenden `onClick` Handler des Ausblenden-Buttons durch den Aufruf von `toggleHiddenUser`