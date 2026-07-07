# Decisions

For each non-obvious choice you made, explain **why** (not what). Honest assessment of tradeoffs matters more than sounding impressive.

## State Management

What approach did you use for data fetching and state? Why that over the alternatives?

## API Integration

How did you handle the date format inconsistency between the sessions list (epoch ms) and session detail (ISO string) endpoints? Why that approach?

## Pagination

How did you implement cursor-based pagination? What happens when the user scrolls past the last page?

## Edge Cases

What does the app show when the API is down? When there are 0 sessions? When a request takes 10 seconds?

## Achievements Screen

You had no design for this screen. Walk through your decisions: layout choice, locked vs unlocked treatment, progress visualization.

## Focus Timer

This screen had no design spec at all. How did you decide what to build? What did you intentionally leave out?

## n8n Workflow

How does your workflow prevent duplicate notifications for the same student on the same day?

## What's Weak

What is the weakest part of your implementation? If you had 2 more days, what would you fix first?

## What Breaks at Scale

If this app had 10,000 concurrent users hitting your API, what breaks first? What would you change?
