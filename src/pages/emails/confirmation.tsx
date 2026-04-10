import type { GetServerSideProps } from "next";

export default function ConfirmationEmail() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  const { token_hash = "", type = "signup" } = query;
  
  const verifyUrl = `https://supabase.finanzportal.is/auth/v1/verify?token=${token_hash}&type=${type}&redirect_to=https://finanzportal.is/dashboard`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Willkommen beim Finanzportal</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                      Willkommen beim Finanzportal
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;">
                      Vielen Dank für Ihre Registrierung! Um Ihr Konto zu aktivieren, bestätigen Sie bitte Ihre E-Mail-Adresse.
                    </p>
                    
                    <p style="margin: 0 0 30px; color: #64748b; font-size: 14px; line-height: 1.6;">
                      Klicken Sie einfach auf den Button unten:
                    </p>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${verifyUrl}" 
                             style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                            E-Mail bestätigen
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 30px 0 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                      Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
                      <a href="${verifyUrl}" style="color: #667eea; word-break: break-all;">${verifyUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 0 0 16px 16px;">
                    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6; text-align: center;">
                      Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.
                    </p>
                    <p style="margin: 10px 0 0; color: #94a3b8; font-size: 12px; text-align: center;">
                      © ${new Date().getFullYear()} Finanzportal. Alle Rechte vorbehalten.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.write(html);
  res.end();

  return {
    props: {},
  };
};