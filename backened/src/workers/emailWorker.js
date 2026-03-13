import { Worker } from "bullmq";
import { sendEmail }               from "../utils/email.js";
import { verifyEmailTemplate }     from "../emails/verifyEmailTemplate.js";
import { resetPasswordTemplate }   from "../emails/resetPasswordTemplate.js";

const redisConnection = {
    host:     process.env.REDIS_HOST     || "127.0.0.1",
    port:     parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
};

let emailWorker = null;

try {
    emailWorker = new Worker(
        "email",
        async (job) => {
            const { type, to, ...data } = job.data;

            if (type === "verify") {
                await sendEmail({
                    to,
                    subject: "Verify your email",
                    html: verifyEmailTemplate({ otp: data.otp, userName: data.userName }),
                });

            } else if (type === "reset") {
                await sendEmail({
                    to,
                    subject: "Reset your password",
                    html: resetPasswordTemplate({ resetUrl: data.resetUrl, userName: data.userName }),
                });

            } else {
                console.warn(`[email worker] Unknown email type "${type}" — skipped`);
            }
        },
        {
            connection:   redisConnection,
            concurrency:  5,          // send up to 5 emails in parallel
            lockDuration: 30_000,
        }
    );

    emailWorker.on("failed", (job, err) => {
        console.error(`[email worker] Job ${job?.id} failed (type=${job?.data?.type}):`, err.message);
    });

    emailWorker.on("error", (err) => {
        if (err.code !== "ECONNREFUSED") {
            console.error("[email worker] Worker error:", err.message);
        }
    });

    process.on("SIGTERM", async () => { await emailWorker?.close(); });
    process.on("SIGINT",  async () => { await emailWorker?.close(); });

} catch (err) {
    console.warn("[email worker] Disabled — Redis unavailable:", err.message);
}

export { emailWorker };
