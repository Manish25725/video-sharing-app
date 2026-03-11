/**
 * email.js — Nodemailer transporter configured for Resend SMTP
 *
 * Required environment variables:
 *   RESEND_API_KEY  — your Resend API key (get one free at https://resend.com)
 *   EMAIL_FROM      — "display name <noreply@yourdomain.com>"
 */

import nodemailer from "nodemailer";

// Single shared transporter — connection pool reused across all sends
const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 587,
    secure: false,          // STARTTLS on port 587
    auth: {
        user: "resend",     // always the literal string "resend" for Resend SMTP
        pass: process.env.RESEND_API_KEY,
    },
});

/**
 * Send an email.
 *
 * @param {{ to: string, subject: string, html: string }} options
 * @throws if the SMTP call fails
 */
export async function sendEmail({ to, subject, html }) {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not set. Add it to your .env file.");
    }

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || "noreply@myapp.com",
        to,
        subject,
        html,
    });
}
