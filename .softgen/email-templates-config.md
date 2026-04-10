# Email Templates Setup für Coolify/Supabase

## Template URLs

Die Email-Templates sind jetzt unter diesen URLs verfügbar:

1. **Confirmation Email:** `https://finanzportal.is/emails/confirmation?url={{.ConfirmationURL}}`
2. **Recovery Email:** `https://finanzportal.is/emails/recovery?url={{.ConfirmationURL}}`
3. **Invite Email:** `https://finanzportal.is/emails/invite?url={{.ConfirmationURL}}`

## Konfiguration in Supabase (Coolify)

### 1. SMTP Settings (Environment Variables)
```
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<dein-resend-api-key>
SMTP_SENDER_NAME=Finanzportal
MAILER_SENDER=info@finanzportal.app
```

### 2. Redirect URLs
```
SITE_URL=https://finanzportal.is
REDIRECT_URLS=https://finanzportal.is/dashboard,https://finanzportal.is/auth/confirm-email
```

### 3. Email Template URLs in Supabase Auth Config

Gehe zu **Authentication** → **Email Templates** und setze:

**Confirmation Email:**
- Template URL: `https://finanzportal.is/emails/confirmation?url={{.ConfirmationURL}}`

**Recovery Email:**
- Template URL: `https://finanzportal.is/emails/recovery?url={{.ConfirmationURL}}`

**Invite Email:**
- Template URL: `https://finanzportal.is/emails/invite?url={{.ConfirmationURL}}`

## Hinweis

Die Templates werden dynamisch von deiner Next.js App gerendert. Supabase ruft die URL ab und sendet das HTML als Email.