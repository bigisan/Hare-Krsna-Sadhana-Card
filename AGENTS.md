# AGENTS.md

Guidance for AI coding agents (OpenAI Codex) working in this repository.

## What this project is

Sadhana is a mobile-first PWA for Gaudiya Vaishnava devotees to track daily
spiritual practice and export any week onto the official ISKCON Sydney
Brahmacari Sadhana Card (a PDF). It is a single-page React app. It runs fully
in guest mode with no backend; Supabase is optional and adds cross-device
accounts and sync.

## Tech stack

- React 18 + Vite 5 + TypeScript 5 (strict)
- Tailwind CSS v3 with HSL semantic tokens; shadcn-style local UI primitives
- React Router for the Daily / Weekly / Monthly routes
- Supabase JS for auth (email + Google) and Postgres with RLS
- recharts (charts), date-fns (dates), sonner (toasts), lucide-react (icons)
- pdf-lib for the client-side card export

## Setup, build, and verify

Always run these before opening a PR. Treat a failing type-check or build as a
blocking error to fix, not to report.

```bash
npm install
npx tsc --noEmit     # must pass with zero errors
npm run build        # must succeed; output goes to dist/
```

There is no test suite yet. If you add non-trivial logic (for example new
scoring rules), add a lightweight test and wire up a `test` script rather than
leaving it unverified.

## Project structure

- `src/lib/sadhana-types.ts` — the `DailyEntry` model, the auto-scoring step
  functions, and the weekly summary/comparison helpers. The scoring thresholds
  mirror the physical card exactly; do not change them without being asked.
- `src/lib/storage.ts` — the storage abstraction. Every read/write goes through
  here and transparently picks Supabase (when signed in) or localStorage (guest).
  Add new persisted fields in BOTH branches and in the row mappers.
- `src/lib/exportSadhanaCard.ts` — overlays a week onto
  `public/sadhana-card-template.pdf` using a coordinate map measured from the
  original document (top-left origin, page height 842pt). Coordinates are exact;
  change them only against a rendered proof.
- `src/lib/pramanas.ts` — the encouraging scriptural messages and the logic
  that selects them. Tone is always gentle, never shaming.
- `src/contexts/AuthContext.tsx` — auth state: `{ user, isGuest, signOut, ... }`.
- `src/components/` — views (`DailyView`, `WeeklyView`, `MonthlyProgress`),
  entry surfaces (`DailyWizard`, `DailyEntryForm`), and `ui/` primitives.
- `supabase/migrations/0001_init.sql` — tables, RLS policies, grants, the
  `user_roles` table, and the `has_role` SECURITY DEFINER function.

## Conventions to follow

- **Design tokens only.** Never use raw Tailwind color classes like `bg-green-500`
  in components. Use the semantic tokens (`bg-primary`, `text-muted-foreground`,
  `bg-secondary`, `border-border`, etc.) defined in `src/index.css` and
  `tailwind.config.ts`. The palette is "Sattvic": warm cream + olive-sage.
- **Display type** uses the `.font-display` class (Cormorant Garamond). Body is
  Inter via the default sans stack.
- **Layout** is centered with `max-w-lg`, generous padding (`p-8` on cards).
- **Scoring is auto-computed** from times via the step functions; never add
  manual score dropdowns.
- **Bed time is recorded against the current day**, not the night before.
- **Storage parity:** any new `DailyEntry` field must be handled in the Supabase
  row mappers (`toRow`/`fromRow`), the guest path, and, if it should reach the
  PDF, in `exportSadhanaCard.ts` with a measured coordinate.
- **Tone:** all nudges encourage; toast messages end with "Hare Krishna 🙏".
- **Accessibility floor:** keyboard focus visible, `aria-label` on icon buttons,
  works down to a narrow phone width, respects reduced motion.

## Security and data

- Supabase tables use Row Level Security scoped to `auth.uid()`. Any new table
  needs `ENABLE ROW LEVEL SECURITY`, explicit policies, and GRANT statements.
- Roles live in their own `user_roles` table, never on a profile row. Check
  roles with the `has_role(uuid, app_role)` function.
- Never commit real secrets. `.env` holds `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`; `.env.example` documents them and stays blank.

## Routing note for deploys

This is a single-page app. The SPA redirect config already exists
(`netlify.toml`, `vercel.json`, `public/_redirects`). If you add a host, add the
equivalent rewrite so a direct visit to `/weekly` or `/monthly` serves
`index.html`.

## Good first tasks (examples that fit the codebase)

- Add a dark-mode toggle to the Settings sheet (tokens already exist in `.dark`).
- Implement page two of the card export (reading/hearing key points, realisations).
- Add a `test` script with a few unit tests for the scoring step functions.
