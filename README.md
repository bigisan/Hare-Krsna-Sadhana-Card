# Sadhana

A mobile-first PWA for Gaudiya Vaishnava devotees to track daily spiritual practice, with one-tap export of any week onto the official ISKCON Sydney Brahmacari Sadhana Card.

## Features

- **Daily wizard** (one question at a time, auto-scored, resumable drafts) or an all-on-one-page form, switchable in Settings
- **Auto-computed scores** from times, following the card's marking scheme (bed 20:45, wake 03:45, japa 07:15 ideals)
- **Weekly Log** with the 7-day table and Wake / Japa / Bed / Overall percentage cards (each out of 175)
- **Weekly Report** comparing this week with last (recharts), plus gentle pramana cards drawn from sastra; never shaming
- **Monthly** calendar heatmap and totals
- **Export to Sadhana Card**: fills the real card PDF in the browser via pdf-lib; scores circled, attendance ticked, totals and percentages computed
- **Auth**: Supabase email/password and Google OAuth, or "Continue as guest" (device-only localStorage, shown with a Guest chip)
- **PWA**: installable on iOS via Safari, Share, Add to Home Screen

## Quick start

```bash
npm install
npm run dev
```

With no environment variables the app runs in guest mode (device storage only), which is perfect for trying it out.

## Cloud sync (Supabase)

1. Create a project at supabase.com
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (tables, RLS, grants, roles, has_role)
3. Enable the Google provider under Authentication, Providers (optional)
4. Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://YOURPROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

5. `npm run build` and deploy the `dist/` folder anywhere static (Vercel, Netlify, Cloudflare Pages)

## iOS install

Open the deployed site in Safari, tap Share, then Add to Home Screen. The manifest and apple-touch-icon are already configured (theme #8a9a7b, background #f5f0e8).

## The card export

`src/lib/exportSadhanaCard.ts` overlays the week onto `public/sadhana-card-template.pdf` using a coordinate map measured from the original document. It runs entirely client-side, so guests can export too. The template is the original card with handwritten stamp annotations removed.

Hare Krishna 🙏
