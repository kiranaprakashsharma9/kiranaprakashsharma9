# Kiranprakashs0harma Purohit — Website

A bilingual (English / Kannada) website for a purohit (Hindu priest) offering pooja and ritual services, with an admin-managed photo gallery, live Google reviews, and an AI chat assistant.

- **Live site:** `https://kiranaprakashsharma.vercel.app` — replace with your actual Vercel domain/custom domain once set
- **Repository:** `https://github.com/kiranaprakashsharma9/kiranaprakashsharma`

---

## Project History (context for future you)

This project started as a Vite + React app, was migrated to **Next.js (App Router)**, and was originally hosted on **GitHub Pages** as a static export. It has since moved to **Vercel**, which runs it as a full Next.js server app — this is why `next.config.mjs` no longer has `output: "export"` / `basePath` / `assetPrefix`; those existed only for the old GitHub Pages subpath hosting.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 16 (App Router) | Pages, routing, rendering |
| Styling | Tailwind CSS | Utility-first styling, orange brand theme |
| Hosting | Vercel | Auto-deploys on push to `main` |
| Database & Auth | Supabase (Postgres + Row Level Security) | Admin login, gallery image records |
| File storage | Supabase Storage | Uploaded Shuba/Ashuba gallery photos |
| Google Reviews | [SociableKIT](https://sociablekit.com) | Embedded live Google Reviews widget |
| AI Chat Assistant | [Botpress Cloud](https://botpress.cloud) | Site-wide chatbot for visitor questions |
| Bilingual content | Custom `LanguageContext` (React Context) | English ⇄ Kannada toggle site-wide |
| GA4 | Google Analysis) | Track user activity |

---

## Features

- **Public site**: Home, About, Services, Shuba (auspicious pooja) gallery, Ashuba (post-death ritual) gallery, Reviews, Location, Contact
- **Bilingual toggle** — switch the whole site between English and Kannada from the Navbar
- **Live Google Reviews** embedded via SociableKIT
- **AI chatbot** (Botpress) available site-wide for visitor questions
- **Admin dashboard** (`/admin/dashboard`) — add or remove Shuba/Ashuba gallery images without touching code or redeploying
- **Admin login** (`/admin/login`) via Google OAuth or email/password, restricted to allow-listed emails only

---

## Project Structure

```
kiranaprakashsharma/
├── src/
│   ├── app/                      # Next.js App Router — one folder per route
│   │   ├── about/page.jsx
│   │   ├── admin/
│   │   │   ├── login/page.jsx    # Admin sign-in (Google + email/password)
│   │   │   └── dashboard/page.jsx# Gallery image management (protected)
│   │   ├── ashuba/page.jsx
│   │   ├── contact/page.jsx
│   │   ├── home/page.jsx
│   │   ├── location/page.jsx
│   │   ├── reviews/page.jsx
│   │   ├── services/page.jsx
│   │   ├── shuba/page.jsx
│   │   ├── globals.css
│   │   ├── layout.jsx            # Root layout — Navbar, Footer, LanguageProvider
│   │   └── page.jsx              # Home ("/")
│   ├── assets/                   # Bundled images (imported into components)
│   │   ├── ashuba/
│   │   └── shuba/
│   ├── components/
│   │   ├── FloatingActions.jsx
│   │   ├── Footer.jsx
│   │   └── Navbar.jsx            # Includes Admin Login / Dashboard button
│   ├── context/
│   │   ├── LanguageContext.jsx   # English/Kannada state, "use client"
│   │   └── translations.js       # All translated strings
│   ├── hooks/
│   │   └── useAdminSession.js    # Checks Supabase session + admin_users allow-list
│   ├── lib/
│   │   └── supabaseClient.js     # Shared Supabase browser client
│   └── sections/                 # Section components used on the single-page Home
│       ├── About.jsx
│       ├── Ashuba.jsx
│       ├── Contact.jsx
│       ├── Home.jsx
│       ├── Location.jsx
│       ├── Reviews.jsx
│       ├── Services.jsx
│       └── Shuba.jsx
├── supabase-schema.sql           # Full DB schema — run in Supabase SQL Editor on a fresh project
├── next.config.mjs
├── package.json
├── jsconfig.json                 # Enables "@/..." import shortcut
└── .env.local                    # Not committed — see Environment Variables below
```

---

## Getting Started (local development)

```bash
git clone https://github.com/kiranaprakashsharma9/kiranaprakashsharma.git
cd kiranaprakashsharma
npm install
```

Create `.env.local` in the project root (see next section), then:

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## Environment Variables

Required, in `.env.local` (and mirrored in **Vercel → Project → Settings → Environment Variables** for production):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxx
```

> **TODO:** if your SociableKit and Botpress embeds use widget/bot IDs rather than being hardcoded directly into a component or `layout.jsx`, list those env variable names here too (e.g. `NEXT_PUBLIC_SOCIABLEKIT_WIDGET_ID`, `NEXT_PUBLIC_BOTPRESS_BOT_ID`) so a new contributor doesn't have to hunt for where they're configured.

---

## Admin Dashboard Guide

1. Go to `/admin/login`
2. Sign in with **Google** or **email/password**
3. Only emails listed in the `admin_users` Supabase table can actually access the dashboard — anyone else is signed back out automatically
4. On `/admin/dashboard`:
   - Switch between the **Shuba** / **Ashuba** category tabs
   - Upload a new image (optional caption) — stored in Supabase Storage, listed instantly
   - Delete any existing image

To add a new admin later, insert their email into `admin_users` via the Supabase SQL Editor:
```sql
insert into admin_users (email) values ('newadmin@example.com');
```
If they'll use email/password rather than Google, also create their login under **Supabase Dashboard → Authentication → Users → Add user**.

---

## Database (Supabase)

Full schema lives in [`supabase-schema.sql`](./supabase-schema.sql) — run it once in the SQL Editor on a fresh Supabase project. Summary:

| Table | Purpose |
|---|---|
| `admin_users` | Allow-list of emails permitted to manage the gallery |
| `gallery_images` | One row per Shuba/Ashuba photo — category, storage path, public URL, caption |

Row Level Security is enabled on both: anyone can **view** gallery images (public site needs this), but only allow-listed admins can **insert/update/delete**, enforced via an `is_admin()` Postgres function — not by the app's client-side code.

Storage bucket: **`gallery`** (public bucket) — holds the actual image files referenced by `gallery_images.storage_path`.

---

## Deployment

Hosted on **Vercel**, auto-deploying on every push to `main`:

1. Push changes to `main` on GitHub
2. Vercel builds and deploys automatically — no manual steps
3. Confirm environment variables are set in Vercel's dashboard (they don't come from `.env.local`, which is git-ignored)

If Supabase's **Site URL** / **Redirect URLs** (Authentication → URL Configuration) don't match your current live domain, Google sign-in will fail silently on production while still working locally — update them whenever the domain changes.

---

## License

Private project — all rights reserved.
