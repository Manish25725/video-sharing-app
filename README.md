<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101" alt="Socket.io" />
  
  <br />
  <br />

  <h1>🎬 Playvibe - Video Sharing & Live Streaming Platform</h1>
  <p>
    A fully-featured, full-stack video-sharing and live-streaming application built using the MERN stack. Playvibe provides a complete ecosystem for creators and viewers, encompassing video uploads, live streaming with real-time chat, subscriptions, playlists, and a fully robust admin dashboard.
  </p>
</div>

<br />

## 🚀 Live Demo
- **Frontend Live App:** [https://video-sharing-app-rry8.onrender.com](https://video-sharing-app-rry8.onrender.com)
- **Backend API Health Check:** [https://video-sharing-app-backened.onrender.com/api/v1/health/check](https://video-sharing-app-backened.onrender.com/api/v1/health/check)

---

## 🎨 User Interface Highlights
> **Note:** You can upload your own screenshots and add them here to showcase the beautiful UI!
> 
> *Here are some placeholders for your project screenshots:*
> 
> <table>
>   <tr>
>     <td><img src="https://via.placeholder.com/400x225.png?text=Home+Feed+%2B+Dark+Mode" alt="Home Screen"/></td>
>     <td><img src="https://via.placeholder.com/400x225.png?text=Video+Player+%2B+Comments" alt="Video Player"/></td>
>   </tr>
>   <tr>
>     <td><img src="https://via.placeholder.com/400x225.png?text=Live+Stream+%2B+Realtime+Chat" alt="Live Stream"/></td>
>     <td><img src="https://via.placeholder.com/400x225.png?text=Admin+Dashboard+%2B+Stats" alt="Admin Dashboard"/></td>
>   </tr>
> </table>

---

## 📖 Features

### 👤 User Authentication & Accounts
- JWT-based authentication (Access & Refresh Tokens) stored securely in HttpOnly cookies.
- Google OAuth integration.
- Email verification (via Resend/Nodemailer).
- Password reset workflows.
- User channel profiles (Avatar, Cover Image, Subscriber Count, User Details).
- Account switching and saved accounts support.

### 🎥 Video Management
- Secure Video & Thumbnail uploads via Cloudinary.
- Watch History & Watch Later functionalities.
- Pagination and aggregation for fetching video feeds.
- Video Engagement: Like, Dislike, Comment, and Reply.

### 🔴 Live Streaming
- Real-time video broadcasting (via Node Media Server / HLS.js).
- Live Chat using Socket.io.
- Viewer count tracking and stream status monitoring.

### 💬 Social & Community
- Subscriptions: Subscribe/Unsubscribe to channels.
- Community Posts / Tweets system.
- Playlists creation and management.
- Real-time Notifications system.
- Video Reporting and Application Feedback system.

### 🛡️ Admin Dashboard
- Comprehensive admin panel to view platform statistics.
- Monitor active users, uploaded videos, and comments.
- Health checks and system monitoring.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS + Lucide React (Icons) + Heroicons
- **API Calls:** Axios (with smart interceptors for token refreshing)
- **Media Playback:** React Player + HLS.js
- **Real-Time:** Socket.io-client
- **Auth:** @react-oauth/google

### Backend
- **Environment:** Node.js + Express.js
- **Database:** MongoDB + Mongoose (with `mongoose-aggregate-paginate-v2`)
- **Authentication:** JSON Web Tokens (JWT) + Bcrypt
- **File Uploads:** Multer (Local temp storage) + Cloudinary SDK
- **Real-Time:** Socket.io
- **Live Streaming:** Node-Media-Server
- **Email Delivery:** Resend + Nodemailer
- **AI Integrations:** Groq SDK / OpenAI
- **Task Queues:** BullMQ + ioredis / ioredis-mock (for background workers)

---

## ⚙️ Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB connection URI
- Cloudinary Account
- Resend / SMTP credentials

### 1. Clone the repository
```bash
git clone https://github.com/Manish25725/video-sharing-app.git
cd video-sharing-app
```

### 2. Backend Setup
```bash
cd backened
npm install
```

Create a `.env` file inside the `backened/` directory:
```env
PORT=8000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=onboarding@resend.dev
FRONTEND_URL=http://localhost:3000
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontened
npm install
```

Create a `.env` file inside the `frontened/` directory:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_ADMIN_KEY=playvibe_admin_2025
```

Start the frontend development server:
```bash
npm run dev
```

---

## 🚢 Deployment Notes (Render)

This application is configured to run smoothly on Render (using the `render.yaml` blueprint).

- **Environment Variables:** Must be set securely in the Render dashboard. `ACCESS_TOKEN_EXPIRY` and `REFRESH_TOKEN_EXPIRY` are critical.
- **Cross-Origin Cookies:** Because the Render frontend and backend reside on different subdomains (`.onrender.com`), the API uses `SameSite="none"` and `Secure=true` for JWT token cookies in production.
- **SPA Routing:** On the frontend Web Service in Render, a redirect/rewrite rule (`Source: /*`, `Destination: /index.html`, `Action: Rewrite`) must be established to prevent React Router from throwing 404 errors on direct navigation.
- **Multer Storage:** The backend dynamically generates a `./public/temp` folder upon initialization to ensure Cloudinary temp files do not crash the ephemeral file system.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License
Distributed under the ISC License.
