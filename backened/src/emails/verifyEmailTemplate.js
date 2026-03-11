/**
 * verifyEmailTemplate.js
 * OTP verification email sent after registration.
 *
 * @param {{ otp: string, userName: string }} params
 * @returns {string} HTML email body
 */
export function verifyEmailTemplate({ otp, userName }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:#6366f1;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Verify your email address
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
                Thanks for signing up! Use the code below to verify your email address.
                This code expires in <strong>10 minutes</strong>.
              </p>

              <!-- OTP box -->
              <div style="text-align:center;margin:0 0 32px;">
                <span style="display:inline-block;background:#f0f0ff;border:2px dashed #6366f1;
                             border-radius:10px;padding:18px 40px;
                             font-size:38px;font-weight:800;letter-spacing:12px;color:#4f46e5;">
                  ${otp}
                </span>
              </div>

              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                If you didn't create an account, you can safely ignore this email.
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
