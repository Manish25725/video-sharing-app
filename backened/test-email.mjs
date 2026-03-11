import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
console.log("API Key starts with:", process.env.RESEND_API_KEY?.slice(0, 10) + "...");
console.log("From:", process.env.EMAIL_FROM);

// Replace this with YOUR actual email to receive the test
const TEST_TO = process.env.TEST_EMAIL || "test@gmail.com";

console.log("Sending to:", TEST_TO);

const { data, error } = await resend.emails.send({
  from: process.env.EMAIL_FROM || "onboarding@resend.dev",
  to: TEST_TO,
  subject: "PlayVibe — Test Email",
  html: "<h1>It works!</h1><p>Email is configured correctly.</p>",
});

if (error) {
  console.error("\n❌ FAILED:", JSON.stringify(error, null, 2));
} else {
  console.log("\n✅ SUCCESS! Email ID:", data.id);
}
