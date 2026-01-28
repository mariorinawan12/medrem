# MedRem - Cross-Platform Medication Reminder

A smart medication reminder app accessible via Web (PWA). While currently web-only, it's designed to be installed on iOS and Android home screens for a native-like experience.

🔗 **Try it here:** [https://medrem.pages.dev](https://medrem.pages.dev)

---

## What This Does

A complete system to manage medications for yourself or people you care about. It's not just a simple alarm clock; it tracks status and alerts others if something goes wrong.

**Features:**
- **Guardian Mode** - If a dependent misses their medication, the "Guardian" gets a notification after a set delay.
- **Universal Access** - Accessible via Web (PWA) and installable on iOS/Android.
- **Smart Reminders** - Push notifications that handle timezones and scheduling.
- **Family Management** - Add multiple dependents under one account.
- **Progress Tracking** - Daily medication completion tracking.

---

## How I Built This

### The Problem I Tried to Solve

Most reminder apps are isolated. This project aims to connect patients with caregivers, allowing for passive monitoring without being intrusive. It also explores how a PWA can deliver an app-like experience on mobile devices.

### The Architecture

```
Frontend (React Native + Expo)
    ↓
Backend API (Node.js + Express)
    ↓
Database (PostgreSQL)
```

**Why this stack?**
- **Expo**: allowed me to move fast and target Web/iOS/Android from day one.
- **Node/Express**: kept the backend simple and scalable.
- **Sequelize**: easy definition of relationships (User -> Dependents -> Medications).

### Tech I Used

**Frontend**
- React Native + Expo - The core framework.
- Expo Router - For file-based routing (Next.js style).
- React Native Paper - For pre-built, nice-looking components.
- StyleSheet - Standard React Native styling (no fancy CSS-in-JS, just what works).
- PWA Support - Serviceworkers and manifest for that "native-like" web feel.

**Backend**
- Node.js + Express
- PostgreSQL - Robust relational data for complex user relationships.
- Sequelize ORM - Handling all the SQL heavy lifting.
- Firebase Cloud Messaging (FCM) - For delivering push notifications reliably.

**Deployment**
- **Frontend**: Cloudflare Pages.
- **Backend**: Self-Hosted on Ubuntu Server (Docker) + Cloudflare Tunnel.

---

## What I Learned

### Things That Were Hard

1. **PWA Fullscreen on different devices** - Getting the PWA to look and act like a native app on iOS (Safari) vs Android (Chrome) was tricky. Dealing with "safe areas" and browser bars required some specific meta tag hacks and CSS tweaks.

2. **Push Notifications are Hard** - Handling notifications across platforms is a pain. FCM works great, but coordinating "local" scheduled notifications vs "remote" push notifications for missed updates took some logic.

3. **Guardian Logic** - Implementing the "delayed check" for the Guardian feature was interesting. I had to build a background worker that checks medication status *after* the due time passed, but only alerts if it's still marked as "skipped" or "pending."

---


## Project Structure

```
medrem/
├── frontend/          # React Native Expo app
│   ├── app/           # Expo Router pages
│   ├── components/    # Reusable UI components
│   └── lib/           # Logic & API services
│
└── backend/           # Node.js API
    ├── controllers/   # Logic for Users, Meds
    ├── services/      # Background jobs (Guardian alerts)
    └── models/        # Database schema
```

---

## Author

**Mario Rinawan**

Fresh grad trying to learn new things. Built this to learn and showcase what I can do.

- Live Demo: [https://medrem.pages.dev](https://medrem.pages.dev)
- Email: [mariorinawan@gmail.com]
- Phone: 08111474638

---

## License

This is a portfolio project. Feel free to explore and learn from it!
