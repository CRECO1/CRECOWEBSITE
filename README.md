# CRECO – Commercial Real Estate Company

The marketing & client portal for crecotx.com. Sister site to Fair Oaks Realty Group (residential), sharing the same black/gold luxury brand.

Built with Next.js 15, Supabase (Postgres + Auth + Storage), Payload CMS, Tailwind CSS, and Resend for transactional email.

## Quick Start

### Prerequisites
- Node.js 18+
- A Supabase account (this site uses its own dedicated project — do not share with the residential site)
- A Vercel account (for deployment)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env.local
```
Fill in:
- `DATABASE_URL` – Supabase Session Pooler URL (port 5432)
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` – from Supabase API settings
- `PAYLOAD_SECRET` – `openssl rand -hex 32`
- `RESEND_API_KEY` – for tenant inquiry emails

### 3. Set Up the Database
Run the migration in `supabase/migrations/0001_init.sql` against your CRECO project, or paste it into the Supabase SQL editor. Then build to let Payload generate any missing tables:
```bash
npm run build
```

### 4. Start Development
```bash
npm run dev
```
- Public site: http://localhost:3000
- Admin (Payload): http://localhost:3000/admin
- Manage (custom CRM): http://localhost:3000/manage

## Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── page.tsx         # Homepage
│   ├── listings/        # Commercial property listings
│   ├── tenant-needs/    # Tenant intake form (replaces residential quiz)
│   ├── services/        # Service line detail pages
│   ├── submarkets/      # San Antonio submarket pages
│   ├── team/            # Team page
│   ├── contact/         # Contact form
│   └── api/             # API routes
├── components/          # React components (UI + layout)
├── collections/         # Payload CMS collections
├── globals/             # Payload CMS globals (site settings)
└── lib/                 # Supabase client, utils
```

## Brand
- Primary: `#1A1A1A` (black)
- Accent: `#C9A962` (gold)
- Display: Playfair Display
- Body: Source Sans Pro

Logo: `/public/images/creco-logo.jpg`

## Deployment
1. Push to GitHub
2. Import the repo into Vercel
3. Add environment variables (above) in Vercel
4. Deploy
