# 🛡️ Care4Fun | Hack4Good 2026 | Team: Hack4Fun

**Care4Fun** is a community-driven platform built to bridge the gap between volunteers, participants, and impactful social events. Designed for the **Hack4Good** hackathon, this mobile application streamlines event discovery and registration with a seamless "Virtual Guest" system for immediate engagement.

---

<!--
### ⚠️ The Problem

**Problem Statement: "How might we reduce friction in activity sign-ups for both individuals and caregivers, while reducing manual effort for staff in managing and consolidating registration data?"**

Traditional registration flows often lose users at the "Sign Up" wall. Meanwhile, staff struggle with fragmented data from various sources.

### ✅ Our Solution: The "Frictionless" Workflow

We solve this by allowing users to act immediately and authenticate later.

1. **Virtual Guest System:** Users join events instantly using locally generated unique IDs.
2. **The Conversion Deal:** An automated backend "handover" that migrates guest data to permanent accounts upon registration, eliminating manual data consolidation for staff. -->

### 🌍 The Problem

**Problem Statement: "How might we reduce friction in activity sign-ups for both individuals and caregivers, while reducing manual effort for staff in managing and consolidating registration data?"**

- 👵 Elderly users often struggle with account creation before taking action
- 🧑‍⚕️ Caregivers need fast, low-friction registration without technical barriers
- 🧑‍💼 Staff face fragmented registration data and time-consuming manual consolidation

---

### 💡 Our Solution: Frictionless Participation & Management

Care4Fun reduces friction at both the user and staff level by removing unnecessary steps at the point of action, while ensuring data remains structured and manageable.

### 🔑 Core Principle

Lower the barrier to act — without increasing backend complexity.

---

### 🧩 Solution Breakdown by User Group

#### 👤 For Participants & Caregivers

Reduce friction at the point of action

- ⚡ Instant Guest Registration
  - Users can browse and register for activities without creating an account
  - Ideal for elderly users and first-time users

- 📅 Simple Monthly View
  - Clear, accessible overview of upcoming activities

- 🔄 Automatic Account Conversion
  - When a guest signs up or logs in, all previously registered activities are seamlessly transferred
  - No re-registration, no confusion

Impact:<br>
Lower drop-off rates, higher participation, and a more inclusive experience for elderly users.

#### 🧑‍💼 For Staff & Organisers

Reduce manual work and data fragmentation

- 📝 Centralised Event Management
  - Create and manage events from a single platform

- 📊 Unified Registration Tracking
  - Guest and registered users are consolidated automatically

- 📤 CSV Export
  - One-click export of clean, structured registration data

  - Eliminates manual merging from multiple sign-up channels

- ⏱️ Real-Time Insights
  - Track participant and volunteer slots accurately

Impact:<br>
Less administrative overhead, cleaner data, and more time spent on community impact instead of paperwork.

🧠 Why This Matters

Instead of forcing users to adapt to the system, Care4Fun adapts to user behaviour, while still giving staff clean, actionable data.

---

### 🚀 Getting Started

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Clone the Repository

```md
git clone https://github.com/Hack4Funnn/care4you
cd care4fun
```

### 3. Installation

Install the dependencies for the frontend:

```bash
cd frontend
npm install
```

### 4. Environment Configuration

Create a .env file in the root of your frontend directory and add your hosted backend URL:

```code snippet
EXPO_PUBLIC_API_URL=https://care4you-backend-685548494290.asia-southeast1.run.app/api
```

### 5. Run the App

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

### 🛠️ Tech Stack & Structure

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

### 👥 The Team

- **Team Name:** Hack4Fun
- **Team Lead:** Yi Jie Chong
- **Developer:** Tan Jay, Tey Yee Siang

---
