# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.1] - 2026-04-20

### Fixed

- Color history no longer wiped on extension updates — `onInstalled` now only initializes on first install
- Clipboard "Copied!" feedback now reflects actual write success/failure
- Pick button no longer throws when no active tab is found
- Removed unused `copyWithFeedback` import from `ui.js`

## [1.1] - 2026-04-03

### Added

- Image color picking — pick actual pixel colors from `<img>`, `<canvas>`, `<video>`, and CSS `background-image` elements using tab screenshot capture
- Color format toggle — switch between HEX, RGB, and HSL output in the popup; preference is saved and applies to both the popup and eyedropper toast
- Color format conversion utilities (`src/utils/color.js`)

### Changed

- Eyedropper toast and clipboard now use the user's preferred color format instead of always HEX
- Service worker now handles `captureTab` messages for screenshot-based color picking
- Hint bar updated to mention image picking

### Fixed

- Cleanup no longer races with async clipboard write — `cleanup()` now waits for the toast to be shown before removing DOM elements

## [1.0] - 2026-03-26

### Added

- Eyedropper color picker activated from popup
- Smart text vs background detection using `caretRangeFromPoint`
- SVG fill and stroke picking with `pointer-events: none` support
- Shift+click to force background color mode
- Color history (last 10 picks) stored in `chrome.storage.sync`
- Automatic clipboard copy on pick
- Shadow DOM isolation for toast and hint UI
- Privacy policy
