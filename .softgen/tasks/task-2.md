---
title: Fix Coolify Deployment (IPv6 issue) with custom Dockerfile
status: todo
priority: urgent
type: chore
tags:
  - deployment
  - docker
  - fix
created_by: agent
created_at: 2026-04-09T10:10:00Z
position: 2
---

## Notes
The Coolify deployment is failing during the Nixpacks build phase due to an IPv6 timeout when `apt-get update` tries to reach the Ubuntu archives.
To permanently fix this and optimize the build, we will bypass Nixpacks entirely by adding a custom Alpine-based Dockerfile.

## Checklist
- [x] Check `next.config.mjs` and ensure `output: "standalone"` is set
- [x] Create a `.dockerignore` file to exclude `node_modules`, `.git`, etc.
- [x] Create a multi-stage `Dockerfile` optimized for Next.js (using `node:20-alpine`)
- [ ] Inform the user to switch the "Build Pack" in Coolify to "Docker" (if it doesn't switch automatically)