# Comprehensive Interview Preparation Guide: Video Sharing Platform

This document consolidates everything you need to prepare for your on-campus interview. It covers your high-level pitch, architectural decisions, code-level deep dives (specifically the User Controller), and the top technical questions you might face.

---

## 📌 PART 1: The Elevator Pitch (6 Core Pillars)
*Use this when the interviewer asks: "Walk me through your project."*

### 1. What I Built
I built a robust, full-stack video-sharing platform akin to YouTube. It goes beyond simple CRUD operations by supporting traditional VOD (Video on Demand) uploading, social networking features (likes, comments, subscriptions, community tweets), and highly secure user profile management.

### 2. Tech Stack
*   **Frontend:** React.js, Vite, Tailwind CSS
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (using Mongoose ODM)
*   **Caching & Message Broker:** Redis
*   **Media Storage & Delivery:** Cloudinary
*   **Background Jobs:** Custom Queues (`bullmq`/Redis) and Workers

### 3. Key Features
*   **Advanced Authentication:** Secure JWT dual-token mechanism (Access/Refresh), Google OAuth, and Redis-backed Email OTP verification. Also supports multiple "saved accounts" acting like a profile switcher.
*   **Background Processing:** Video uploading is decoupled. Features like email dispatching are safely pushed to background worker queues.
*   **Deep Social Interactions:** Watch history tracking, nested replies, playlists, channel subscriptions, and automated feed generation.

### 4. Architecture Decisions
*   **Decoupled Media Delivery:** I offloaded all video and image hosting to Cloudinary. This prevents the single-threaded Node server's bandwidth from being throttled by heavy media streaming.
*   **Background Queue Processing:** Because Node.js is single-threaded, network-heavy tasks (like emails) were pushed to background Message Queues so the main event loop isn't blocked.
*   **Reference-based DB Schema:** Instead of embedding unbounded arrays (like storing thousands of "subscribers" inside a single User document), I normalized the data into a separate `Subscription` collection. This avoids hitting MongoDB’s strict 16MB document size limit as the app scales.

