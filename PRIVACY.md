# Privacy Policy — Color Picker

**Last updated:** 2026-03-26

## Overview

Color Picker is a Chrome extension that picks colors from web pages. It does not collect, transmit, or store any user data outside of your browser.

## Data collection

This extension collects **no personal data**. It does not track browsing activity, record page content, or send any information to external servers.

## Local storage

Picked colors are stored locally in `chrome.storage.sync` for the sole purpose of displaying your color history in the extension popup. This data stays within your browser and is never transmitted externally.

## Permissions

| Permission | Purpose |
|---|---|
| `storage` | Store your last 10 picked colors locally for the color history feature. |
| `activeTab` | Access the current tab to inject the eyedropper when you click "Pick Color". Only the tab you interact with is accessed. |
| `scripting` | Inject the eyedropper script into the active tab to highlight elements and read their computed color. |

## Third parties

This extension has no third-party dependencies, no analytics, no advertising, and makes no network requests.

## Contact

If you have questions about this privacy policy, open an issue at [github.com/mikepage/chrome-extension-color-picker](https://github.com/mikepage/chrome-extension-color-picker/issues).
