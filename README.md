# 🛡️ Care4Fun | Hack4Good 2026

**Care4Fun** is a community-driven platform built to bridge the gap between volunteers, participants, and impactful social events. Designed for the **Hack4Good** hackathon, this mobile application streamlines event discovery and registration with a seamless "Virtual Guest" system for immediate engagement.

### 👥 The Team

- **Team Lead:** Yi Jie Chong
- **Developer:** Tey Yee Siang

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
EXPO_PUBLIC_API_URL=[https://care4you-backend-685548494290.asia-southeast1.run.app/api](https://care4you-backend-685548494290.asia-southeast1.run.app/api)

```

### 4. Run the App

Start the development server:

```Bash
npx expo start
```

- Download Expo Go on your Android or iOS device.

- Scan the QR code appearing in your terminal.

---

### ✨ Key Features

- Virtual Guest System: Users can browse and register for events immediately without an account. A unique guest\_ ID is generated locally to track their activity.

- The Conversion Deal: When a guest eventually signs up or logs in, all their previous event registrations are automatically migrated to their new permanent account.

- Dynamic Event Registration: Real-time slot tracking for both volunteers and participants, ensuring event organizers have accurate data.

- Role-Based Access: Specific workflows for Volunteers and Participants to ensure everyone finds the right way to help.

---

### 🏗️ Project Structure

Development primarily focuses on the frontend directory for UI/UX enhancements while utilizing the hosted backend API.

```Plaintext
├── frontend/             # React Native (Expo) Mobile App
│   ├── app/              # File-based routing (Expo Router)
│   ├── services/         # API integration & Auth logic
│   ├── components/       # Reusable UI elements
└── backend/              # Node.js/Express API (Hosted on Google Cloud)
```

---

### 🛠️ Tech Stack

- Frontend: React Native, Expo, Expo Router, TypeScript.

- Backend: Node.js, Express.

- Database: PostgreSQL (Supabase).

- Storage: AsyncStorage for local session management.

---
