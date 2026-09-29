# STRING X — Developer Documentation

Welcome to the comprehensive developer documentation for **STRING X**.

STRING X is a high-energy, campus-focused social matchmaking application designed for university festivals and cultural connections (featuring the Navratri 2026 experience, live face verification, campus vibe matching, and partner countdown reveal).

---

## Technology Stack

- **Frontend Core:** React 19 (`react`, `react-dom`)
- **Language:** TypeScript 5.8+ (`typescript`, `tsx`)
- **Build & Dev Tooling:** Vite 8 (`vite`, `@vitejs/plugin-react`)
- **Styling & Design System:** Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`), Vanilla CSS tokens
- **Animations:** Motion (`motion/react`)
- **Computer Vision / Face Verification:** Pico.js local face detection cascade (`pico.ts`, `faceValidation.ts`)
- **Effects:** Canvas Confetti (`canvas-confetti`)
- **Icons:** Lucide React (`lucide-react`)
- **Backend & Database:** Supabase (`@supabase/supabase-js`)
  - **Auth:** Supabase Phone OTP Authentication
  - **Database:** Supabase PostgreSQL with Row Level Security (RLS)
  - **Storage:** Supabase Storage (`profile-photos` bucket)

---

## Main Product Flow

```mermaid
flowchart LR
    A[Screen 01: Landing] --> B[Screen 02: Phone Sign-Up & OTP]
    B --> C[Screens 03–11: Core Onboarding]
    C --> D[Face Verified Transition]
    D --> E[Screen 12: STRING X Home]
    E --> F[Screens 13–21: Navratri Registration]
    F --> G[Screen 22: Radar Scanner]
    G --> H[Screen 23: Countdown & Reveal]
    E -.-> I[Screen 24: Profile & Settings]
```

1. **Landing (`/`):** Full-bleed festival illustration, core branding, entry CTA.
2. **Phone Sign-Up (`/auth/phone`):** 10-digit phone entry, Supabase 6-digit OTP verification modal.
3. **Core Profile Onboarding (`/onboarding` Steps 0–8):**
   - Step 01: Name & Gender
   - Step 02: Campus & Hostel Selection
   - Step 03: Age Picker
   - Step 04: Festive Profile Photo Upload / Avatar Presets
   - Step 05: Height Ruler & Weight Dial
   - Step 06: Home State Selector
   - Step 07: College Year Cards
   - Step 08: Department & Course Selection
   - Step 09: Live Webcam Face Verification (Pico ML cascade model)
4. **Verification Celebration (`/onboarding/verified`):** 1.5s celebratory animation transition.
5. **STRING X Home (`/home`):** Campus events feed, live Navratri 2026 banner, profile link.
6. **Navratri Vibe Registration (`/events/navratri` Steps 9–17):**
   - Step 01: Partner Gender Preference
   - Step 02: Campus Interests
   - Step 03: Favourite Campus Evening Spot
   - Step 04: Navratri Excitement Level Slider
   - Step 05: Garba Skill Level Selector
   - Step 06: Navratri Vibes (up to 3)
   - Step 07: Personality Prompt 01 (Stay or Slay)
   - Step 08: Personality Prompt 02 (Energy & Chaos)
   - Step 09: Instagram Handle Input
7. **Radar Scanner (`/match/scanning`):** Procedural candidate signal generator and campus search radar.
8. **Countdown & Sneak Peek Reveal (`/match/countdown`):** Live days/hours/minutes countdown to partner reveal with sneak peek partner modal.
9. **Profile & Settings (`/profile`):** Campus status, profile card, notifications, privacy, and sign-out modal.

---

## Project Structure

```
string-x/
├── docs/                        # Complete technical documentation
├── public/                      # Static assets & Pico ML models (/models/facefinder)
├── src/
│   ├── app/                     # Application shell, router, and composite providers
│   ├── components/              # UI primitives, inputs, illustrations, and dev tools
│   │   ├── dev/                 # DevScreenRail (desktop 24-screen jump rail)
│   │   ├── events/              # Event discovery feeds and questionnaire layouts
│   │   ├── illustrations/       # Badges, SVG artwork, and logo components
│   │   ├── inputs/              # 20 specialized custom interactive inputs
│   │   ├── screens/             # Screen presentation adapters
│   │   └── ui/                  # DeviceFrame, HeaderNav, PrimaryButton
│   ├── constants/               # Route mappings and static metadata
│   ├── data/                    # Mock data, preset avatars, and event questions
│   ├── features/                # Domain-specific contexts and hooks (auth, onboarding)
│   ├── hooks/                   # Public hooks (useAuth, useOnboarding)
│   ├── lib/                     # Supabase client singleton, env config, and DB types
│   ├── pages/                   # Isolated page components & individual step views
│   ├── services/                # Business logic & Supabase data access layer
│   ├── types/                   # Centralized domain and API type definitions
│   └── utils/                   # Pico face detector and geometry validation
├── ARCHITECTURE_REFACTOR_PLAN.md   # Initial refactor plan
├── ARCHITECTURE_REFACTOR_REPORT.md # Refactor migration report
├── CONTRIBUTING.md              # Engineering guidelines and pull request standards
└── README.md                    # Root project overview and quickstart
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Configure environment (copy template)
cp .env.example .env.local

# 3. Start local development server
npm run dev

# 4. Run typecheck / lint
npm run lint

# 5. Build for production
npm run build
```

---

## Documentation Index

| Topic | Document | Description |
|---|---|---|
| **Architecture** | [architecture.md](architecture.md) | System design, uni-directional data flow, and layers |
| **Database** | [database.md](database.md) | PostgreSQL schema, tables, types, and RLS policies |
| **Authentication** | [authentication.md](authentication.md) | Supabase Auth, phone OTP flow, and session management |
| **Routing** | [routing.md](routing.md) | Route map, DevScreenRail indexing, and navigation logic |
| **Onboarding** | [onboarding.md](onboarding.md) | Detailed specs for Screens 03–11 and 13–21 |
| **Matchmaking** | [matchmaking.md](matchmaking.md) | Vibe scoring, partner preferences, and countdown reveal |
| **Design System** | [design.md](design.md) | Color palette, typography, shadows, animations, and spacing |
| **Components** | [components.md](components.md) | Catalogue of UI primitives and custom inputs |
| **Services** | [services.md](services.md) | Service layer API specifications and error handling |
| **State Management**| [state-management.md](state-management.md) | AuthContext, OnboardingContext, and local UI state |
| **Storage** | [storage.md](storage.md) | Supabase Storage bucket setup, paths, and photo handling |
| **Security** | [security.md](security.md) | RLS, credential isolation, and input sanitization |
| **Environment** | [environment.md](environment.md) | Environment variable definitions and fallbacks |
| **Development** | [development.md](development.md) | Local development workflow, scripts, and debugging |
| **Deployment** | [deployment.md](deployment.md) | Production builds, preview hosting, and Cloud Run |
| **Testing** | [testing.md](testing.md) | Quality assurance, browser testing, and checklists |
| **Troubleshooting** | [troubleshooting.md](troubleshooting.md) | Common errors, root causes, and resolutions |
| **Internal API** | [api.md](api.md) | Service layer function signatures and payloads |
| **Decisions (ADRs)**| [decisions.md](decisions.md) | Architecture Decision Records for key choices |
| **Changelog** | [changelog.md](changelog.md) | History of major architectural milestones |
| **Audit** | [documentation-audit.md](documentation-audit.md) | Coverage, verified paths, and known technical debt |
