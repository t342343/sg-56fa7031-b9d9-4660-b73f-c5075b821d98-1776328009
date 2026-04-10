# Email Templates Setup für Coolify/Supabase

## GoTrue Environment Variables

Setze diese in Coolify:

```bash
GOTRUE_MAILER_TEMPLATES_CONFIRMATION=https://finanzportal.is/emails/confirmation?token_hash={{.TokenHash}}&type=signup
GOTRUE_MAILER_TEMPLATES_RECOVERY=https://finanzportal.is/emails/recovery?token_hash={{.TokenHash}}&type=recovery
GOTRUE_MAILER_TEMPLATES_INVITE=https://finanzportal.is/emails/invite?token_hash={{.TokenHash}}&type=invite
```

## SMTP Settings (falls noch nicht gesetzt)

```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<dein-resend-api-key>
SMTP_SENDER_NAME=Finanzportal
GOTRUE_SMTP_ADMIN_EMAIL=info@finanzportal.app
GOTRUE_MAILER_AUTOCONFIRM=false
```

## Site URL

```bash
GOTRUE_SITE_URL=https://finanzportal.is
GOTRUE_URI_ALLOW_LIST=https://finanzportal.is/dashboard,https://finanzportal.is/auth/confirm-email
```

## Wie es funktioniert

1. Benutzer registriert sich
2. Supabase ruft `https://finanzportal.is/emails/confirmation?token_hash=...` ab
3. Next.js rendert das HTML-Template
4. Supabase sendet das HTML per Email via Resend
5. Benutzer klickt auf Button → landet auf finanzportal.is/dashboard

Die Templates sind bereits live unter:
- https://finanzportal.is/emails/confirmation
- https://finanzportal.is/emails/recovery
- https://finanzportal.is/emails/invite