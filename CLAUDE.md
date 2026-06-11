# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git workflow

After every meaningful change (new feature, bug fix, refactor), commit and push immediately:

```bash
git add <specific files>
git commit -m "feat|fix|refactor|docs: short description"
git push
```

Use conventional commit prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`. Never batch unrelated changes into a single commit. Always push after committing so GitHub stays up to date.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173/app-familiale-routines/)
npm run build        # TypeScript check + Vite production build
npm test             # Vitest characterization suite (useAppState: migrations, rewards, lifecycle)
npm run sync-assets  # Copy images/music from source folders → public/, regenerate manifests
```

The Vitest suite in `src/hooks/useAppState.test.ts` is the contract for state logic — run it after any change to `useAppState.ts`, `rewardImages.ts` or the migration chain. `npm run build` (tsc) is the second gate.

## Architecture

**Stack**: React 18, TypeScript, Vite 6, Tailwind CSS 3, PWA (vite-plugin-pwa / Workbox), Vitest

**State management**: Single hook `src/hooks/useAppState.ts` — all app state lives here, persisted to `localStorage` via `useLocalStorage`. No external state library.

**Design system**: warm tokens in `tailwind.config.js` (`warm`, `ink`, `line`, `success`, `honey`, `danger`, `night` + `shadow-card/raised/overlay` + `z-overlay/modal/toast`), brand fonts self-hosted via `@fontsource-variable/fredoka` (display) and `@fontsource-variable/nunito` (body), UI primitives in `src/components/ui/` (Card, Button, Pill, Badge, Overlay, ScreenHeader, IconButton, TextInput, FieldLabel). Child identity colors live in `src/theme.ts` (`COLOR_PALETTE`, `tint()` for translucent surfaces, `childTextColor()` for AA-readable colored text). Never concatenate hex + alpha (`color + '15'`) — use `tint()`.

**Screens** (rendered by `src/App.tsx` based on `currentScreen`):
- `home` → `HomeScreen` — routine launcher + custom routine form + parental gate (long-press gear → math challenge in `ParentGate.tsx`)
- `routine` → `ActiveRoutineScreen` — split-screen (2 children side by side), sounds, music, timers
- `parent` → `ParentPanel` — reset/stop controls, timer launcher, sanctions, universe access
- `gallery` → `GalleryScreen` — per-child reward image collection (universe-aware)
- `universe-select` → `UniverseSelectScreen` — per-child reward universe choice (parent side)

**Universe system (schema V6)**: each child has a `universeId` pointing to a pool key in `rewardManifest.ts`. Universe metadata lives in `src/data/universes.ts` (active + `comingSoon` teasers). Pool resolution: `getRewardImagesForChildEntry()` in `src/data/rewardImages.ts` (falls back to legacy index round-robin). Per-universe progress = intersection `unlockedImages ∩ pool`, so switching universes loses nothing; cycle reset only clears the current universe's ids. To add a universe: drop an image folder in `images_rewards/<Name>/`, run `npm run sync-assets`, add an entry in `universes.ts` (id = lowercased folder name; legacy aliases map `Evangeline→evangelina`, `Noah→noah`).

**Guard rails**: custom routines created from Home are `ephemeral: true` and purged on "Nouvelle journée"/stop (editing one in the routine editor makes it permanent). Caps: `MAX_ROUTINE_TEMPLATES` (30), `MAX_ACTIVE_TIMERS` (6). Onboarding drafts persist in localStorage (`routines-onboarding-draft`/`-step`) and are cleared on completion.

**Asset pipeline**: Raw images live in `images_rewards/Evangeline/` and `images_rewards/Noah/` (not committed). `scripts/sync-assets.js` copies and renames them to `public/rewards/{child}/` and generates two TypeScript manifests:
- `src/data/rewardManifest.ts` — per-child image arrays (auto-generated, do not edit)
- `src/data/musicManifest.ts` — music track list (auto-generated, do not edit)

Run `npm run sync-assets` after adding/removing source images or music files.

**Reward system**: Each child draws from their universe's pool. `unlockReward()` in `useAppState` computes the pick BEFORE `setState` (deterministic return value) and picks a random not-yet-unlocked image from the pool; when the pool is exhausted, it clears only that pool's ids from `unlockedImages` and increments `completedCycles`.

**Sounds**: `src/hooks/useSound.ts` uses Web Audio API oscillators — no audio files needed. Three sounds: task complete (ding), routine complete (arpège), timer end (two tones).

**Music**: `src/hooks/useMusic.ts` uses HTML5 Audio. Triggered only when **both** children complete the `evening` routine. One random track plays looped at volume 0.3.

**Timer**: `ActiveTimer` objects stored in state with `startedAt` ISO timestamp — surviving page reloads. `useTimerTick` recalculates remaining time from elapsed ms. Timers are launched from `ParentPanel` and displayed in `ActiveRoutineScreen` as SVG ring animations.

**Key types** (`src/types.ts`): `Child` (has `unlockedImages`, `completedCycles`), `ActiveTimer` (has `childIds`, `durationSeconds`, `startedAt`), `AppState` (has `galleryReturnScreen` to know where gallery should return to).

**Gallery navigation**: `galleryReturnScreen` in state (`'routine'` or `'parent'`) controls where the back button goes. Set it before calling `setCurrentScreen('gallery')`.

**Migrations**: `migrateState()` in `useAppState` chains V1→V6 (V2 reward-id reset, V3 scheduledDays, V5 onboarding flag, V6 universeId assignment). Bump `CURRENT_SCHEMA_VERSION` and add a guarded block + tests for any persisted-shape change.
