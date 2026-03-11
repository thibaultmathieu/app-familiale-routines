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
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run sync-assets  # Copy images/music from source folders → public/, regenerate manifests
```

No test suite is configured. TypeScript is the primary correctness check (`npx tsc --noEmit`).

## Architecture

**Stack**: React 18, TypeScript, Vite 6, Tailwind CSS 3, PWA (vite-plugin-pwa / Workbox)

**State management**: Single hook `src/hooks/useAppState.ts` — all app state lives here, persisted to `localStorage` via `useLocalStorage`. No external state library.

**Screens** (rendered by `src/App.tsx` based on `currentScreen`):
- `home` → `HomeScreen` — routine launcher + custom routine form
- `routine` → `ActiveRoutineScreen` — split-screen (2 children side by side), sounds, music, timers
- `parent` → `ParentPanel` — reset/stop controls, timer launcher, gallery access
- `gallery` → `GalleryScreen` — per-child reward image collection

**Asset pipeline**: Raw images live in `images_rewards/Evangeline/` and `images_rewards/Noah/` (not committed). `scripts/sync-assets.js` copies and renames them to `public/rewards/{child}/` and generates two TypeScript manifests:
- `src/data/rewardManifest.ts` — per-child image arrays (auto-generated, do not edit)
- `src/data/musicManifest.ts` — music track list (auto-generated, do not edit)

Run `npm run sync-assets` after adding/removing source images or music files.

**Reward system**: Each child has their own pool. `unlockReward()` in `useAppState` picks a random unlocked image; when all are unlocked, it resets (`unlockedImages = []`, increments `completedCycles`) and starts a new cycle.

**Sounds**: `src/hooks/useSound.ts` uses Web Audio API oscillators — no audio files needed. Three sounds: task complete (ding), routine complete (arpège), timer end (two tones).

**Music**: `src/hooks/useMusic.ts` uses HTML5 Audio. Triggered only when **both** children complete the `evening` routine. One random track plays looped at volume 0.3.

**Timer**: `ActiveTimer` objects stored in state with `startedAt` ISO timestamp — surviving page reloads. `useTimerTick` recalculates remaining time from elapsed ms. Timers are launched from `ParentPanel` and displayed in `ActiveRoutineScreen` as SVG ring animations.

**Key types** (`src/types.ts`): `Child` (has `unlockedImages`, `completedCycles`), `ActiveTimer` (has `childIds`, `durationSeconds`, `startedAt`), `AppState` (has `galleryReturnScreen` to know where gallery should return to).

**Gallery navigation**: `galleryReturnScreen` in state (`'routine'` or `'parent'`) controls where the back button goes. Set it before calling `setCurrentScreen('gallery')`.

**V1→V2 migration**: `migrateState()` in `useAppState` detects old emoji-based reward IDs (`r01`–`r20`) and resets `unlockedImages` automatically on first load.
