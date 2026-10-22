# Verification record

Implementation version: 1.1.0 / comic-day-1.1.0.

- Automated tests: 33 passed across seven test files.
- The model test traverses 400 deterministic mixed seventeen-scene routes, plus complete low/high-discard routes.
- Low-discard route: no new single-use items, no discarded non-food, no discarded food, one dinner serving saved.
- High-discard route: 22 new single-use items, 24 discarded non-food items including existing belongings, three food servings discarded, four edible servings still in inventory.
- Coverage includes conditional options, stable item IDs, event replay, one-time commits, timing/recovery, gesture guards and storage failures.
- New checks cover all three travel modes, travel separate from rubbish counts, fruit quantity, dinner source, exact prompts retained after tidying, all-choice reviews, feasible alternatives and partial reports.
- A store check reaches the seventeenth scene before completing; a legacy sixteen-scene model still finishes using its own length.
- Complete and partial ZIP exports pass Python archive checks. Python event replay equals frontend item analysis.

The existing artwork is preserved. The travel choice reuses the front-door panel. Automated DOM startup checks do not verify real webcam gestures, arm comfort or visual fit on a classroom display. Before study use, check story reading, all options, summary pagination, camera permissions and browser downloads on the actual device. No participant findings are generated.
