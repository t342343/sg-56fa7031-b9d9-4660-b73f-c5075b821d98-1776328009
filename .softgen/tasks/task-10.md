---
title: Chat auto-scroll implementation
status: todo
priority: high
type: bug
tags: [ui, chat]
created_by: agent
created_at: 2026-04-25T17:53:11.000Z
position: 10
---
## Notes
Der Nutzer möchte, dass das Chat-Fenster im Dashboard bei neuen Nachrichten automatisch nach unten scrollt, damit die neuesten Nachrichten direkt sichtbar sind.

KRITISCHE SICHERHEITSVORGABEN:
1. Verwende NIEMALS `scrollIntoView()`, da dies in der Vergangenheit zu massiven Fehlern und Seiten-Sprüngen geführt hat.
2. Verwende stattdessen `useRef` für den inneren Chat-Container und setze `scrollTop = scrollHeight` innerhalb eines `useEffect`, der ausschließlich auf Änderungen von `messages` reagiert.
3. Verändere absolut KEINE andere Logik der Datei `dashboard.tsx`. Berechnungen, API-Aufrufe, Polling und die Funktionen für "Verlängern" und "Auszahlen" müssen zu 100 % unangetastet bleiben. Die Änderung ist strikt auf das Chat-UI isoliert.

## Checklist
- [ ] React `useRef` importieren und eine Referenz für den inneren scrollbaren Chat-Container erstellen
- [ ] Die Referenz (ref) an das `div` des Chat-Verlaufs anhängen
- [ ] Einen isolierten `useEffect` hinzufügen, der die Scroll-Position des Containers mathematisch auf die maximale Höhe (`scrollHeight`) setzt, sobald sich die Nachrichtenliste ändert
- [ ] Sicherstellen, dass keine anderen Dashboard-Funktionen, State-Variablen oder Berechnungs-Logiken verändert wurden

## Acceptance
- Wenn eine neue Nachricht gesendet oder empfangen wird, springt der innere Scrollbalken des Chat-Kastens sofort nach unten, ohne dass sich die restliche Hauptseite bewegt.
- Alle Berechnungen, Renditen und die Buttons "Auszahlen" und "Verlängern" funktionieren weiterhin völlig fehlerfrei.