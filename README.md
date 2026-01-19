# 🛡️ Care4Fun | Hack4Good 2026 | Team: Hack4Fun

**Care4Fun** is a community-driven platform built to bridge the gap between volunteers, participants, and impactful social events. Designed for the **Hack4Good** hackathon, this mobile application streamlines event discovery and registration with a seamless "Virtual Guest" system for immediate engagement.

---

### ⚠️ The Problem

**Problem Statement: "How might we reduce friction in activity sign-ups for both individuals and caregivers, while reducing manual effort for staff in managing and consolidating registration data?"**

Traditional registration flows often lose users at the "Sign Up" wall. Meanwhile, staff struggle with fragmented data from various sources.

### ✅ Our Solution: The "Frictionless" Workflow

We solve this by allowing users to act immediately and authenticate later.

1. **Virtual Guest System:** Users join events instantly using locally generated unique IDs.
2. **The Conversion Deal:** An automated backend "handover" that migrates guest data to permanent accounts upon registration, eliminating manual data consolidation for staff.

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Installation

Clone the repository and install the dependencies for the frontend:

```bash
cd frontend
npm install
```

### 3. Environment Configuration

Create a .env file in the root of your frontend directory and add your hosted backend URL:

```code snippet
EXPO_PUBLIC_API_URL=https://care4you-backend-685548494290.asia-southeast1.run.app/api
```

### 4. Run the App

Start the development server:

```Bash
npx expo start
```

- Download Expo Go on your Android or iOS device.
- Scan the QR code appearing in your terminal.

---

## ✨ Key Features

- Virtual Guest System: Users can browse and register for events immediately without an account. A unique guest\_ ID is generated locally to track their activity.
- The Conversion Deal: When a guest eventually signs up or logs in, all their previous event registrations are automatically migrated to their new permanent account.
- Dynamic Event Registration: Real-time slot tracking for both volunteers and participants, ensuring event organizers have accurate data.
- Role-Based Access: Specific workflows for Volunteers and Participants to ensure everyone finds the right way to help.

---

## 🛠️ Tech Stack & Structure

### Technologies

| Layer        | Technology                                            |
| :----------- | :---------------------------------------------------- |
| **Frontend** | React Native, Expo (Expo Go), Expo Router, TypeScript |
| **Backend**  | Node.js, Express (Hosted on Google Cloud)             |
| **Database** | PostgreSQL (Supabase)                                 |
| **Storage**  | AsyncStorage for local session persistence            |

### Project Directory

```text
├── frontend/             # Mobile Application (Focus of UI/UX)
│   ├── app/              # File-based routing (Expo Router)
│   ├── services/         # API & Auth Logic (Conversion Deal)
│   └── components/       # Reusable UI Elements
└── backend/              # SQL-based API Logic
    ├── models/           # Data migration & logic
    └── controllers/      # Auth & Registration management
```

---

## 👥 The Team

- **Team Name:** Hack4Fun
- **Team Lead:** Yi Jie Chong
- **Developer:** Tan Jay, Tey Yee Siang

---
