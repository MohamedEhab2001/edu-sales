# Edulato Sales CRM

A focused Next.js sales workspace for managing leads, scheduled calls, follow-ups, ownership, and conversion analytics. The UI follows the extracted Edulato design system: indigo actions, soft lavender surfaces, rounded product cards, dark navy anchors, and responsive mobile layouts.

## Included workflow

- One pre-seeded administrator account with a secure HTTP-only session cookie.
- Lead table with search, filters, pagination, CSV export, edit, archive, and phone-based duplicate protection.
- Pipeline statuses: New, Contacted, Follow-up, Potential client, Call booked, Call finalized, and Lost.
- Converted is an independent checkbox used only to mark that a lead has paid or subscribed; it is false by default and does not change automatically with pipeline status.
- Scheduled calls with owner, date, contact, field, phone, social link, and preparation notes.
- “Complete call” flow that creates a lead row or attaches the outcome to an existing lead with the same phone number.
- Follow-up timeline with response, notes, salesperson, outcome, and next follow-up.
- Dashboard metrics for total leads, potential clients, converted leads, conversion rate, today’s calls, upcoming calls, overdue follow-ups, fields, and salesperson performance.
- Dynamic field, salesperson, and response values. New typed values are remembered automatically and become suggestions in later forms.
- Saved-values screen for adding or removing future suggestions without changing historical records.
- Cairo-time reporting and responsive desktop/mobile layouts.

## Product assumptions

The first version intentionally uses one admin login. Salesperson names are assignment values, not separate accounts. Follow-up reminders are visible inside the CRM; it does not send WhatsApp, email, or push notifications. Calls are completed manually with the “Complete call” action. Leads are archived rather than permanently deleted.

These are the most useful next upgrades after the MVP has real usage:

1. Individual salesperson accounts and role-based permissions.
2. Automated daily reminder notifications for overdue follow-ups and calls.
3. CSV import for existing lead lists.
4. Lead source, expected value, tags, and lost-reason analytics.
5. Full audit trail for edits and assignment changes.

## Local setup

Requirements: Node.js 20+ and a MongoDB Atlas cluster.

```bash
npm install
cp .env.example .env.local
```

Update `.env.local`:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/edulato-sales
AUTH_SECRET=replace-with-at-least-32-random-characters
SEED_NAME=Mohamed Ehab
SEED_EMAIL=admin@edulato.com
SEED_PASSWORD=replace-this-password
```

Create the pre-seeded account and default follow-up responses:

```bash
npm run seed
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `SEED_EMAIL` and `SEED_PASSWORD`.

## Verification

```bash
npm run typecheck
npm run build
```

## Deployment

Deploy to a full Node.js runtime such as Vercel, Railway, Render, or a VPS. Configure `MONGODB_URI`, `AUTH_SECRET`, `SEED_NAME`, `SEED_EMAIL`, and `SEED_PASSWORD` in the deployment environment. Run `npm run seed` once against the production database, then remove `SEED_PASSWORD` from the environment if the deployment platform allows one-off seed variables.

MongoDB Atlas must allow network access from the chosen host. For Vercel serverless deployments, use a conservative connection pool and Atlas’s recommended network policy.

## Security notes

- Never commit `.env.local` or an Atlas connection string.
- Use a random `AUTH_SECRET` of at least 32 characters.
- Replace the example seed password before the first seed.
- The session cookie is HTTP-only, same-site, and secure in production.
- The app validates incoming API data with Zod and hashes passwords with bcrypt.
