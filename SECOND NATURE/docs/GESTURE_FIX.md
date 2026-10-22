# Gesture resource fix 1.0.3

The previously inspected public deployment returned HTTP 404 for art/cover.svg. The user reported a hand-model loading error. Missing model/WASM files at that host were not individually confirmed.

Changes: absolute MediaPipe asset URLs; model fetch with unchanged task alignment bytes; selected WASM resource checks; detailed startup failures; separate camera/model guidance; pinned SDK and synchronized WASM resources; complete standalone production entry.

Validation: TypeScript check and Vite 6.4.5 production build passed. Four test files / 21 tests passed, including missing files, HTTP-200 HTML fallback, empty model data and the actual aligned task bundle, subfolder URLs and existing story/gesture input guards. Production DOM smoke test and release archive checks are performed before packaging. No real-camera accuracy or participant-experience claims are made.

Deploy the entire dist folder. These local changes do not update an existing hosted deployment automatically.

## Actual-model regression

The included task archive starts with two zero bytes followed by PK\x03\x04. The version 1.0.2 byte-zero ZIP check incorrectly rejected it. Version 1.0.3 leaves format validation to MediaPipe and preserves the original bytes. A browser smoke test using the same loader, local WASM, and actual model successfully initialized HandLandmarker on CPU. No camera or synthetic hand landmarks were used.
