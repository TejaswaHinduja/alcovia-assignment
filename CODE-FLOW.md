# Code Flow & State Management

A walkthrough of how the app works end to end — useful as a refresher before explaining the project.

---

## Big picture

```
┌─────────────────────┐         ┌──────────────────────┐         ┌──────────┐
│   Expo / React      │  fetch  │   Express API        │  SQL    │  SQLite  │
│   Native app        │ ──────► │   (server/src)       │ ──────► │  (.db)   │
│   (app/, lib/)      │ ◄────── │                      │ ◄────── │          │
└─────────────────────┘  JSON   └──────────────────────┘  rows   └──────────┘
```

- The app never touches the database — it only talks to the API over HTTP.
- The server never renders anything — it only returns JSON.

---

## Backend flow (`server/src`)

A request travels through four small layers:

```
index.ts  →  routes/students.ts  →  db.ts  →  lib/mappers.ts  →  JSON response
(setup)      (route handlers)       (SQLite)   (row → API shape)
```

1. **`index.ts`** — creates the Express app, enables CORS + JSON body parsing,
   mounts all student routes under `/api/students`, and defines two fallbacks:
   a 404 for unknown routes and a central 500 error handler.
2. **`routes/students.ts`** — one handler per endpoint. Each handler follows the
   same recipe: *validate input → query SQLite → map rows → `res.json(...)`*.
3. **`db.ts`** — opens the SQLite file once (lazy singleton) and creates tables
   on startup (`CREATE TABLE IF NOT EXISTS`).
4. **`lib/mappers.ts`** — converts database rows (`snake_case`) into the API
   shape (`camelCase`), e.g. `total_coins` → `totalCoins`.

### Error handling

Every error is a plain one-liner — status code plus a `message`:

```ts
return res.status(404).json({ message: 'Student not found' });
```

No helper functions, no error codes. The app reads `body.message` and shows it.

### Cursor pagination (sessions list)

- The client asks for `limit` rows; the server fetches **`limit + 1`**. If the
  extra row came back, there's another page (`hasMore: true`).
- The cursor is the last row's `(startedAt, id)` encoded as base64 — opaque to
  the client. The next page queries "rows older than this cursor".
- Sorting by `(started_at, id)` (not just time) keeps the order stable even if
  two sessions started at the same millisecond.

### Streak webhook (POST /sessions side effect)

After creating a session, the server counts today's completed sessions. At 3+,
it inserts into `streak_notifications` with `INSERT OR IGNORE` — the table has
`UNIQUE(student_id, day)`, so only the **first** insert of the day succeeds,
and only that winning insert fires the n8n webhook. That makes the notification
idempotent: no duplicates, no matter how many sessions finish.

---

## Frontend flow (`app/`, `lib/`)

Screens never call `fetch` directly. The chain is:

```
screen (app/…)  →  hook (lib/use…)  →  api client (lib/api.ts)  →  fetch
   renders UI       owns the state       builds URLs, parses errors
```

- **`lib/api.ts`** — one tiny client. `request()` wraps `fetch`, throws an
  `Error` with the server's `message` on non-2xx, and returns typed JSON.
  All endpoints are one-liners on the `api` object.
- **Hooks own state, screens render it.** Each data screen has a matching hook:

| Screen | Hook | What it manages |
|---|---|---|
| Dashboard | `useDashboard` | student + weekly stats, refetch on tab focus |
| History | `useSessions` | filters, pagination, pull-to-refresh |
| Achievements | `useAchievements` | badge list |
| Session detail | (inline in screen) | one session by id |
| Focus timer | `useTimer` (context) | the countdown — see below |

---

## How state is handled

There are three kinds of state in the app, each handled the simplest way that works:

### 1. Server data → local `useState` in a hook, with a status enum

Every data hook follows the same pattern:

```ts
const [data, setData] = useState(...);
const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
const [error, setError] = useState<string | null>(null);
```

The screen is then a simple three-way switch:
`loading` → skeleton, `error` → `<ErrorState onRetry>`, `ready` → the real UI.
One enum instead of separate `isLoading`/`isError` booleans means impossible
states (loading *and* error at once) can't happen.

Extras where they're needed:

- **`useSessions` — request-id guard.** Tapping filters quickly fires
  overlapping requests that can resolve out of order. Every request records an
  incrementing id; a response is only applied if it's still the newest.
- **`useSessions` — pagination.** `loadMore()` appends the next page using the
  saved cursor and is a no-op if a page is already loading or there's no more.
- **`useDashboard` — refetch on focus.** Uses `useFocusEffect` instead of
  `useEffect`, so coins/streak refresh every time you return to the tab
  (e.g. right after finishing a timer session), silently — no skeleton flash.

### 2. The timer → React Context at the app root (`lib/TimerContext.tsx`)

The timer is the one piece of **global** state, and there's a concrete reason:

> Screen state dies when the screen unmounts. If the countdown lived inside
> `timer.tsx`, navigating back would reset a running session.

So `TimerProvider` wraps the whole app in `app/_layout.tsx`. The provider never
unmounts, so the interval keeps ticking on any screen, and the session still
saves to the API even if you're on another tab when it hits zero. The timer
screen itself is now pure UI — it just reads `useTimer()`. Bonus: the Dashboard
reads the same context to flip its button to **"Back to Session"** while a
timer is running.

The timer is a small state machine:

```
 idle ──start──► running ──pause──► paused
                  │    ▲              │
                  │    └───resume─────┘
                  │
            (reaches 0:00)
                  ▼
               saving ──ok──► done ──"Done"──► reset to idle
                  │
                error ──"Retry Save"──► saving
```

- One `useEffect` runs `setInterval` only while `phase === 'running'` and
  cleans it up otherwise.
- A second effect watches for `secondsLeft <= 0` and calls
  `api.createSession(...)` with the type, duration, and a timeline entry
  containing the real start time.
- "Give Up" just resets to `idle` — nothing is sent to the server.

### 3. UI-only state → plain `useState` in the component

Things only one screen cares about stay local: the selected achievement for the
detail modal, the active filter pill, etc. No context, no library — a value and
a setter.

**Why no Redux/Zustand?** Almost all state here is either server data (owned by
one screen's hook) or trivial UI state. The only cross-screen state is the
timer, and one small context covers it. Adding a state library would be more
code to explain with nothing to show for it.

---

## One request, end to end (History screen example)

1. `history.tsx` mounts → `useSessions('week')` sets `status = 'loading'` →
   screen shows the pulsing skeleton list.
2. The hook calls `api.getSessions({ filter: 'week' })` →
   `GET /api/students/stu_01/sessions?filter=week`.
3. Express handler validates `filter`, computes the week's time bounds, queries
   SQLite for `limit + 1` rows, maps rows to camelCase, responds with
   `{ data, cursor, hasMore }`.
4. The hook stores the page, `status = 'ready'` → the list renders.
5. Scrolling near the bottom triggers `loadMore()` → same endpoint with
   `cursor=...` → next page is appended.
6. If any step fails, the thrown error's `message` lands in the hook's `error`
   state → `<ErrorState>` renders with a "Try again" button that re-runs step 2.
