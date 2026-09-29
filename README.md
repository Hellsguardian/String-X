# STRING X — Campus Cultural Matchmaking Platform

STRING X is a high-energy, university campus social & matchmaking web application (featuring the Navratri 2026 festival pairing experience, live client-side face verification, interactive physical vibe sliders, and a synchronized partner reveal countdown).

Built with **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS v4**, and **Supabase**.

---

## Key Features

- **Neo-Brutalist Visual Design:** High-contrast borders, solid offset drop-shadows, signature glowing pink connecting string, and responsive mobile viewport.
- **Client-Side Face Verification:** Local Pico.js machine-learning cascade model (`/models/facefinder`) verifying live selfie authenticity in 1.25s without cloud latency.
- **Dual-Domain Onboarding:**
  - *Core Student Profile* (Screens 03–11): Identity, campus, hostel, age, photos, height ruler, weight dial, home state, year, course, and face verification.
  - *Festival Vibe Registration* (Screens 13–21): Partner preferences, garba energy, evening spots, personality prompts, and Instagram connection.
- **Campus Radar Scanner:** Procedural candidate signal generation with real-time rotating status telemetry.
- **Synchronized Partner Reveal:** Days/hours/minutes countdown ticker with sneak-peek match card reveal.
- **Developer Screen Rail:** Desktop sidebar tool allowing one-click navigation across all 24 application screens during development and QA.

---

## Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom CSS Tokens |
| **Animation** | [Motion](https://motion.dev/) (Framer Motion v12) |
| **Icons & Effects** | [Lucide React](https://lucide.dev/) & [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) |
| **Computer Vision** | [Pico.js](https://github.com/nenadmarkus/picojs) local face cascade detector |
| **Backend** | [Supabase](https://supabase.com/) (Auth, PostgreSQL, Storage) |

---

## Getting Started

### 1. Prerequisites
- **Node.js** v18.0.0 or higher (v20+ recommended).
- **npm** v9.0.0 or higher.

### 2. Installation
```bash
# Clone the repository
git clone <repo-url> string-x
cd string-x

# Install dependencies (use --legacy-peer-deps for Vite 8 / Tailwind v4 resolution)
npm install --legacy-peer-deps
```

### 3. Environment Variables
Copy the template file to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your Supabase credentials:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```
*(Note: If omitted, STRING X automatically operates in local mock fallback mode using browser storage.)*

### 4. Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Typecheck & Build
```bash
# Typecheck
npm run lint

# Production build
npm run build
```

---

## Architecture Overview

STRING X enforces strict uni-directional layered dependencies:
$$\text{UI Layer (Pages / Steps)} \longrightarrow \text{Domain Hooks} \longrightarrow \text{Service Layer} \longrightarrow \text{Supabase Client} \longrightarrow \text{PostgreSQL / Storage}$$

UI components never contain database queries or SDK calls. All data mutations pass through domain services returning strongly-typed `ServiceResult<T>` records.

---

## Developer Documentation Index

Comprehensive technical documentation is located in the [`docs/`](docs/) directory:

- 🏗️ **Architecture:** [docs/architecture.md](docs/architecture.md) — Layer responsibilities, dependency rules, and data flows.
- 🗄️ **Database:** [docs/database.md](docs/database.md) — PostgreSQL schemas, tables, and Row Level Security (RLS) policies.
- 🔐 **Authentication:** [docs/authentication.md](docs/authentication.md) — Supabase Phone OTP state machine and session restoration.
- 🗺️ **Routing:** [docs/routing.md](docs/routing.md) — Route catalog, semantic keys, and `DevScreenRail` index mapping.
- 📝 **Onboarding:** [docs/onboarding.md](docs/onboarding.md) — Deep dive into all 18 registration steps.
- 💃 **Matchmaking:** [docs/matchmaking.md](docs/matchmaking.md) — Compatibility scoring vectors, radar scanner, and countdown reveal.
- 🎨 **Design System:** [docs/design.md](docs/design.md) — Exact HEX color palette, typography, borders, and shadows.
- 🧩 **Components:** [docs/components.md](docs/components.md) — Catalogue of UI primitives, interactive inputs, and illustrations.
- ⚙️ **Services:** [docs/services.md](docs/services.md) — Business logic layer and data access functions.
- 🔄 **State Management:** [docs/state-management.md](docs/state-management.md) — AuthContext, OnboardingContext, and scope rules.
- 📦 **Storage:** [docs/storage.md](docs/storage.md) — Supabase Storage buckets, photo upload paths, and policies.
- 🛡️ **Security:** [docs/security.md](docs/security.md) — RLS policies, input sanitization, and secret handling.
- 🌐 **Environment:** [docs/environment.md](docs/environment.md) — Vite environment variable definitions and `.env.local`.
- 💻 **Development:** [docs/development.md](docs/development.md) — Scripts, shortcuts (QuickFill), and local debugging.
- 🚀 **Deployment:** [docs/deployment.md](docs/deployment.md) — Production build, SPA rewrites, and CORS configuration.
- 🧪 **Testing:** [docs/testing.md](docs/testing.md) — Test matrix, type verification, and mobile testing guide.
- 🩺 **Troubleshooting:** [docs/troubleshooting.md](docs/troubleshooting.md) — Symptoms, root causes, and verified fixes.
- 📡 **Internal API:** [docs/api.md](docs/api.md) — Service layer function signatures and types.
- 📋 **ADRs:** [docs/decisions.md](docs/decisions.md) — Architecture Decision Records for key architectural choices.
- 📜 **Changelog:** [docs/changelog.md](docs/changelog.md) — Major architectural updates and release history.
- 🤝 **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md) — Pull request guidelines and engineering standards.

---

## License

Private repository. Copyright © 2026 STRING X. All rights reserved.
