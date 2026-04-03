# Color Picker

A lightweight Chrome extension that picks any color from a web page. Built for developers who need quick access to exact color values without leaving the browser.

## Why

Browser DevTools let you inspect colors, but it takes multiple clicks to navigate the DOM, find the right element, and locate the color property. This extension does it in one click — activate the eyedropper, click any element, and the hex value is on your clipboard.

## Features

- **Click to pick** — auto-detects whether you clicked on text, background, or image and picks the right color
- **Image color picking** — picks actual pixel colors from images, canvas, video, and CSS background images
- **Multiple formats** — switch between HEX, RGB, and HSL in the popup; preference is remembered
- **SVG support** — picks fill and stroke colors from SVG elements, including icons with `pointer-events: none`
- **Shift+click** — force background color mode when clicking over text or images
- **Color history** — stores your last 10 picked colors for quick access
- **Copy to clipboard** — colors are copied automatically on pick in your chosen format
- **No permissions abuse** — uses only `activeTab`, `scripting`, and `storage`; no background data collection

## Usage

1. Click the extension icon in the toolbar
2. Click **Pick Color**
3. Hover over any element — a blue outline shows what will be picked
4. **Click** to copy the color to your clipboard
5. Open the popup again to see your color history

| Action | Result |
|---|---|
| Click on text | Text color |
| Click on background | Background color |
| Click on image | Pixel color from image |
| Click on SVG | Fill color |
| Shift+click | Force background color |
| Shift+click on SVG | Stroke color |
| Esc | Cancel picker |

In the popup, click the format button (HEX/RGB/HSL) to cycle through output formats. Your preference is saved and also applies to the eyedropper toast.

## Install from source

1. Clone this repo
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the repo root

## Project structure

```
manifest.json
images/
src/
  service-worker.js          Service worker (lifecycle + tab capture)
  content/eyedropper.js      Injected eyedropper (self-contained)
  popup/popup.html|css|js    Popup UI
  utils/clipboard.js         Clipboard helper
  utils/color.js             Color format conversions (HEX/RGB/HSL)
  utils/ui.js                Popup DOM helpers
```

## Privacy

This extension **does not collect, transmit, or store any user data** outside of your browser. Picked colors are stored locally in `chrome.storage.sync` for history purposes only. There are no analytics, no tracking, no network requests, and no third-party dependencies.

### Chrome Web Store privacy disclosures

| Question | Answer |
|---|---|
| Does the extension collect user data? | No |
| Does the extension transmit data to remote servers? | No |
| Does the extension use remote code? | No |
| Does the extension use third-party libraries? | No |
| Data usage categories | None |

### Permission justifications

| Permission | Justification |
|---|---|
| `storage` | Stores the user's last 10 picked colors locally in chrome.storage.sync so they appear in the popup's color history. No data is transmitted externally. |
| `activeTab` | Needed to access the current tab when the user clicks "Pick Color" in the popup. The extension injects the eyedropper script into the active tab to detect colors of hovered elements. Also used to capture a tab screenshot when picking colors from images. Access is only granted for the tab the user explicitly interacts with. |
| `scripting` | Used to inject the eyedropper content script (content/eyedropper.js) into the active tab when the user initiates color picking. The script highlights elements on hover and reads their computed color on click. |

## License

MIT
