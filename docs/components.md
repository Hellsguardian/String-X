# STRING X — Component Catalogue

> **Version:** 3.0.0  
> **Status:** APPROVED ARCHITECTURAL SPECIFICATION (APPROVED UI/UX BASELINE)  
> **Location:** `src/components/`  

---

## 1. UI Primitives (`src/components/ui/`)

### `DeviceFrame.tsx`
- **File:** `src/components/ui/DeviceFrame.tsx`
- **Purpose:** Outer viewport shell that renders a native 100dvh container on mobile and a framed smartphone preview on desktop with festive background annotations.
- **Props:**
  - `children: React.ReactNode`
  - `onQuickFill?: () => void`
  - `onJumpToCombinedScreen?: () => void`
- **Used In:** `AppShell.tsx`.

### `HeaderNav.tsx`
- **File:** `src/components/ui/HeaderNav.tsx`
- **Purpose:** Top app navigation header featuring back button, centered STRING X logo, step count counter pill, and animated gradient progress bar.
- **Props:**
  - `currentStep?: number` (Default: 1)
  - `totalSteps?: number` (Default: 22)
  - `onBack?: () => void`
  - `onExit?: () => void`
  - `showProgress?: boolean` (Default: true)
- **Used In:** `PhoneNumberSignUpScreen.tsx`, `OnboardingFlowContainer.tsx`.

### `PrimaryButton.tsx`
- **File:** `src/components/ui/PrimaryButton.tsx`
- **Purpose:** High-contrast, tactile neo-brutalist action button with arrow icon and mechanical active-press feedback.
- **Props:**
  - `label: string`
  - `onClick: () => void`
  - `disabled?: boolean`
  - `variant?: 'primary' | 'secondary' | 'plum'`
  - `icon?: boolean`
  - `className?: string`

---

## 2. Interactive Input Components (`src/components/inputs/`)

| Component | File Path | Purpose | Key Props |
|---|---|---|---|
| `AgeSelector` | `src/components/inputs/AgeSelector.tsx` | Drag and tap selector for student age (15–28) | `value: number`, `onChange: (val) => void` |
| `CampusHostelSelector` | `src/components/inputs/CampusHostelSelector.tsx` | University search and campus hostel selection | `gender: string`, `university: string`, `hostel: string`, `onSelectUniversity`, `onSelectHostel` |
| `CollegeYearCards` | `src/components/inputs/CollegeYearCards.tsx` | Academic year cards (1st to PG) with status badges | `value: string`, `onChange: (year) => void` |
| `CombinedHeightWeight`| `src/components/inputs/CombinedHeightWeight.tsx` | Synchronized dual widget with Height Ruler + Weight Dial | `heightCm: number`, `weightKg: number`, `onUpdateHeight`, `onUpdateWeight` |
| `CourseSelector` | `src/components/inputs/CourseSelector.tsx` | Department selection cards with festive icons | `collegeYear: string`, `value: string`, `onChange: (course) => void` |
| `EveningSpotSelector` | `src/components/inputs/EveningSpotSelector.tsx` | Grid cards of Parul University campus hangout spots | `value?: string`, `onSelect: (spot) => void` |
| `ExcitementSlider` | `src/components/inputs/ExcitementSlider.tsx` | Continuous slider tracking festival anticipation (0–100) | `value: number`, `onChange: (val) => void` |
| `FaceVerificationCamera`| `src/components/inputs/FaceVerificationCamera.tsx` | Live camera preview with Pico face detection, oval tracker, GPS location capture timing, and auto-capture | `initialPhoto?: string`, `isConfirmed?: boolean`, `onCapture: (url, coords) => void`, `onRetake: () => void` |
| `GarbaEnergySelector` | `src/components/inputs/GarbaEnergySelector.tsx` | Dancing energy level selector | `value: string`, `onChange: (energy) => void` |
| `GarbaLevelSelector` | `src/components/inputs/GarbaLevelSelector.tsx` | 4-tier Garba proficiency cards (Zero to Beast) | `value: string`, `onChange: (level, title) => void` |
| `GenderSelector` | `src/components/inputs/GenderSelector.tsx` | Segmented gender identity pills | `selectedGender: string`, `onSelect: (gender) => void` |
| `HeightRuler` | `src/components/inputs/HeightRuler.tsx` | Drag-based vertical ruler measuring height in cm | `value: number`, `onChange: (h) => void` |
| `HorizontalHeightPicker`| `src/components/inputs/HorizontalHeightPicker.tsx` | Alternative horizontal scroll height picker | `value: number`, `onChange: (h) => void` |
| `InterestChips` | `src/components/inputs/InterestChips.tsx` | Multi-select chips for campus hobbies (up to 6) | `selected: string[]`, `onChange: (chips) => void` |
| `NavratriExcitementSelector`| `src/components/inputs/NavratriExcitementSelector.tsx`| Festival highlights selection cards (max 3) | `selected: string[]`, `maxSelection?: number`, `onChange: (vibes) => void` |
| `PhotoPicker` | `src/components/inputs/PhotoPicker.tsx` | Dedicated main DP photo upload with avatar presets | `value: string`, `additionalPhotos?: string[]`, `onChange: (url, list) => void` |
| `PromptCardSelector` | `src/components/inputs/PromptCardSelector.tsx` | Multiple-choice cards for personality questions | `options: any[]`, `selected: string`, `onSelect: (text) => void` |
| `StateSelectorModal` | `src/components/inputs/StateSelectorModal.tsx` | Indian States and UTs modal picker with search filter | `value: string`, `onChange: (state) => void` |
| `WeightDialCircle` | `src/components/inputs/WeightDialCircle.tsx` | Circular rotary weight dial with inertial drag feedback | `value: number`, `onChange: (kg) => void` |
| `WeightSelector` | `src/components/inputs/WeightSelector.tsx` | Linear weight slider | `value: number`, `onChange: (kg) => void` |

---

## 3. Screen Views & Modals

### `NotificationPanel` (Page 12)
- **Location:** Inside `HomePage.tsx` header.
- **Behavior:** Renders an animated slide-over panel.
- **Initial State:** Initial notification count is **0** with an empty state ("You're all caught up! ✨") and zero demo/fake notifications.

### `MatchRevealModal` (Page 23)
- **Location:** Rendered inside `CountdownPage.tsx`.
- **Behavior:** Revealed when match pairing is active and effectively revealed. Displays partner's photo, name, course, hostel, compatibility score, shared vibes, and verified Instagram handle.

---

## 4. Illustrations & Badges (`src/components/illustrations/`)

### `GarbaIllustrations.tsx`
- **`PlayfulBadge`**: Angled, bold sticker badge (colors: `'pink'`, `'yellow'`, `'purple'`, `'teal'`; tilts: `'left'`, `'right'`, `'none'`).
- **`StringXLogo`**: Official brand SVG wordmark with signature yellow string curve and sizes `'sm'`, `'md'`, `'lg'`.
- **`GarbaCoupleIllustration`**: High-detail SVG artwork of two dancers with dandiyas.
- **`DandiyaSticks`**: Decorative crossed dandiyas.

---

## 5. Developer Tools (`src/components/dev/`)

### `DevScreenRail.tsx`
- **File:** `src/components/dev/DevScreenRail.tsx`
- **Purpose:** Fixed desktop sidebar allowing engineering and design QA to jump directly to any of the 24 application screens with a single click.
- **Features:** Left/right side docking switcher, active step highlight, and hover tooltip displaying full screen titles.
- **Props:**
  - `currentScreen: ScreenState`
  - `onboardingStep: number`
  - `onNavigate: (stepIndex: number) => void`
