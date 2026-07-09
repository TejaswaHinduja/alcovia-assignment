# Decisions

For each non-obvious choice you made, explain **why** (not what). Honest assessment of tradeoffs matters more than sounding impressive.

## State Management

What approach did you use for data fetching and state? Why that over the alternatives?
For the timer I have created a context hook and for all the other states I am just using useState, the other alternative would have been to use zustand but I think for a app this size that is not required since there arent really any cross screen state variables.

## API Integration

How did you handle the date format inconsistency between the sessions list (epoch ms) and session detail (ISO string) endpoints? Why that approach?

I handled it `formatWhen()` in `lib/format.ts`, and it works because `new Date()`accepts both an epoch number and an ISO string — so the same function formats dates from both endpoints.

The alternative was to normalize everything right when the response arrives (e.g. convert both to `Date` objects in `api.ts`). I decided against it because then my types would no longer match what the API actually returns, which makes debugging network responses confusing — you look at the network tab and see one shape, but your code has another. Keeping responses untouched and converting only at the one place that can handle it felt simpler.`

## Pagination

How did you implement cursor-based pagination? What happens when the user scrolls past the last page?

On the server: when the client asks for `limit` rows, I actually query `limit + 1`. If that extra row comes back, I know there's another page, so I return `hasMore: true` and slice it off. The cursor is just the last row's `(startedAt, id)` encoded as base64 — the client never looks inside it, it just sends it back. The next page queries "rows older than this cursor" using (`started_at < ? OR (started_at = ? AND id < ?)`). I sort by `(started_at, id)` and not just time so the order stays stable even if two sessions have the exact same timestamp — with offset-based pagination (`OFFSET 20`) you can get duplicated or skipped rows when new data is inserted between page loads; a cursor doesn't have that problem.

On the client: the `useSessions` hook stores `cursor` and `hasMore`. The FlatList's `onEndReached` calls `loadMore()`, which appends the next page. When the user scrolls past the last page, `hasMore` is `false` and `cursor` is `null`, so `loadMore()` just returns early and the footer shows up. A `loadingMore` flag also stops `onEndReached` from firing the same request twice while one is still in flight.

## Edge Cases
What does the app show when the API is down? When there are 0 sessions? When a request takes 10 seconds?
If the api is down first the skeletons pop up, and if the request still doesnt go through after 10 seconds then the app shows a error message "something went wrong"

## Session Detail

What did you put on this screen and why? What data felt useful vs noise?

The screen has two parts: a summary card and the timeline. The summary card shows the session type with its icon, a completed/abandoned status , when it happened, and three numbers — duration, coins earned, and finish time. The timeline has focus/break block with its start time and length.

The timeline is the star of the screen — it's the only data this endpoint has that the list screen doesn't, and it actually tells a story ("25 min focus, 5 min break, 15 min focus"). The data useful for this screen is what the student would want to see like: did I finish it, how long was it, what did I get for it.

What I treated as noise: the IDs (`sessionId`, `studentId`) — they mean nothing to a user, so they're not shown anywhere. Same for raw timestamps; everything goes through `formatWhen` so the user sees "Today, 2:30 PM" instead of an ISO string. I also didn't repeat `status` per timeline entry or show `durationMs` in milliseconds.

## What's Weak

What is the weakest part of your implementation? If you had 2 more days, what would you fix first?

The weakest part is the timer's timekeeping. It counts down by decrementing a number inside a `setInterval` every second. That has two problems: `setInterval` drifts slightly over long periods, and on mobile the JS timer is paused when the app goes to the background — so if a student locks their phone for 10 minutes mid-session, the countdown just freezes and the session takes longer. The correct fix is to store the *end timestamp* (`endsAt = Date.now() + duration`) and compute the remaining time from the clock on every tick, so backgrounding doesn't lose time. I'd fix that first.

Second on the list: the gamification data is static. Completing sessions adds coins, but `current_streak` and achievement progress never actually recalculate on the server — the numbers come from the seed data. So the loop of "do a session → watch your badge progress move" isn't real yet.

Third: there are zero automated tests. The pagination and time-window logic are exactly the kind of fiddly code where tests would help, and right now I'm verifying them by hand with curl.

## What Breaks at Scale

If this app had 10,000 concurrent users hitting your API, what breaks first? What would you change?

The database breaks first, in two ways. First, `better-sqlite3` is **synchronous** — every query blocks Node's event loop.so latency explodes under load. Second, SQLite allows only **one writer at a time** — with 10k users finishing sessions, the `POST /sessions` transactions (insert session + insert timeline + update coins) would serialize and pile up.

There's also a structural ceiling: SQLite is a file on one machine's disk, that is a problem.

What I'd change, in order:
1. **Move to Postgres** with a connection pool and async queries. This fixes the event-loop blocking, the single-writer limit, and lets multiple server instances share one database.
2. **Stop recomputing stats on every request.** `GET /stats` scans the week's sessions each call; per-user it's fine, but at scale I'd either cache it briefly or maintain running counters updated when a session is created.
3. At 10k users we would probably have to add load balancers.

---

*If you completed any bonus challenges, add a section for each below:*

## (Bonus) Achievements Screen
Added a few achievements like streaks, first time session , etc

## (Bonus) Focus Timer
Built a timer with three modes,The timer doesnt go away even if the student switches to another screen.Kept it minimal.

