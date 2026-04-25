---
title: Support form on login and admin panel
status: todo
priority: medium
type: feature
tags: [ui, database, isolated]
created_by: agent
created_at: 2026-04-25T18:25:00.000Z
position: 12
---

## Notes
**CRITICAL INSTRUCTION: STRICT ISOLATION.**
This feature must be built without touching ANY core dashboard, transaction, or wallet logic. 
- Do NOT open or edit `dashboard.tsx`.
- Do NOT edit `transactionService.ts` or `walletService.ts`.
- The database table must be standalone with no foreign key dependencies that could break existing schema.

## Checklist
- [ ] Create a new migration file in `supabase/migrations/` for a `support_requests` table (fields: id, name, email, phone, message, status (e.g., 'open', 'resolved'), created_at).
- [ ] Create a new isolated component `SupportDialog.tsx` (or similar) containing a form with fields for Name, E-Mail, Telefon, and Nachricht.
- [ ] Update `src/components/AuthForm.tsx` to include a "Kundensupport" button (e.g., below the login fields or in the footer) that opens the `SupportDialog`.
- [ ] Implement the Supabase insert logic inside the `SupportDialog` component (or a dedicated isolated service file).
- [ ] Update `src/pages/admin.tsx` by adding a new Tab "Support-Anfragen" that fetches and displays the data from the `support_requests` table.

## Acceptance
- User can click "Kundensupport" on the login page, fill out the form, and submit it.
- The data is saved to the new `support_requests` table.
- The Admin can view the submitted requests in a new tab in the Admin panel.
- Dashboard, transactions, and core calculations remain 100% fully functional.