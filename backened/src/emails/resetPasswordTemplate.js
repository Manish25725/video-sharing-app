/**
 * resetPasswordTemplate.js
 * Password-reset email with a one-time link.
 *
 * @param {{ resetUrl: string, userName: string }} params
 * @returns {string} HTML email body
 */
export function resetPasswordTemplate({ resetUrl, userName }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:#ef4444;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Reset your password
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                Hi <strong>${userName}</strong>,
              </p>
              <p style="margin:0 0 28px;color:#374151;font-size:16px;line-height:1.6;">
                We received a request to reset the password for your account.
                Click the button below — this link is valid for <strong>1 hour</strong>.
              </p>

              <!-- CTA button -->
              <div style="text-align:center;margin:0 0 32px;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:#ef4444;color:#ffffff;
                          text-decoration:none;font-size:16px;font-weight:700;
                          padding:14px 36px;border-radius:8px;letter-spacing:0.2px;">
                  Reset Password
                </a>
              </div>

              <!-- Fallback URL -->
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${resetUrl}" style="color:#6366f1;font-size:13px;">${resetUrl}</a>
              </p>

              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password will not be changed.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;
                       padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                This is an automated message — please do not reply.
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
}
