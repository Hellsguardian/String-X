# STRING X — Local Development Guide

## 1. Prerequisites

- **Node.js:** v18.0.0 or higher (v20+ recommended).
- **Package Manager:** npm v9+ or higher.
- **Modern Browser:** Chrome, Edge, Safari, or Firefox with WebRTC camera access permissions.

---

## 2. Installation & Quick Start

```bash
# 1. Clone repository
git clone <repo-url> string-x
cd string-x

# 2. Install dependencies (use legacy-peer-deps to avoid esbuild version resolution conflicts)
npm install --legacy-peer-deps

# 3. Configure local environment
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

The application will start on `http://localhost:3000/`.

---

## 3. Available npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite --port=3000 --host=0.0.0.0` | Starts local HMR dev server on port 3000 with network binding |
| `build` | `vite build` | Compiles TypeScript and builds production assets into `dist/` |
| `preview` | `vite preview` | Serves the production build locally for verification |
| `lint` | `tsc --noEmit` | Runs strict TypeScript compiler check with zero bundle output |
| `clean` | `rm -rf dist server.js` | Purges build artifacts |

---

## 4. Developer Productivity Features

### 4.1 Quick-Fill Shortcut
On the desktop viewport frame, clicking **"Quick Fill"** populates the user profile with complete demo data (Aanya Sharma, 2nd Year B.Des, Parul University, height, weight, garba vibes, and face verified photo) to test downstream screens without retyping.

### 4.2 Jump to Combined Screen
Clicking **"Jump to Combined Screen"** triggers Quick-Fill and immediately navigates to Screen 07 (Combined Height & Weight).

### 4.3 Desktop DevScreenRail (`src/components/dev/DevScreenRail.tsx`)
On desktop monitors ($\ge 1280px$), a vertical navigation rail is docked on the right side of the phone frame:
- Displays buttons **01 through 24**.
- Clicking any number instantly routes to that exact screen.
- Hovering over a button displays a tooltip with the screen's full title.
- Clicking the arrow icon at the top of the rail toggles its docking position between the **left** and **right** side of the canvas.

---

## 5. Local Supabase Development

To connect a local Supabase CLI instance:
1. Start Supabase locally:
   ```bash
   npx supabase start
   ```
2. Copy the output API URL and anon key into `.env.local`:
   ```bash
   VITE_SUPABASE_URL="http://127.0.0.1:54321"
   VITE_SUPABASE_ANON_KEY="<local-anon-key>"
   ```
3. Run migrations or apply schema from `docs/database.md`.
