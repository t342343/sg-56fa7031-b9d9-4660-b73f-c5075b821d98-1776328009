---
title: Fix Dockerfile Build Args for Supabase
status: done
priority: urgent
type: bug
created_at: "2026-04-09T20:06:00Z"
created_by: agent
---

## Notes
Next.js needs `NEXT_PUBLIC_` environment variables at build time because it inlines them into the static bundle. The current Dockerfile builder stage doesn't accept ARGs, causing the build to crash when `src/integrations/supabase/client.ts` throws an error due to missing keys.

## Checklist
- [ ] Update `Dockerfile`: In the "Stage 2: Builder" section, add `ARG` and `ENV` declarations for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` before the `COPY` commands.