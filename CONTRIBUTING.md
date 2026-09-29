# Contributing to STRING X

Thank you for contributing to STRING X! To maintain high code quality, strict layer isolation, and visual design integrity, all contributors must follow these guidelines.

---

## 1. Branch Strategy

- **`main`**: Production-ready code. Must always compile cleanly (`npm run lint` and `npm run build` must pass).
- **`feature/<feature-name>`**: For new features (e.g. `feature/spotify-vibe-sync`).
- **`refactor/<domain>`**: For architectural refactoring (e.g. `refactor/event-feed`).
- **`fix/<bug-name>`**: For bug fixes (e.g. `fix/otp-timer-reset`).

---

## 2. Architecture & Layer Conventions

STRING X strictly enforces uni-directional layered dependencies:
$$\text{Pages / Components} \longrightarrow \text{Domain Hooks} \longrightarrow \text{Service Layer} \longrightarrow \text{Supabase Client}$$

1. **Pages & Step Components (`src/pages/`):**
   - Must **NEVER** import `@supabase/supabase-js`.
   - Must **NEVER** write raw database queries.
   - Must communicate with backend data strictly through domain hooks (`useAuth()`, `useOnboarding()`) or services.
2. **Components (`src/components/`):**
   - Reusable UI primitives and inputs only.
   - Keep components focused and single-responsibility.
   - Do not invent new colors or random Tailwind classes that clash with the neo-brutalist theme. Use existing tokens defined in `src/index.css`.
3. **Services (`src/services/`):**
   - Must return a typed `ServiceResult<T>` (`{ data, error }`).
   - Never throw unhandled exceptions to the UI.
   - Handle offline/fallback states gracefully.

---

## 3. Naming Conventions

- **React Components:** PascalCase (e.g. `Step01NameGender.tsx`, `HeaderNav.tsx`).
- **Hooks:** camelCase with `use` prefix (e.g. `useAuth.ts`, `useAppNavigation.ts`).
- **Services:** camelCase with `Service` suffix (e.g. `profileService.ts`, `authService.ts`).
- **Type Files:** camelCase (e.g. `user.ts`, `navigation.ts`).
- **Constants:** UPPER_SNAKE_CASE (e.g. `DEV_SCREEN_MAP`, `INITIAL_USER_PROFILE`).

---

## 4. Database & Supabase Migration Rules

1. **Never commit secret keys:** Never include `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
2. **Always update TypeScript types:** When adding or modifying a database column, update `Database` in `src/lib/supabase/types.ts` and the mapper functions in `src/services/profileService.ts`.
3. **Maintain RLS Policies:** Every new PostgreSQL table must enable RLS and have explicit authenticated policies documented in `docs/database.md`.

---

## 5. Pull Request Expectations

Before opening a pull request, run the following verification checks:

```bash
# 1. Type checking (Must exit with code 0)
npm run lint

# 2. Production build check (Must exit with code 0)
npm run build
```

Your PR description must include:
- Summary of changes and why they were made.
- Affected screens (e.g. Screen 03, Screen 12).
- Verification steps tested locally.
- Confirmation that no design system or styling regressions occurred.

---

## 6. Documentation Requirements

Whenever adding a feature, service, or database table:
- Update the relevant document in `docs/` (`docs/services.md`, `docs/database.md`, etc.).
- Add an entry to `docs/changelog.md`.
- Keep the component catalogue in `docs/components.md` up to date.
