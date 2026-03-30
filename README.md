# Simplify.AI — Chrome Extension

**Simplify.AI** is a Chrome Extension powered by Chrome's built-in **Gemini Nano** AI.
It lets you instantly summarize and understand any webpage — no external API keys, no data leaving your device.

---

## Features

- **On-device AI** — uses Chrome's built-in Gemini Nano (no server, no API key)
- **Smart content extraction** — automatically finds the main article or body text
- **Graceful fallback** — works even when Gemini Nano is unavailable, using an intelligent text-analysis summary
- **Keyboard shortcut** — trigger with `Alt+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
- **Clean overlay** — results appear in a non-intrusive panel on the page
- **Manifest V3** — uses the latest Chrome extension standard with a service worker

---

## How It Works

```
User clicks button / presses shortcut
           │
           ▼
    popup.js / background.js
           │
           ▼  chrome.tabs.sendMessage
    content.js  ← extract page text
           │
           ▼  chrome.runtime.sendMessage
    background.js ← AI processing
      ┌────┴────┐
      │         │
  Gemini   Fallback text
   Nano    analysis
      └────┬────┘
           ▼  chrome.tabs.sendMessage
    content.js  ← display result overlay
```

---

## Project Structure

```
SimplifyAI/
├── manifest.json           Extension configuration (MV3)
├── Popup/
│   ├── popup.html          Extension popup UI
│   ├── popup.css           Popup styles
│   └── popup.js            Popup interaction logic
├── background/
│   └── background.js       Service worker — AI processing & command handling
├── content/
│   └── content.js          Page content extraction & result overlay
└── icons/
    └── icon2.png           Extension icon
```

---

## Core Files

### `manifest.json`
Defines the extension's metadata, permissions, entry points, icons, and keyboard shortcuts.
Uses **Manifest V3** — the current Chrome extension standard.

### `content/content.js`
Injected into every webpage. Responsible for:
- Extracting the main text content from the page DOM
- Showing the loading indicator and result overlay on the page
- Relaying messages between the popup/background and the page

### `background/background.js`
Runs as a **service worker**. Responsible for:
- Handling the `Alt+S` keyboard shortcut via `chrome.commands.onCommand`
- Checking whether Gemini Nano is available on this device
- Running the AI summarization (or falling back to text analysis)
- Sending results back to the content script

### `Popup/popup.html` + `popup.js` + `popup.css`
The small panel that opens when you click the extension icon.
Contains the **Simplify This Page** button and a status indicator.

---

## Requirements

| Requirement | Details |
|---|---|
| Chrome version | 119+ (for Gemini Nano support) |
| Gemini Nano | Optional — fallback works without it |
| Permissions used | `activeTab`, `scripting`, `tabs` |

To use the full Gemini Nano AI, enable **Chrome's built-in AI** at:
```
chrome://flags/#optimization-guide-on-device-model
```
Set to **Enabled BypassPerfRequirement**, then relaunch Chrome.

---

## Installation (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `SimplifyAI/` project folder
5. The extension will appear in your toolbar — pin it for quick access

---

## Usage

| Action | How |
|---|---|
| Summarize current page | Click the extension icon → **Simplify This Page** |
| Keyboard shortcut | `Alt+S` (Windows/Linux) · `Cmd+Shift+S` (Mac) |
| Dismiss result | Click the **×** button on the overlay panel |

---

## Privacy

- No data is sent to any external server
- All AI processing happens **on-device** via Gemini Nano
- When Gemini Nano is unavailable, summarization is done entirely in JavaScript with no network calls
