---
title: Surgically Add Support Requests to Admin Panel
status: done
priority: urgent
type: bug
tags: [admin, bugfix, surgical]
created_by: Softgen
---

## Notes
The admin panel successfully stores support requests, but fails to load them because they are not included in the `loadData` function. 
The user is frustrated because previous edits broke this 2019-line file. 
**CRITICAL INSTRUCTION FOR EXECUTING AGENT:** You MUST use `update_file_sections` to inject exactly two lines. DO NOT rewrite the file. DO NOT delete any existing code. Be extremely precise.

## Checklist
- [x] Use `update_file_sections` on `src/pages/admin.tsx`.
- [x] In the `loadData` function, find `const poolData = await walletService.getWalletPool();` and add `const supportData = await supportService.getAllSupportRequests();` right below it.
- [x] In the same function, find `setWalletPool(poolData || []);` and add `setSupportRequests(supportData || []);` right below it.
- [x] Do NOT touch any other functions, imports, or UI code. The file must remain exactly as it is, minus these two additions in `loadData`.