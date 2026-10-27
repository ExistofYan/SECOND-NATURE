# Verification record

## Participant registration and metadata update

TypeScript checking and 25 related tests across storyPdf, storyStore and experienceRatings pass. A simulated gesture flow verifies invalid registration, course selection, no saved session before consent, consent, persistence and resume. Synthetic PDF fixtures round-trip original session data, participant lists, identity-bearing CSVs and matching export metadata. The modified PDF identity page was rendered with Poppler and visually inspected. These fixtures are software checks, not participant research data. No live camera user study was performed.

## 1.2.1 gesture and PDF export

The 56 automated tests across 11 files pass, including sustained-pinch motion, deliberate-motion filtering and immediate latest-frame capture without an inference queue. The production build and TypeScript check pass. A single download has the application/pdf MIME type and a .pdf filename. Complete low/high-discard, partial and empty synthetic fixtures round-trip through the PDF attachments exactly; the extracted Python script reproduces frontend analysis. Extraction refuses to replace different existing records.

The A4 PDF fixtures were parsed independently with pypdf and Poppler, and rendered for visual inspection. The high-discard fixture also exercises all six knowledge-check answers and four ratings. Personal feedback is rule-based on the item ledger and submitted choices. No participant findings or real-world sustainability claims are generated. New sessions record app version 1.2.1 and the interaction configuration; existing records keep their original versions. The story rules retain model version comic-day-1.2.0.

No browser or real-webcam session was run for this change. The camera requests up to 60 FPS, which is a capability request, not a measured result. Check responsiveness and the PDF download on the actual study device before collecting participant data. Raw JSON/CSV data and the analysis script must be extracted from the PDF into the submission's materials folder; the personal PDF alone does not replace the required research evidence.

## Earlier checks

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
