# Implementation notes — v1.1.0

## Model

The model snapshot travels with each session. Seventeen linked scenes converge to the same sequence; availability is derived from actual carried items. Cup and lunch-kit cleanliness are tracked independently. Each scene has two or three available choices; checkout has four definitions of which three are visible.

Item IDs are stable within a session. Initial belongings are marked existing. The notebook and shirt are initial items, not new purchases. Printing creates sheets in use; final handling decides whether they are retained or discarded. A new bag retained tonight remains a new acquired single-use item. Recycling stays in the discard total. The fruit intended for today is consumed on the way home, recorded at the dinner scene; extra fruit and unused home ingredients remain edible inventory. Cooking marks ingredients as prepared into the meal, rather than pretending all prepared food was eaten. No food and non-food quantities are added into a score.

`commitChoice` validates the active visit and availability, clones the state, records item events linked by `choiceCommitId`, records the choice and advances the checkpoint as one serializable snapshot. Repeated commits return the already-committed state. UI state and reports share the event replay analysis. Derived item events must not be added to choice effects a second time.

## Timing and recovery

The decision clock starts only after the art is prepared, the fade completes and an open hand rearms input. Effective time excludes the union of all pause intervals. Tracking absence and intentional rest are not inferred to be user errors. Known segments are closed on explicit exit, page hiding and selection. A new monotonic segment is created on restore. An abrupt refresh that loses an unclosed fragment marks the scene timing missing; surviving fragment events remain available for audit.

The localStorage snapshot is updated for each choice and session state change. A failed save leaves the memory session available with an explicit export warning. Browser storage is not permanent archival storage: export actual research sessions promptly. Storage capacity depends on the browser/device. Unsupported old storage is not silently migrated.

No camera frames or keypoints enter session events. There is one camera stream and one hand-model detection loop. The existing interpreter uses palm-normalised pinch thresholds, hysteresis and smoothing. One press edge is consumed by only the topmost gesture button. Opening a new page/modal or finishing a transition requires release before a new pinch can act. Mouse click, Enter and Space do not activate game controls.

## Artwork and typography

`scripts/draw-scenes.mjs` creates sixteen original 1600×900 monochrome vector illustrations and a cover. The same student, shirt, bag and prop functions recur. The original sixteen panels are preserved, including both cashier and shopper at the supermarket. The added travel decision takes place at the front door and explicitly reuses S02 through artId; displayed scene numbers run from 1 to 17. Live SVG layers show the actual fruit quantity and the actual papers/bags from the ledger. Aftermath text is separate from art; options, long text and statistics are never baked into an image.

`public/art/manifest.json` records scene ID, file, version, source and alternate text. Runtime overlays live in `ComicScene.vue`. System handwriting fonts are used for headings (Segoe Print, Comic Sans MS, Chalkboard SE), with clear system sans-serif for reading and choices. Font appearance therefore depends on the study device; check it before the pilot. All strokes, UI and charts use black and white, without coloured correctness cues. Existing MediaPipe model/WASM files are carried over from the original project.

The art preloader caches the current and next two scenes. A five-second asset wait falls back to an explicit textual description and records `degraded_asset` and the visit's asset status. It does not claim a successful full-art trial. Short fades respect the initial reduced-motion preference; the cover gesture toggle changes the next session condition, which is saved with that session.

## Research and exports

Play and research sessions are distinct. Consent is required before creating a research session. Declining returns without creating research data. Knowledge checks default off and retain actual answers when enabled. A/B order is researcher-selectable; this does not establish equivalent difficulty. Results follow post-checks and ratings in the normal study flow. Ratings are custom single items, not SUS. Replay creates a free-play child session; primary research uses the first session per participant.

The ZIP has session.json, choices.csv, items.csv, events.csv, summary.csv, report.html, report.md, charts/*.svg, analyze_story.py and README.txt. CSV includes explicit missing values, quoting and spreadsheet-formula guards. Reports can be printed to PDF from the browser. Item charts split types and units; food is in a separate chart. Comparison data appear only when a real parent session exists. Nothing generates participant quotations, themes, significance tests or causal conclusions.

## Still requires real-world verification

The implemented rules and automated checks do not replace real webcam trials or a visual fit check on the actual classroom screen. Verify reaching every option, open-hand edge scrolling on short screens, arm fatigue, tracking pauses, modal recovery, browser camera permissions, browser-managed downloads and the legibility of the selected system fonts. Check the final course brief separately for participant eligibility and submission requirements.

## Connected story revision

See `STORY_REDESIGN.md` for the complete narrative and choice table. Model `comic-day-1.1.0` adds a travel scene (S02T) between packing and arrival at school. It preserves existing IDs and art. Each new visit saves the exact contextual storyText shown before item destinations change. Reports export that observed text; they do not reconstruct a past prompt from end-of-day inventory. Old snapshots keep their original model, text and scene count.

`storyNarrative.ts` links travel mode, packing, fruit quantity and dinner source to subsequent scenes. It returns a consequence, a short lesson and an available alternative for every committed choice. Summary pagination exposes the complete review rather than three selected moments. The ZIP includes choice-review.csv. Exhaust is discussed qualitatively in a separate travel summary, with no fabricated emissions or combined environmental score.

Scene counts, completion checks and timing chart dimensions derive from the saved model length rather than a fixed sixteen-scene assumption.
