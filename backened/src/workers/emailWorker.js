import { Worker } from "bullmq";
import { sendEmail }               from "../utils/email.js";
import { verifyEmailTemplate }     from "../emails/verifyEmailTemplate.js";
import { resetPasswordTemplate }   from "../emails/resetPasswordTemplate.js";

const useMock = process.env.NODE_ENV === "production" && !process.env.REDIS_URL;

const redisConnection = process.env.REDIS_URL ? {
    url: process.env.REDIS_URL,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false
} : {
    host:     process.env.REDIS_HOST     || "127.0.0.1",
    port:     parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
};

let emailWorker = null;

if (!useMock) {
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
                    console.warn(`[email worker] Unknown email type "${type}" - skipped`);
                }
            },
            {
                connection:   redisConnection,
                concurrency:  5,
                lockDuration: 30_000,
            }
        );

        emailWorker.on("failed", (job, err) => {
            console.error(`[email worker] Job ${job?.id} failed:`, err.message);
        });

        emailWorker.on("error", (err) => {
            if (err.code !== "ECONNREFUSED") {
                console.error("[email worker] error:", err.message);
            }
        });

        process.on("SIGTERM", async () => { await emailWorker?.close(); });
        process.on("SIGINT",  async () => { await emailWorker?.close(); });
    } catch (err) {
        console.warn("[email worker] Disabled - Redis unavailable");
    }
} else {
    console.warn("[email worker] Bypassed for Free Plan without REDIS.");
}

export { emailWorker };
