---
title: Create CI/CD migration script for Coolify & Self-hosted Supabase
status: todo
priority: high
type: feature
tags: [database, migration, script, self-hosted, coolify]
created_by: softgen
created_at: 2026-04-08T13:35:35Z
position: 1
---

## Notes
The user is deploying to Ubuntu 24.04 using Coolify and a self-hosted Supabase instance.
To support this CI/CD pipeline, we need an intelligent Node.js migration script that can safely run during the Coolify build phase. 
It MUST keep track of executed migrations (e.g., in a `_migration_history` table) so it never attempts to run the same SQL file twice, which would cause deployment crashes.

## Checklist
- [ ] Create `scripts/run-migrations.js` using the `pg` client.
- [ ] Implement logic to automatically create a `_migration_history` table if it doesn't exist.
- [ ] Implement logic to read `supabase/migrations/`, sort chronologically, and filter out already executed files.
- [ ] Implement secure execution using `process.env.DATABASE_URL` (connecting directly to the self-hosted PostgreSQL).
- [ ] Add robust error logging (to help the user debug via Coolify logs if a SQL syntax error occurs).
- [ ] Add the command `"migrate:prod": "node scripts/run-migrations.js"` to `package.json` scripts.