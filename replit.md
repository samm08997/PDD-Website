# CramAI

AI-powered flashcard generator for college students — paste lecture notes and get smart Q&A flashcards instantly.

## Run & Operate

- `pnpm --filter @workspace/cram-ai run dev` — run the Expo mobile app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec (fix lib/api-zod/src/index.ts afterward — see Gotchas)

## Stack

- **Frontend:** Expo (React Native) with Expo Router, react-native-reanimated, TanStack Query
- **Backend:** Express 5 + TypeScript (Node.js 24)
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth via @supabase/supabase-js)
- **AI:** Google Gemini 2.0 Flash (`@google/generative-ai`)
- **Styling:** React Native StyleSheet, expo-linear-gradient, dark academic theme
- **API codegen:** Orval (from OpenAPI spec)

## Where things live

- `artifacts/cram-ai/` — Expo mobile app
  - `app/_layout.tsx` — root layout with providers (AuthProvider, QueryClient)
  - `app/index.tsx` — auth redirect (checks Supabase session)
  - `app/(auth)/login.tsx` — login + signup screen
  - `app/(app)/home.tsx` — deck dashboard with FAB
  - `app/(app)/create.tsx` — create deck + AI generation
  - `app/(app)/player.tsx` — flashcard player with flip animation
  - `components/FlashCard.tsx` — animated flip card component
  - `context/AuthContext.tsx` — Supabase auth state
  - `lib/supabase.ts` — Supabase client (lazy init)
  - `constants/colors.ts` — dark academic design tokens
- `artifacts/api-server/src/routes/generate.ts` — POST /api/generate (Gemini AI)
- `lib/api-spec/openapi.yaml` — API contract
- `supabase_schema.sql` — SQL to run in Supabase dashboard

## Architecture decisions

- **Frontend → Supabase direct** for auth + CRUD (decks, flashcards). No proxy layer.
- **Frontend → API Server** only for AI generation (to keep Gemini key server-side).
- **Lazy Supabase client** — supabase.ts uses a Proxy to defer initialization until credentials are present; app shows a "Setup Required" screen if missing instead of crashing.
- **No tabs** — pure Stack navigation. Auth group `(auth)` and app group `(app)` keep route separation clean.
- **Forced dark mode** — `userInterfaceStyle: "dark"` in app.json; both `light` and `dark` keys in colors.ts map to the same dark academic palette so useColors() always returns dark tokens.

## Required Secrets

| Key | Where |
|-----|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `GEMINI_API_KEY` | aistudio.google.com → Get API key |

## Database Setup

Run `supabase_schema.sql` in Supabase SQL Editor to create `decks` and `flashcards` tables with RLS policies.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **After `pnpm --filter @workspace/api-spec run codegen`**: orval regenerates `lib/api-zod/src/index.ts` and re-adds duplicate exports. Immediately run `echo "export * from \"./generated/api\";" > lib/api-zod/src/index.ts` to fix it, then run `pnpm run typecheck:libs`.
- `EXPO_PUBLIC_*` env vars are bundled at build time — restart the Expo workflow after changing them in Secrets.
- Gemini model `gemini-2.0-flash` is used in `/api/generate`; upgrading to `gemini-2.5-flash` for better quality is safe.
