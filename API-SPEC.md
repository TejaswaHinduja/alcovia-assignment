# Alcovia API Specification

Base URL: `http://localhost:3000/api`

The server skeleton, database schema, and seed data are provided. You build the route handlers.

---

## GET /students/:id

Returns a single student profile.

**Response** `200`
```json
{
  "id": "stu_01",
  "name": "Arjun Mehta",
  "initials": "AM",
  "totalCoins": 340,
  "currentStreak": 5,
  "dailyGoal": 3,
  "joinedAt": "2026-05-15T10:00:00.000Z"
}
```

---

## GET /students/:id/sessions

Paginated list of sessions, newest first.

**Query params**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `limit` | number | 10 | Max 50 |
| `cursor` | string | — | Opaque base64 cursor from a previous response |
| `filter` | string | — | `today`, `week`, `month`, or omit for all |

**Response** `200`
```json
{
  "data": [
    {
      "id": "ses_01",
      "studentId": "stu_01",
      "type": "deep_focus",
      "durationMs": 1500000,
      "coins": 50,
      "status": "completed",
      "startedAt": 1720356600000,
      "completedAt": 1720358100000
    }
  ],
  "cursor": "eyJpZCI6InNlc18wNSJ9",
  "hasMore": true
}
```

**Important:** `startedAt` and `completedAt` are **epoch milliseconds** (number) on this endpoint. This is intentional and differs from the detail endpoint.

The cursor is an opaque base64 string. Do not assume its structure. Decode it server-side to get the pagination state.

---

## GET /students/:id/sessions/:sessionId

Returns a single session with its timeline breakdown.

**Response** `200`
```json
{
  "id": "ses_03",
  "studentId": "stu_01",
  "type": "deep_focus",
  "durationMs": 1500000,
  "coins": 50,
  "status": "completed",
  "startedAt": "2026-07-06T10:45:00.000Z",
  "completedAt": "2026-07-06T11:10:00.000Z",
  "timeline": [
    { "type": "focus", "durationMs": 750000, "startedAt": "2026-07-06T10:45:00.000Z" },
    { "type": "break", "durationMs": 300000, "startedAt": "2026-07-06T10:57:30.000Z" },
    { "type": "focus", "durationMs": 450000, "startedAt": "2026-07-06T11:02:30.000Z" }
  ]
}
```

**Important:** `startedAt` and `completedAt` are **ISO 8601 strings** on this endpoint. This differs from the list endpoint above. Handle both formats in your app.

---

## GET /students/:id/achievements

Returns all achievements for a student, both locked and unlocked.

**Response** `200`
```json
[
  {
    "id": "ach_01",
    "name": "First Steps",
    "description": "Complete your first focus session",
    "icon": "footsteps",
    "unlockedAt": "2026-05-15T10:30:00.000Z",
    "progress": 100,
    "target": 1,
    "current": 1
  },
  {
    "id": "ach_06",
    "name": "Streak Legend",
    "description": "Maintain a 30-day streak",
    "icon": "bonfire",
    "unlockedAt": null,
    "progress": 17,
    "target": 30,
    "current": 5
  }
]
```

Locked achievements have `unlockedAt: null`. The `icon` value maps to an [Ionicons](https://ionic.io/ionicons) icon name.

---

## GET /students/:id/stats?period=week

Returns aggregated stats for the current period.

**Query params**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `period` | string | `week` | Only `week` is required for the assignment |

**Response** `200`
```json
{
  "totalSessions": 12,
  "totalCoins": 340,
  "streak": 5,
  "todayCompleted": 2,
  "dailyGoal": 3,
  "sessionsPerDay": [
    { "day": "mon", "count": 2 },
    { "day": "tue", "count": 3 },
    { "day": "wed", "count": 1 },
    { "day": "thu", "count": 2 },
    { "day": "fri", "count": 2 },
    { "day": "sat", "count": 2 },
    { "day": "sun", "count": 0 }
  ]
}
```

**Note:** Days are lowercase abbreviated strings. The current day is determined server-side.

---

## POST /students/:id/sessions

Creates a new completed session. Used by the Focus Timer screen when a session finishes.

**Request body**
```json
{
  "type": "deep_focus",
  "durationMs": 1500000,
  "timeline": [
    { "type": "focus", "durationMs": 1500000, "startedAt": "2026-07-07T14:00:00.000Z" }
  ]
}
```

**Response** `201`

Returns the created session object (same shape as the detail endpoint).

**Side effect:** After creating the session, check if the student has completed 3 or more sessions today. If yes, and if no streak notification has been sent today, fire a POST to your n8n webhook URL with:

```json
{
  "studentId": "stu_01",
  "studentName": "Arjun Mehta",
  "sessionsToday": 3,
  "streak": 5,
  "date": "2026-07-07"
}
```

Record the notification in the `streak_notifications` table to prevent duplicates.

---

## Error responses

All error responses follow this shape:

```json
{
  "error": "Student not found",
  "code": "NOT_FOUND"
}
```

Use appropriate HTTP status codes: 400, 404, 500.
