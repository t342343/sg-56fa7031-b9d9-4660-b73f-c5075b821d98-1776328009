import type { GetServerSideProps } from "next";

export default function RecoveryEmail() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  const { token_hash = "", type = "recovery" } = query;
  
  const verifyUrl = `https://supabase.finanzportal.is/auth/v1/verify?token=${token_hash}&type=${type}&redirect_to=https://finanzportal.is/dashboard`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Passwort zurücksetzen - Finanzportal</title>
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
                      Passwort zurücksetzen
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;">
                      Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.
                    </p>
                    
                    <p style="margin: 0 0 30px; color: #64748b; font-size: 14px; line-height: 1.6;">
                      Klicken Sie auf den Button, um ein neues Passwort zu erstellen:
                    </p>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${verifyUrl}" 
                             style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                            Neues Passwort erstellen
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 30px 0 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                      Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
                      <a href="${verifyUrl}" style="color: #667eea; word-break: break-all;">${verifyUrl}</a>
                    </p>

                    <p style="margin: 20px 0 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e; font-size: 13px; line-height: 1.6;">
                      <strong>Wichtig:</strong> Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail. Ihr Passwort bleibt unverändert.
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