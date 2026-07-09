# Decisions

For each non-obvious choice you made, explain **why** (not what). Honest assessment of tradeoffs matters more than sounding impressive.

## State Management

What approach did you use for data fetching and state? Why that over the alternatives?
For the timer I have created a context hook and for all the other states I am just using useState, the other alternative would have been to use zustand but I think for a app this size that is not required since there arent really any cross screen state variables.

## API Integration

How did you handle the date format inconsistency between the sessions list (epoch ms) and session detail (ISO string) endpoints? Why that approach?

## Pagination

How did you implement cursor-based pagination? What happens when the user scrolls past the last page?

## Edge Cases
What does the app show when the API is down? When there are 0 sessions? When a request takes 10 seconds?
If the api is down first the skeletons pop up, and if the request still doesnt go through after 10 seconds then the app shows a error message "something went wrong"

## Session Detail

What did you put on this screen and why? What data felt useful vs noise?

## What's Weak

What is the weakest part of your implementation? If you had 2 more days, what would you fix first?

## What Breaks at Scale

If this app had 10,000 concurrent users hitting your API, what breaks first? What would you change?

---

*If you completed any bonus challenges, add a section for each below:*

## (Bonus) Achievements Screen
Added a few achievements like streaks, first time session , etc

## (Bonus) Focus Timer
Built a timer with three modes,The timer doesnt go away even if the student switches to another screen.Kept it minimal.
## (Bonus) n8n Workflow

How does your workflow prevent duplicate notifications for the same student on the same day?
