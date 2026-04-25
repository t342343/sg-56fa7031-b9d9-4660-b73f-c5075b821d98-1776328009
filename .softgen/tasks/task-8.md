---
title: Fix Chat Race Condition (Leerer Chat Bug)
status: done
priority: high
type: bug
---

## Notes
Der Chat leert sich nach dem Senden einer Nachricht, da `loadChat` aufgerufen wird, bevor der React-State `userId` zuverlässig gesetzt ist. Dadurch wird die Datenbank mit einer leeren ID abgefragt, was ein leeres Array zurückgibt und den Chat in der UI überschreibt.

Lösung 1: `loadChat` soll nicht blind dem State vertrauen, sondern das Profil jedes Mal frisch abfragen.

## Checklist
- [x] In `src/pages/dashboard.tsx`: Aktualisiere die Funktion `loadChat`, sodass sie `await profileService.getCurrentProfile()` verwendet, um die ID sicher zu ermitteln, bevor `chatService.getMessages` aufgerufen wird.