---
title: Fix Support Request Submission
status: done
priority: high
type: bug
tags: [support, bugfix, supabase]
created_by: Softgen
---
## Notes
Das Absenden des Support-Formulars schlägt mit einem RLS-Fehler (42501) fehl, da der unauthentifizierte Nutzer (oder angemeldete Standardnutzer) versucht, die eingefügte Zeile nach dem Speichern direkt wieder auszulesen (`.select().single()`). Dadurch bricht die PostgreSQL-Datenbank den gesamten Speichervorgang sicherheitshalber ab. Wir müssen ein reines "Insert" durchführen, ohne die Daten mittels `RETURNING` (ausgelöst durch `.select()`) zurückzufordern.

## Checklist
- [x] Entferne `.select()` und `.single()` aus der Funktion zum Speichern der Support-Anfragen im Service-Layer, damit nach dem `insert` keine Rückgabe der Daten angefordert wird.
- [x] Passe die Funktion so an, dass sie auch ohne die Rückgabe der erstellten Daten (wie z.B. der neuen ID) als erfolgreich gewertet wird und dem Nutzer korrekte Rückmeldung gibt.