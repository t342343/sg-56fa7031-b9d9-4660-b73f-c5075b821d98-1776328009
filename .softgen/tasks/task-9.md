---
title: Zero-Risk Cache-Buster für Chat (PWA Fix)
status: done
priority: urgent
type: bug
---

## Notes
Der Service Worker cacht fälschlicherweise die Supabase GET-Requests des Chats, weil die Self-Hosted Domain nicht als API erkannt wird.
Um das globale Caching nicht zu gefährden, implementieren wir einen isolierten Cache-Buster direkt im Supabase-Client für `getMessages`. Durch einen eindeutigen Timestamp ändert sich die Abfrage-URL bei jedem Call, was den PWA-Cache für diese spezifische Funktion umgeht.

## Checklist
- [x] In `src/services/chatService.ts`: Erweitere die `getMessages` Funktion um einen Cache-Buster (z.B. `.neq('id', \`cb-${Date.now()}\`)`), um den PWA-Cache auszutricksen.
- [x] In `src/pages/dashboard.tsx`: Entferne den versehentlich doppelt kopierten `useEffect`-Block (Realtime-Listener für Auszahlungsgenehmigungen), der fälschlicherweise exakt den Chat-Code enthält.