/**
 * email.js — sends email via the official Resend SDK (HTTPS, no SMTP, no Redis)
 *
 * Required env: RESEND_API_KEY, EMAIL_FROM
 */
import { Resend } from "resend";

/**
 * Send an email.
 *
 * @param {{ to: string, subject: string, html: string }} options
 */
export async function sendEmail({ to, subject, html }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set in .env");

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to,
        subject,
        html,
    });

    if (error) {
        console.error("[resend] Send error:", error);
        throw new Error(error.message || "Failed to send email");
    }

    return data;
}

