# Notes

React + Vite + Tailwind CSS v4 + Supabase (email/password auth, Postgres with Row Level Security).

## Setup
1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in Dashboard > SQL Editor.
3. `cp .env.example .env` and fill in your project URL and anon key.
4. `npm install && npm run dev`

## Deploy to Vercel
1. Push to GitHub and import the repo in Vercel (Vite is auto-detected).
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Project Settings > Environment Variables.
3. Deploy, then set your Vercel URL under Supabase > Authentication > URL Configuration (Site URL).
