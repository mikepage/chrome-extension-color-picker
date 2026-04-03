# CLAUDE.md

## Project

Chrome Manifest V3 extension that picks colors from web pages. No build step, no bundler, no external dependencies — vanilla JS served directly to Chrome.

## Architecture

- `src/content/eyedropper.js` — the eyedropper function is **serialized and injected** via `chrome.scripting.executeScript({ func })`. It must be entirely self-contained: no imports, no references to outer scope. Color conversion functions are duplicated here (cannot share with `utils/color.js`).
- `src/service-worker.js` — minimal background worker. Handles extension install and `captureTab` messages for screenshot-based image color picking.
- `src/popup/` — popup UI (HTML/CSS/JS). Uses ES modules.
- `src/utils/` — shared utilities for the popup only (clipboard, color conversion, UI helpers).
- Colors are always stored as uppercase HEX in `chrome.storage.sync`. Format conversion (RGB/HSL) happens at display/copy time.

## Development

```sh
# Load unpacked in chrome://extensions with Developer mode enabled
# Point to repo root — no build needed

# Build zip for Chrome Web Store submission
./build.sh
```

## Conventions

- No external dependencies. All code is vanilla JS.
- No build tooling or transpilation. Source is shipped directly.
- Keep permissions minimal (`storage`, `activeTab`, `scripting`). Justify any new permission in README and PRIVACY.md.
- Version lives in `manifest.json`. Bump it there, update CHANGELOG.md, then `git tag vX.Y`.
- CHANGELOG.md follows [Keep a Changelog](https://keepachangelog.com) format.

## Code style

- ES modules in popup and utils; self-contained function in eyedropper
- No semicolons are omitted — use semicolons
- Sorted imports (eslint-plugin-perfectionist was applied)
