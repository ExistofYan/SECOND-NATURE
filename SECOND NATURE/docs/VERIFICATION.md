# Verification record

Implementation version: 1.2.0 / comic-day-1.1.1.

The application and artwork changed; the story model keeps its version because the choice and item rules are unchanged.

- Automated tests: 51 passed across ten test files.
- The model test traverses 400 deterministic mixed seventeen-scene routes, plus complete low/high-discard routes.
- Low-discard route: no new single-use items, no discarded non-food, no discarded food, one dinner serving saved.
- High-discard route: 22 new single-use items, 24 discarded non-food items including existing belongings, three food servings discarded, four edible servings still in inventory.
- Coverage includes conditional options, stable item IDs, event replay, one-time commits, timing/recovery, gesture guards and storage failures.
- New checks cover all three travel modes, travel separate from rubbish counts, fruit quantity, dinner source, exact prompts retained after tidying, all-choice reviews, feasible alternatives and partial reports.
- A store check reaches the seventeenth scene before completing; a legacy sixteen-scene model still finishes using its own length.
- Complete and partial ZIP exports pass Python archive checks. Python event replay equals frontend item analysis.

The current release ships 21 distinct narrative PNGs, including a departure overview and three travel variants. Older SVG artwork is retained as legacy assets. Automated checks verify PNG signatures, dimensions, distinct contents, every scene ID, travel preloading and the selected bus illustration. Automated DOM startup checks do not verify real webcam gestures, arm comfort or visual fit on a classroom display. Before study use, check story reading, all options, summary pagination, camera permissions and browser downloads on the actual device. No participant findings are generated.

Transition revision checks: the black reading panel stays after a two-minute wait under both fade settings; Continue is required; a held pinch and a mouse click cannot advance it; losing tracking while reading does not open a modal; reloading, explicit pausing and the final completed choice retain unread feedback; the next decision clock starts only after continuation and release. DOM checks verify label-only story choices and the gesture path through Continue. Production build, type checking and the production DOM startup smoke check passed.


## 1.2.0 input checks

Two-hand regressions cover detector-order changes, simultaneous pinches, intentional hand switching, held-pinch takeover after loss, stable open-hand rearming, long frame gaps, aim retention during pinching, a single forwarded loss event, and takeover from an undersized palm. The worker-service test verifies that both hands reach the selector. Existing backpressure, stale-frame, transition, story and export checks remain in the suite.

A browser preview connection failed during this continuation, so there is no current live-browser layout or webcam validation. Source images were visually inspected for breakfast, campus, checkout, travel and evening settings. Automated checks do not establish real-hand accuracy or screen fit.
