# Alcovia Student App - Assignment

**Time limit:** 48 hours from when you receive this.

You're building 3 screens of a student focus app, the API that powers them, and an n8n automation workflow. A design spec, starter code, and seed data are provided. What you build on top of them is entirely your call.

## What you're building

### 1. Mobile app (React Native / Expo)

3 tab screens + 1 detail screen:

| Screen | Spec level | What this means |
|--------|-----------|-----------------|
| Dashboard | **Fully specced** | Design reference has exact measurements, colors, spacing. Match it closely. |
| History | **Partially specced** | Happy path is designed. Empty, loading, error, and pagination states are on you. |
| Achievements | **Wireframe only** | You get the data shape and 12 achievement names. Everything visual is your decision. |
| Session Detail | **No spec** | Tapping a session in History should go somewhere useful. Figure out what. |

Plus a **Focus Timer** screen accessible from the Dashboard's "Start Session" button. There is no design for this. You decide what it looks like, how the timer works, what session types are available, and what happens when a session completes.

### 2. Backend API (Express + SQLite)

The database schema, seed script, and fixture data are provided in `server/`. You build the route handlers for the endpoints documented in `API-SPEC.md`.

Pay attention to:
- Cursor-based pagination (not offset)
- The date format inconsistency between endpoints (this is intentional, read the spec)
- Input validation and error handling

### 3. n8n Workflow

When a student completes their daily goal (3 sessions in a day), the API should fire a webhook to an n8n workflow. The workflow should do something useful with that notification. What it does is up to you.

Requirements:
- Set up an n8n instance (local Docker or n8n.cloud free tier)
- Create a workflow triggered by a webhook
- The webhook payload is documented in `API-SPEC.md`
- The notification must be idempotent (same student + same day = 1 notification, not 3)

## What's provided

```
├── app/                    # Expo Router app with tab navigation
│   ├── _layout.tsx         # Root layout, fonts loaded
│   ├── (tabs)/
│   │   ├── _layout.tsx     # Tab bar configured
│   │   ├── index.tsx       # Dashboard placeholder
│   │   ├── history.tsx     # History placeholder
│   │   └── achievements.tsx # Achievements placeholder
│   └── session/
│       └── [id].tsx        # Session detail placeholder
├── constants/
│   └── Colors.ts           # Design tokens (colors, shadows, radii, spacing)
├── types/
│   └── api.ts              # TypeScript types for all API responses
├── server/
│   ├── src/
│   │   ├── index.ts        # Express boilerplate
│   │   ├── db.ts           # SQLite schema + connection
│   │   └── seed.ts         # Seed script
│   └── fixtures/           # JSON seed data
├── API-SPEC.md             # Endpoint reference
├── DECISIONS.md            # Fill this in (required)
└── designs/
    └── design-spec.html    # Open in browser for the visual reference
```

## Getting started

```bash
# Mobile app
npm install
npx expo start

# Backend (separate terminal)
cd server
npm install
npm run seed
npm run dev
```

## Deliverables

1. **Working app** - all 4 screens functional, connected to your API
2. **Working API** - all endpoints from API-SPEC.md implemented
3. **n8n workflow** - screenshot or export of your workflow, brief description of what it does
4. **DECISIONS.md** - filled in with your reasoning (this matters as much as the code)
5. **Video demo** - 2-3 minute screen recording walking through your app. Show the dashboard, scroll through history, show an achievement, run a focus session, and trigger the n8n webhook. No narration required, but explain anything non-obvious.

## How to submit

Push your code to a GitHub repo (public or invite @VibhorGautam) and share the link along with your video demo.

## What we're evaluating

We care about decisions more than polish. A thoughtful app with rough edges beats a pixel-perfect app that doesn't handle edge cases.

Specifically:
- How closely you match the design spec (where one exists)
- How you handle the parts with no spec (achievements, focus timer, session detail)
- How you deal with the intentional API quirks
- Your pagination implementation
- Error and loading states
- The quality of your DECISIONS.md answers
- Code organization and TypeScript usage
- Whether the n8n workflow actually works

## Rules

- You can use any libraries you want
- You can restructure the starter code however you see fit
- You can add screens or features beyond what's listed (but finish the requirements first)
- AI tools are fine to use, but your DECISIONS.md and video demo should reflect your own understanding
- If something in the spec seems wrong or ambiguous, make a call and document it in DECISIONS.md
