# Implementation notes - v1.2.0


## Model

The model snapshot travels with each session. Seventeen linked scenes converge to the same sequence; availability is derived from actual carried items. Cup and lunch-kit cleanliness are tracked independently. Each scene has two or three available choices; checkout has four definitions of which three are visible.

Item IDs are stable within a session. Initial belongings are marked existing. The notebook and shirt are initial items, not new purchases. Printing creates sheets in use; final handling decides whether they are retained or discarded. A new bag retained tonight remains a new acquired single-use item. Recycling stays in the discard total. The fruit intended for today is consumed on the way home, recorded at the dinner scene; extra fruit and unused home ingredients remain edible inventory. Cooking marks ingredients as prepared into the meal, rather than pretending all prepared food was eaten. No food and non-food quantities are added into a score.

`commitChoice` validates the active visit and availability, clones the state, records item events linked by `choiceCommitId`, records the choice and advances the checkpoint as one serializable snapshot. Repeated commits return the already-committed state. UI state and reports share the event replay analysis. Derived item events must not be added to choice effects a second time.

## Timing and recovery

The decision clock starts only after the art is prepared, the fade completes and an open hand rearms input. Effective time excludes the union of all pause intervals. Tracking absence and intentional rest are not inferred to be user errors. Known segments are closed on explicit exit, page hiding and selection. A new monotonic segment is created on restore. An abrupt refresh that loses an unclosed fragment marks the scene timing missing; surviving fragment events remain available for audit.

The localStorage snapshot is updated for each choice and session state change. A failed save leaves the memory session available with an explicit export warning. Browser storage is not permanent archival storage: export actual research sessions promptly. Storage capacity depends on the browser/device. Unsupported old storage is not silently migrated.

No camera frames or keypoints enter session events. There is one camera stream and one hand-model detection loop. The existing interpreter uses palm-normalised pinch thresholds, hysteresis and smoothing. One press edge is consumed by only the topmost gesture button. Opening a new page/modal or finishing a transition requires release before a new pinch can act. Mouse click, Enter and Space do not activate game controls.

## Artwork and typography

The current release uses 21 distinct PNG illustrations in `public/art/narrative`: a cover, sixteen everyday locations, a three-way departure overview and separate bicycle, bus and car journeys. The same striped-shirt student and backpack recur across breakfast, campus, shopping and evening scenes. These are flat hand-drawn scenes with muted slate, cream and mustard colours, following the supplied visual reference. The older monochrome SVGs remain available as legacy assets; they are no longer the displayed scene backgrounds.

`public/art/narrative-manifest.json` lists the current illustrations. `scripts/extract-narrative-art.mjs` crops the five original generated storyboard sheets without recolouring them. Normal development and build commands use the checked-in PNGs and do not require those cached source sheets. `ComicScene.vue` selects the departure overview before a travel choice and the chosen journey afterwards; the black reading panel also shows that journey. The departure loader prepares all four travel images before the decision is ready.

`story-theme.css` supplies matching muted surfaces and a desktop layout with the illustration beside large story text and label-only choice cards. Headings use system handwriting fonts, so their appearance still depends on the device. Inventory badges are derived from the ledger; the background illustrations are illustrative and do not dynamically redraw every carried object or portion. The ledger and reports remain authoritative for quantities.

The art preloader caches the current and next two scenes. A five-second asset wait falls back to an explicit textual description and records `degraded_asset` and the visit's asset status. It does not claim a successful full-art trial. Short fades respect the initial reduced-motion preference; the cover gesture toggle changes the next session condition, which is saved with that session.

## Two-hand input in 1.2.0

One background detector now returns up to two hands. `MultiHandInterpreter` keeps a separate pinch history for each hand, matches identities independently of detector array order, and publishes one controlling pointer. A fresh pinch on the other visible hand can take control while the first hand is open. Two simultaneous pinches generate one press, and a held pinch never repeats.

A brief controlling-hand dropout keeps ownership during the 300 ms grace period. After a longer loss, takeover requires a stable open hand before a new pinch. Invalid or undersized palms are treated as unavailable, allowing a usable hand to take over. Losing the only pinched hand forwards one cancellation event. The pointer holds its last open-hand aim during pinch confirmation so fingertip motion does not move a click away from its intended target.

## Research and exports

Play and research sessions are distinct. Consent is required before creating a research session. Declining returns without creating research data. Knowledge checks default off and retain actual answers when enabled. A/B order is researcher-selectable; this does not establish equivalent difficulty. Results follow post-checks and ratings in the normal study flow. Ratings are custom single items, not SUS. Replay creates a free-play child session; primary research uses the first session per participant.

The ZIP has session.json, choices.csv, items.csv, events.csv, summary.csv, report.html, report.md, charts/*.svg, analyze_story.py and README.txt. CSV includes explicit missing values, quoting and spreadsheet-formula guards. Reports can be printed to PDF from the browser. Item charts split types and units; food is in a separate chart. Comparison data appear only when a real parent session exists. Nothing generates participant quotations, themes, significance tests or causal conclusions.

## Still requires real-world verification

The implemented rules and automated checks do not replace real webcam trials or a visual fit check on the actual classroom screen. Verify reaching every option, open-hand edge scrolling on short screens, arm fatigue, tracking pauses, modal recovery, browser camera permissions, browser-managed downloads and the legibility of the selected system fonts. Check the final course brief separately for participant eligibility and submission requirements.

## Connected story revision

See `STORY_REDESIGN.md` for the complete narrative and choice table. Model `comic-day-1.1.0` adds a travel scene (S02T) between packing and arrival at school. It preserves existing IDs and art. Each new visit saves the exact contextual storyText shown before item destinations change. Reports export that observed text; they do not reconstruct a past prompt from end-of-day inventory. Old snapshots keep their original model, text and scene count.

`storyNarrative.ts` links travel mode, packing, fruit quantity and dinner source to subsequent scenes. It returns a consequence, a short lesson and an available alternative for every committed choice. Summary pagination exposes the complete review rather than three selected moments. The ZIP includes choice-review.csv. Exhaust is discussed qualitatively in a separate travel summary, with no fabricated emissions or combined environmental score.

Scene counts, completion checks and timing chart dimensions derive from the saved model length rather than a fixed sixteen-scene assumption.

## Gesture-confirmed transition reading (1.1.1)

After each committed choice, the scene fades to a black reading panel. It shows the consequence and the next location/arrival text. This panel has no auto-advance timer. A fresh pinch on Continue loads and fades in the next scene, or opens the end-of-day flow after the final choice. Reading is excluded from decision and animation timing. Short fades only shorten the animation; they never skip the reading step.

The existing gesture release guard is rearmed when the panel appears and again after continuing, so a held pinch cannot skip the panel or choose the next answer. Loss of tracking while reading allows an arm rest without opening a tracking modal. Explicit pauses and page hiding return to the same reading panel. The saved optional pendingTransition keeps unread feedback across refresh, including the final completed choice.

Story choices display one large label each. Descriptions remain in model snapshots for reports and alternative-choice explanations, but are not rendered as small subtitles on the choice cards. New model comic-day-1.1.1 adds short explicit questions where needed.
