# Avyukt Restaurant 🍽️

**Authentic Flavours, Modern Ambience.**  
A high-performance, full-stack digital dining platform and restaurant management suite built with React 19, Vite, Firebase, and Razorpay.

[![Live Preview](https://img.shields.io/badge/Live-Preview-brightgreen?style=for-the-badge&logo=vercel)](https://avyukt-restaurant.vercel.app/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)](https://razorpay.com/)

---

## ✨ Key Features

- 📖 **Interactive Digital Menu**: Realistic page-flip experience with dietary filters (Pure Veg, Jain) and chef recipe guides.
- 🛒 **Smart Ordering & Checkout**: Supports Dine-in, Takeaway, and Delivery modes with automatic location detection.
- 💳 **Secure Razorpay Payments**: Instant online payments via UPI, Cards, NetBanking, and Cash on Delivery (COD).
- 📍 **Live Order Tracking**: Real-time order progress updates from kitchen preparation to final delivery.
- 📅 **Table Reservations & Feedback**: Fast online table booking engine and direct customer review management.
- 🔐 **Flexible Authentication**: Secure login via Google Popup, Email & Password, or 6-Digit Email OTP with Cloud Firestore profile sync.
- 👑 **Admin Command Center**: Unified dashboard for real-time order lifecycle control, booking approvals, revenue metrics, and promo broadcasts.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 (Hooks, Context API) |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS & Modern Vanilla CSS Variables |
| **Animations** | Framer Motion & CSS Micro-animations |
| **Icons & Charts**| Lucide React & Recharts |
| **Backend API** | Express.js REST API ([Avyukt-Backend](https://avyukt-backend.vercel.app/)) |
| **Database & Auth** | Cloud Firestore & Firebase Authentication |
| **Payments** | Razorpay Checkout SDK |
| **Hosting** | Vercel |

---

## 📁 Project Structure

```text
Avyukt Restro/
├── src/
│   ├── assets/         # Optimized restaurant imagery and brand assets
│   ├── components/     # Reusable UI components (Header, Footer, Menu, Modals)
│   ├── context/        # React Context providers (Auth, Cart, Toast)
│   ├── firebase/       # Firebase client initialization and service bindings
│   ├── pages/          # Application views (Home, Menu, Admin_Dashboard, Profile, Login)
│   ├── services/       # Centralized REST API client (api.js)
│   ├── App.jsx         # Router configuration and layout wrapper
│   └── main.jsx        # Client entry point
├── public/             # Static public assets (icons, manifest)
├── vite.config.js      # Vite build configuration
└── tailwind.config.js  # Theme, fonts, and color token configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or later
- **npm** or **yarn**

### 2. Clone and Install
```bash
git clone https://github.com/SAFAL-TIWARI/Avyukt-Restaurant.git
cd "Avyukt Restro"
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:5000

# Admin Access Credentials
VITE_ADMIN_EMAIL=admin_email
VITE_ADMIN_PASSWORD=admin_password

# Razorpay Test Key ID
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Production Build
```bash
npm run build
```

---

## 🌐 Live Deployment

- **Production Portal**: [https://avyukt-restaurant.vercel.app](https://avyukt-restaurant.vercel.app/)

---

<div align="center">
  <sub>Designed & Developed for <strong>Avyukt Restaurant & Cafe</strong> • Vidisha, Madhya Pradesh</sub>
</div>
