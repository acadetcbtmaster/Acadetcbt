# Project Memory & Architecture Context

This document captures the architecture, past incidents, stability rules, and operational guidelines established over recent iterations for the **AI CBT Simulator** platform.

---

## 1. Core Architecture Overview

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide icons, Framer Motion (`motion/react`).
- **Backend**: Express server running on port `3000` via `server.ts` (proxied in production and dev).
- **Database & Auth**: Firebase Authentication and Cloud Firestore.
- **State & Caching Layer**: `StorageService` with in-memory map cache (`memoryCache`), debounced local storage writes, and granular change events.

---

## 2. Critical Lessons Learned & Stability Directives (Last 48 Hours)

### A. DO NOT Attach Mass Real-Time Firestore Collection Listeners
- **Issue**: Attaching dozens of concurrent `onSnapshot` listeners to large collections (questions, courses, universities, materials, etc.) at application startup caused memory overload and CPU lockups on mobile Chrome ("Chrome keeps stopping").
- **Rule**: Keep academic catalog data in local storage / seed caches with on-demand synchronization. Never attach global multi-collection snapshot listeners in `StorageService.initRealtimeListeners()`. Only attach scoped single-document listeners where strictly necessary (e.g. current user profile, active live contest).

### B. Prevention of Circular Reference Serialization
- **Issue**: Firebase Auth user objects contain cyclic internal pointers (`Y2 -> Ka -> src`). Passing these directly to standard `JSON.stringify` crashed the app with `TypeError: Converting circular structure to JSON`.
- **Rule**: Always use `safeStringify` / `cleanForStorage` from `src/lib/safeJson.ts` when serializing objects that may contain DOM or SDK references.

### C. Debounced Storage Persistence & Granular Re-renders
- **Issue**: Triggering full `syncAllData()` upon every storage event caused cascade re-rendering of all high-level components.
- **Rule**: `StorageService.setItem()` updates `memoryCache` instantly and debounces `localStorage.setItem` and custom `cbt_storage_change` events. `App.tsx` inspects the specific changed key before triggering selective component updates.

### D. Firestore Security Rules Harmony
- **Issue**: Requiring `isAuthenticated()` on public catalog collections caused permission-denied errors for landing page visitors and pre-login browsing.
- **Rule**: Keep public study catalogs (`questions`, `universities`, `courses`, `materials`, `tutorial_videos`, `community_announcements`) with `allow read: if true;`, while keeping sensitive collections (`users`, `results`, `payments`, `admin_configs`) protected with `isAuthenticated()` and role-based checks.

---

## 3. Key Services & Files

- `src/services/storage.ts`: Core data abstraction layer, in-memory caching, user session management, and local fallback seeds.
- `src/lib/safeJson.ts`: Robust cycle-breaker and serializer protecting against circular data crashes.
- `src/lib/firebase.ts`: Firebase client initialization (Auth, Firestore).
- `firestore.rules`: Security rules for Firestore collections.
- `server.ts`: Express API endpoints for Gemini AI question generation, Paystack webhook/verifications, and MenCore services.
- `src/App.tsx`: Root application coordinator managing routing, modal visibility, and authentication states.
