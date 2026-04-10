import type { GetServerSideProps } from "next";

export default function ConfirmationEmail() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const confirmUrl = query.url || "https://finanzportal.is/dashboard";

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email bestätigen</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 20px 0; font-size: 24px; color: #1e293b;">Finanzportal</h1>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #475569;">
                Vielen Dank für Ihre Registrierung auf Ihrem Finanzportal.<br>
                Bitte klicken Sie auf unten stehenden Link zur Bestätigung Ihrer Email.
              </p>
              <a href="${confirmUrl}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                Email bestätigen
              </a>
              <p style="margin: 30px 0 0 0; font-size: 14px; color: #94a3b8;">
                Falls Sie sich nicht registriert haben, können Sie diese Email ignorieren.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                © 2026 Finanzportal<br>
                <a href="mailto:info@finanzportal.app" style="color: #3b82f6; text-decoration: none;">info@finanzportal.app</a> | 
                <a href="https://finanzportal.is" style="color: #3b82f6; text-decoration: none;">finanzportal.is</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    props: {},
    // @ts-ignore
    redirect: undefined,
    notFound: false,
  };
};

export async function getStaticProps() {
  return {
    props: {},
  };
}