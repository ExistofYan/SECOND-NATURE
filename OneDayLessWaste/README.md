# One Day, Less Waste

A standalone, English-language gesture comic about sixteen moments in a student's day. Original black-and-white line illustrations, bold readable type, no answer timer, and automatic fade-to-black scene changes.

## Run the included build

1. Unzip this folder beside your existing EcoSort folder.
2. In the VS Code terminal, run `.\Start.cmd` (requires Python). In Windows File Explorer you can also double-click `Start.cmd`. Alternatively run:

   ```powershell
   python -m http.server 5174 --bind 127.0.0.1 --directory dist
   ```

3. Open <http://127.0.0.1:5174/> in a current desktop browser and allow the camera.
4. Raise an open hand, point at a card, pinch thumb and index finger once, then open them again.

Do not open `dist/index.html` directly using `file://`; the camera/model require a local web server. Camera permission is a browser control outside the game. If permission is denied, allow it in the browser and reload. No game buttons use mouse clicks or keyboard activation.

The complete hand model and WASM files are included. Gameplay has no runtime cloud dependency. Camera frames stay on this device. Stored records do not include images, video or hand landmarks.

## Develop

```powershell
npm ci
npm run dev
npm test
npm run build
```

The project uses Vue 3, TypeScript, Pinia, Vite and the existing EcoSort MediaPipe camera/interpreter services. This is an independent project; the original app is not changed. The packaged build runs without installing Node packages.

## What's implemented

- Sixteen fixed scenes in four chapters; two or three available gesture choices per scene.
- Morning packing changes the café, water, lunch and checkout options. Not carrying reusable items never blocks completion.
- One black-and-white comic per screen, the same striped-shirt student and recurring props, with live fruit/paper/bag overlays.
- Comic-style titles using available system handwriting fonts; clear bold sans-serif body text. No font download is required.
- Choice confirmation → aftermath → fade out → chapter/time/location → fade in → release fingers → fresh choice. No extra next-scene button.
- Practice, optional study consent and participant codes, optional alternate-set knowledge checks, four custom experience ratings, pause/help/backpack, saved sessions and replay.
- Unique-item ledger with food servings kept separate from non-food items and paper sheets. Acquired, retained, transferred and discarded items are distinct.
- Atomic choice/checkpoint snapshots under `ecosort:comic-day:v1`. Existing EcoSort keys are not migrated or overwritten.
- Paginated end-of-day summary, actual-choice reflections and an optional comparison with the parent replay session.
- Gesture export of ZIP containing JSON, CSV, HTML, Markdown, monochrome SVG charts and a standard-library Python replay script. Partial records are supported.

## Verification and trial limits

Automated checks cover conditional paths, one-time submissions, item replay, overlapping pauses, interrupted timing, checkpoint saving, gesture locks, extractable ZIPs and agreement with Python analysis. Layout CSS explicitly accommodates the design targets of 1366×768 and 1280×720, without shrinking the whole interface. Smaller screens stack the choices and support open-hand edge scrolling.

Automated tests do not establish real hand-tracking accuracy, comfort, reading speed or participant understanding. Test the real camera, fonts and transition pace on the actual study computer before recruiting participants. No participant sessions, interviews or study findings are included. Development visual fixtures are not bundled in the production build and are never study records.

`materials/STUDY_GUIDE.md` includes the trial protocol and interview prompts. `docs/IMPLEMENTATION.md` records modelling, input, timing, artwork and export decisions.

Collection rules are illustrative game rules, not verified ANU/ACT disposal guidance. The model makes no mass, carbon, tree-equivalence, lifecycle superiority or long-term behaviour-change claim.

## Gesture resource fix (1.0.3)

- Resource URLs are absolute page URLs, including when the game is hosted in a subfolder. They no longer depend on the compiled JavaScript module location.
- Model download errors include the exact asset path and HTTP status. HTML fallback pages and empty downloads are rejected before MediaPipe starts. MediaPipe validates the model format; alignment bytes in valid task bundles are preserved.
- Camera permission errors and model loading errors have different instructions. GPU initialization still falls back to CPU.
- MediaPipe is pinned to 0.10.35. Development and production commands synchronize its matching WASM files and check that all illustrations and the model exist.
- The production HTML contains the application code and styles. Illustrations and tracking resources still require the accompanying folders.

## Publish the included build

Upload the entire `dist` folder to your existing static host. The upload root must contain `index.html`, `art`, `models`, `mediapipe`, `assets`, and `_headers` together. Do not upload only `index.html`, and do not upload the project root instead of `dist`.

After replacing a deployment, hard-refresh the page (Ctrl+Shift+R). Use an HTTPS page or localhost, allow the camera, and test with a real open hand followed by a pinch and release. The release has not yet passed a real-camera user trial.

### 1.0.3 correction

Version 1.0.2 mistakenly required the task bundle ZIP signature at byte zero. The included valid MediaPipe model has two leading alignment bytes. The application now passes its complete, unchanged bytes to MediaPipe. A regression test uses the actual included model. Browser validation successfully initialized MediaPipe CPU with that 7,819,105-byte model without requesting a camera. This verifies model initialization, not real-hand interaction accuracy.

The dynamic-import warning emitted by Vite for MediaPipe is a development bundler analysis warning; it does not by itself establish a model initialization failure. Do not edit generated dependency-cache files to suppress it.