### 5. Performance & Scalability
*   **Redis for High-Speed Read/Writes:** Stored transient data like OTPs, session states, and rate-limiting counters in Redis. Because Redis is an in-memory datastore, it handles these high-frequency operations exponentially faster than MongoDB.
*   **Mongoose Aggregation Pipelines:** Complex data joining (e.g., getting a channel's subscriber count) is handled purely at the database level using `$aggregate` pipelines, reducing memory load on the Node server.

### 6. Future Improvements (To impress your interviewer)
*   **Adaptive Bitrate Streaming (HLS/DASH):** Currently using standard MP4s. A major improvement would be transcoding using FFmpeg to chop videos into multiple resolutions and chunks to prevent buffering.
*   **Elasticsearch / Typesense Integration:** Introducing a dedicated search engine layer for incredibly fast, typo-tolerant video searches.
*   **Microservices Transition:** Splitting the background workers (queue processing) into their own scaled servers independently from the core HTTP API.
*   **CDN (Content Delivery Network):** Putting a CDN (like AWS CloudFront) in front of Cloudinary to cache static assets closer to users globally.

---

## 🛠 PART 2: Code Deep Dive - User Controller (`user.controller.js`)
*This section covers the core backend logic you wrote for user management.*



### Authentication & Session Flow
*   **`registerUser`:** Validates input -> Checks if user exists -> Uploads images (Cloudinary) -> Creates DB entry -> Generates Tokens -> Sends verification email via Background Queue -> Sets cookies.
*   **`loginUser` & `logoutUser`:** Verifies credentials (bcrypt) -> Generates short-lived Access Token & long-lived Refresh Token -> Updates session in DB -> Sets `HttpOnly` & `Secure` cookies.
*   **Multi-Account Management (`addAccount` / `switchAccount`):** Stores an array of `userIds` in a signed JWT cookie (`savedAccounts`). Allows users to switch between logic accounts seamlessly without re-entering passwords.


### Complex Database Operations
*   **`getUserChannelProfile`:** Uses Mongoose `$aggregate`. 
    *   **Crucial stage:** Understand the `$lookup` stage. It joins the `User` collection with the `Subscription` collection twice: once to find subscribers, once to find matching subscribed channels.
*   **`addToWatchHistory`:** Uses atomic MongoDB operators (`$pull` to remove duplicate entries, then `$push` with `$position: 0` and `$slice: 100` to add the new video to the top and keep the array size capped at 100).

### Security & Validations
*   **Rate Limiting:** Protects the `sendSignupOtp` and `forgotPassword` routes from spam using Redis TTL.
*   **`asyncHandler`:** A higher-order function that wraps asynchronous Express routes carefully catching rejecting promises and passing them to the global error middleware, preventing server crashes.

---

## 🧠 PART 3: Top Interview Questions & Example Answers

### Architecture & System Design Questions

**Q1: Can you walk me through the architecture of your application?**
**Answer:** "The frontend is a React SPA built with Vite. The backend is an Express API. I used MongoDB for persistent storage, Cloudinary for media hosting, and Redis as an in-memory datastore for rate-limiting, OTP caching, and handling background queues for heavy tasks like email sending."

**Q2: How do you handle large file (video) uploads?**
**Answer:** "I use `multer` middleware to intercept the multipart form data. The file is temporarily stored on the server's disk. Then, my Cloudinary utility uploads that local file to Cloudinary's servers. Once Cloudinary returns the secure URL, I delete the local temporary file using the Node `fs` module to free up server storage, and save the URL in MongoDB."

**Q3: Node.js is single-threaded. How do you handle CPU-intensive tasks?**
**Answer:** "For network-heavy tasks like sending bulk emails, I don't block the main event loop. I place job details onto a message queue (`queues/`). Independent worker processes (`workers/`) listen to these queues and process the heavy tasks asynchronously in the background."

### Backend & Code Implementation Questions

**Q4: Why do you use both an Access Token and a Refresh Token?**
**Answer:** "Security and User Experience. Access tokens have a short lifespan (e.g., 15 mins). If one is stolen, the attacker's window is small. The refresh token is long-lived but stored securely (`HttpOnly` cookie) and verified against the database. When the access token expires, the client uses the refresh token to get a new pair seamlessly without forcing a re-login."

**Q5: What are `HttpOnly` and `Secure` flags in cookies?**
**Answer:** 
- `HttpOnly`: Prevents client-side scripts (JavaScript) from accessing the cookie, preventing XSS (Cross-Site Scripting) attacks.
- `Secure`: Ensures the cookie is only sent over verified HTTPS connections.
- `SameSite`: Protects against CSRF (Cross-Site Request Forgery).

**Q6: How did you implement Watch History without letting the array grow infinitely?**
**Answer:** "MongoDB documents have a 16MB limit. To prevent the `watchHistory` array from growing indefinitely, I used MongoDB's `$push` operator with the `$slice` modifier. In my `addToWatchHistory` controller, I `$slice: 100`, which automatically caps the array at the 100 most recent videos. I also use `$pull` first to atomically remove the video if it's already there to prevent duplicates."

**Q7: Why did you use Redis for OTPs instead of saving them in the MongoDB User document?**
**Answer:** "OTPs are highly transient data. Using Redis `setex` automatically handles TTL (Time-To-Live), clearing the OTP after 10 minutes. If I used MongoDB, it would require unnecessary disk write/reads and a background cron job to clean up stale OTPs. Redis is in-memory, making it exponentially faster and more efficient for this use case."

---

## 🎯 PART 4: Interview Strategy Guide (Pro-Tips)

When asked to talk about your project, **lead the interviewer to the parts you are most confident about:**
1. **If you are strong in System Design:** Talk about your Queues (`bullmq`/Redis workers) and how you decoupled the email system from the main Express server.
2. **If you are strong in Database Management:** Talk about your Mongoose Aggregation pipelines (e.g., how you fetched the watch history or channel analytics) and data normalization.

**Be prepared to answer:** *"What was the hardest bug you faced and how did you resolve it?"* 

*(Here are two advanced, highly technical examples you can use)*

**Example 1: The JWT Refresh Token Race Condition (Concurrency Bug)**
*   **The Bug:** "Users were complaining about being randomly logged out of the application even when actively using it. It only seemed to happen when they had my site open in multiple browser tabs at the same time."
*   **The Debugging Process:** "I suspected an issue with my authentication token rotation. I checked the server logs and saw that when the short-lived access token expired, multiple `/refresh-token` API requests were hitting the server in the exact same millisecond. I realized it was a classic race condition: 3 tabs generated 3 simultaneous 401 Unauthorized errors, and my frontend Axios interceptor triggered 3 simultaneous refresh requests."
*   **The Solution:** "The first request successfully hit the backend, issued new tokens, and invalidated the old refresh token in the database. The 2nd and 3rd requests failed because the old refresh token was now invalid, forcing the user out of the app. To fix this, I implemented a 'Refresh Token Lock' in my frontend Axios interceptor using a Promise. If a refresh is already in flight, newly failed requests are queued up into an array. Once the first promise resolves with the new token, all queued requests are flushed and retried simultaneously. This cleanly resolved the random logouts."

**Example 2: The Background Cloudinary Upload Disk Exhaustion (Memory/Storage Leak)**
*   **The Bug:** "After deploying my app, the server would run perfectly for about 3-4 days, and then suddenly crash entirely. The server logs wouldn't throw a Node.js error, the entire Virtual Machine was just locking up."
*   **The Debugging Process:** "I SSH'd into the production server and ran `df -h` (disk free) and saw that my server disk space was at 100% capacity. I investigated my project directory and noticed the `public/temp` folder, where `multer` temporarily stores uploaded videos before pushing them to Cloudinary, was massive. I had a line of code: `fs.unlinkSync(localFilePath)` to delete the file after upload, so it shouldn't have been full."
*   **The Solution:** "I realized that if the Cloudinary API failed or timed out during the upload, my code would throw an error and completely skip the `fs.unlinkSync` line, abandoning the 200MB video file on my server permanently. I fixed this by wrapping my Cloudinary utility in a robust `try/catch/finally` block. I ensured that the local file deletion explicitly lives inside the `finally` block or triggers synchronously on an error catch, guaranteeing the temporary file is deleted from my server disk no matter what the 3rd party API does. The server never went down again."

---

## 📚 PART 5: Learning Deep Dive - Redis, Queues, Emails, and OAuth
*Since you need to learn these mechanisms, here is a detailed breakdown of the skills used and how the data flows through your app.*

### 1. Redis & Background Queues (For Emails)
**Skills Demonstrated:** *Asynchronous Message Brokering, Decoupling Architectures, In-Memory Caching, Node.js Event Loop Optimization.*

**The "Why":** Sending an email over SMTP (Nodemailer, SendGrid, etc.) is a slow, blocking network task. If you make a user wait for the email to send before returning a `201 Created` response, they will literally be staring at a loading spinner for 3+ seconds. Since Node.js is single-threaded, if 100 people sign up at once, your entire server will freeze.

**The Architecture Flow (How your code works):**
1. **The Trigger:** A user hits `/register` or `/send-signup-otp` via an Express route.
2. **The Producer (Express App):** Instead of sending the actual email, your Express app packages the required data (e.g., `{ email: "user@test.com", otp: "123456" }`) into a small JSON "Job Payload".
3. **The Queue (Redis):** Your app instantly pushes this Job Payload into a Redis Queue (likely using `BullMQ` or native Redis lists). Notice how fast this is—writing to Redis takes ~1 millisecond.
4. **The Response:** Your Express app immediately replies to the user frontend: `"Verification code sent!"` (No loading time!)
5. **The Worker (Background Process):** In a completely separate terminal or Node thread (`workers/emailWorker.js`), a Worker script is constantly "listening" to that Redis Queue.
6. **The Consumer Action:** The Worker sees the new job, pulls the data (`email`, `otp`), connects to the actual SMTP server, and sends the legitimate email. When finished, it marks the job as `Completed` in Redis. 

### 2. Redis for Memory Caching & Rate Limiting
**Skills Demonstrated:** *Key-Value Store Data structures, Time-to-Live (TTL) expiries, Atomic Counters.*

**The "Why":** You need to securely limit how many times someone can request a password reset, and you need to store short-lived data (the OTP) temporarily. Storing this in MongoDB means heavy disk writes and annoying background jobs to delete old OTPs. 

**The Architecture Flow:**
1. **Rate Limiting:** A user requests an OTP. Your backend calls `pub.incr('ratelimit:email')`. This atomically increments a counter in Redis cache. If that counter hits 5, you throw an HTTP 429 Too Many Requests error.
2. **The OTP TTL:** The backend generates a 6-digit OTP and pushes it to memory: `pub.setex('otp:email', 600, '123456')`. 
3. **The Magic:** `setex` stands for "Set with Expiry". Redis automatically wipes that `123456` code out of memory perfectly in exactly 600 seconds (10 minutes).
4. **Verification:** When the user types the code in the UI, you call `pub.get('otp:email')`—it instantly reads from RAM, verifying it seamlessly without ever touching your database hard drives.

### 3. Google OAuth 2.0 Identity Flow
**Skills Demonstrated:** *Symmetric/Asymmetric Cryptography logic, OAuth 2.0 Protocol, JWT Validation.*

**The "Why":** Users hate making new passwords. Google provides a secure bridge where they authenticate the user, and pass *you* cryptographically signed proof that the user is who they claim to be.

**The Architecture Flow:**
1. **Frontend Request (React):** The user clicks "Login with Google". React safely redirects them to standard Google servers, where they log in to Google (not your app).
2. **The Handshake:** Google redirects back to your React app with an `id_token`—a massive string of data signed natively by Google's private servers.
3. **The Secure Hand-off:** React sends that `id_token` straight to your Express backend (`/users/google-auth`).
4. **Backend Cryptographic Verification:** Your Express app uses the `google-auth-library`. Under the hood, this library downloads **Google's Public JWKS (JSON Web Key Sets)**. It mathematically verifies that the `id_token` was 100% generated by Google and hasn't been tampered with by a hacker mid-flight.
5. **Extracting Data:** Once verified, you decode the token and safely pull the payload (email, name, Google profile picture URL).
6. **User Sync (MongoDB):** You check your database: `User.findOne({ email })`. 
    * If the email doesn't exist, you silently create a new Mongo document with an auto-generated username mapping their custom avatar over to your side.
    * If it does exist, you select that user.
7. **The Clean Handoff:** You don't rely on Google's token anymore. Instead, you instantly generate your *own* custom Access Token & Refresh Token, bundle them in `HttpOnly` cookies exactly like a normal `/login`, and send a `200 OK`! The app now treats them as a locally-authenticated user.