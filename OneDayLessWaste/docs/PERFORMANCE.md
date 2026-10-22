# Gesture performance changes — 1.0.4

Released: 2026-10-23 (Australia/Sydney).

## Changes

- Synchronous MediaPipe inference moved from the interface thread into one classic Web Worker.
- One capture/inference request in flight; intermediate video frames are skipped rather than queued.
- Transferred ImageBitmap frames have a maximum width of 640 pixels and are closed in the worker.
- requestVideoFrameCallback scheduling with an animation-frame fallback and a 30 FPS target cap.
- Hidden-page suppression and generation checks reject stale results, including across page hiding and stop/restart.
- Cursor rendering isolated from the main comic component and moved using transforms.
- Shared topmost-button lookup replaces per-button bounding-rectangle reads.
- Smoothing constant 35 ms and pinch stabilization 70 ms. Input remains release-to-rearm, without hover activation.
- App version in new sessions is 1.0.4; existing saved records are not rewritten.
- Full English README includes startup, gesture use, Netlify, privacy, exports and troubleshooting.

## Verification

TypeScript check, production build, production DOM smoke check and 26 automated tests passed. New tests cover single-frame backpressure, resizing, stale-result rejection, hidden-page recovery, bitmap cleanup and shared hit testing. The existing story, timing, input lock and Python replay/export checks also pass.

The worker code is bundled as a standalone classic script before both development and production startup. The worker and MediaPipe resources are included in the deployment folder.

Browser inventory was unavailable during this change, so the new worker has not been initialized in an actual browser in this session. Unit worker tests use a controlled worker substitute. No measured FPS improvement, real-hand accuracy, fatigue result or zero-lag claim is made. A real-camera smoke test is required on the intended study computer before collecting participant data.

## Installing this release

Extract this complete release into a new folder, install using npm ci, then run npm run dev. The running version should show one-day-less-waste@1.0.4 in the terminal. For Netlify, upload the entire new dist folder. Existing deployments and the previously extracted 1.0.3 project are not automatically updated.
