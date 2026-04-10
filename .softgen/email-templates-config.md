# Email Templates für Supabase (Coolify)

## Setup in Coolify/Supabase

1. Gehe zu deiner Supabase-Instanz in Coolify
2. Navigiere zu **Authentication** → **Email Templates**
3. Kopiere die Templates unten in die entsprechenden Felder

---

## Confirmation Email (Email-Bestätigung)

**Betreff:**
```
Finanzportal - Bitte bestätigen Sie Ihre Email
```

**Body:**
```
<h2>Finanzportal</h2>

<p>Vielen Dank für Ihre Registrierung auf Ihrem Finanzportal.</p>

<p>Bitte klicken Sie auf unten stehenden Link zur Bestätigung Ihrer Email:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px;">Email bestätigen</a></p>

<p style="color: #666; font-size: 14px;">Falls Sie sich nicht registriert haben, können Sie diese Email ignorieren.</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

<p style="color: #999; font-size: 12px;">
© 2026 Finanzportal<br>
info@finanzportal.app | finanzportal.is
</p>
```

---

## Recovery Email (Passwort zurücksetzen)

**Betreff:**
```
Finanzportal - Passwort zurücksetzen
```

**Body:**
```
<h2>Finanzportal</h2>

<p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>

<p>Klicken Sie auf den Button unten, um ein neues Passwort zu setzen:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px;">Passwort zurücksetzen</a></p>

<p style="color: #666; font-size: 14px;">Falls Sie diese Anfrage nicht gestellt haben, können Sie diese Email ignorieren.</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

<p style="color: #999; font-size: 12px;">
© 2026 Finanzportal<br>
info@finanzportal.app | finanzportal.is
</p>
```

---

## Invite Email (Einladung)

**Betreff:**
```
Finanzportal - Einladung
```

**Body:**
```
<h2>Finanzportal</h2>

<p>Sie wurden zum Finanzportal eingeladen.</p>

<p>Klicken Sie auf den Button unten, um Ihr Konto zu erstellen:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px;">Konto erstellen</a></p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

<p style="color: #999; font-size: 12px;">
© 2026 Finanzportal<br>
info@finanzportal.app | finanzportal.is
</p>
```

---

## SMTP Settings (falls noch nicht konfiguriert)

In Coolify unter Supabase → Environment Variables:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<dein-resend-api-key>
SMTP_SENDER_NAME=Finanzportal
MAILER_SENDER=info@finanzportal.app
```

**Redirect URLs setzen:**
```
SITE_URL=https://finanzportal.is
REDIRECT_URLS=https://finanzportal.is/dashboard,https://finanzportal.is/auth/confirm-email
```