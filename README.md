# Google Account Switcher

A Chrome extension that automatically redirects Google services to your preferred account. Never manually switch between accounts again!

## Features

✨ **Set Default Accounts** — Configure your preferred account for each Google service:
- Gmail
- Google Calendar
- Google Drive
- Google Photos
- Google Contacts
- Google Keep
- YouTube
- Google Maps
- Google Meet

🎯 **Global Default** — Set a fallback account for services without a specific preference

🔄 **Smart Redirection** — Automatically redirects to `mail.google.com/u/N/` or other Google service URLs with your chosen account

⚡ **Respects Manual Selection** — If you manually navigate to a specific account, the extension won't interfere

🔐 **Secure Storage** — Settings are stored securely using Chrome's storage API

## Installation

1. Clone or download this repository
2. Open `chrome://extensions/` in your Chrome browser
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the folder containing this extension
6. The extension icon will appear in your Chrome toolbar

## Usage

1. **Open the Extension** — Click the Google Account Switcher icon in your Chrome toolbar
2. **Set Global Default** — Select your preferred account from the "Global Default Account" dropdown
3. **Configure Services** — For each Google service, select which account to use (or leave as default)
4. **Save Settings** — Click the "Save Settings" button

The extension will now automatically redirect you to your selected account whenever you visit:
- `gmail.com` → `mail.google.com/mail/u/{N}/`
- `calendar.google.com` → `calendar.google.com/calendar/u/{N}/`
- And other Google services with the appropriate account segment

## How It Works

### Architecture

- **`manifest.json`** — Chrome extension configuration (Manifest V3)
- **`popup.html`** — Extension popup interface
- **`popup.js`** — Popup logic and settings management
- **`popup.css`** — Popup styling
- **`background.js`** — Service worker that intercepts and redirects navigation
- **`icons/`** — Extension icons (16px, 48px, 128px)

### Redirection Logic

The extension uses Chrome's `webNavigation` API to intercept navigation events. It supports two redirection modes:

1. **Alias Hosts** (e.g., `gmail.com`)
   - Always redirected to the canonical URL with the account segment
   - Example: `gmail.com` → `mail.google.com/mail/u/0/`

2. **Canonical Hosts** (e.g., `mail.google.com`)
   - Only redirected if the URL doesn't already contain `/u/N/`
   - Respects manual account selection (if you visit `/u/2/`, the extension won't redirect)

### Account Indexing

Google accounts are referenced by index:
- **Account 0 (1st)** — Your first logged-in account
- **Account 1 (2nd)** — Your second logged-in account
- **Account 2 (3rd)** — Your third logged-in account
- And so on...

You can have up to 6 accounts configured in the extension settings.

## Configuration Example

**Scenario:** You have 2 Google accounts logged in:
1. `personal@gmail.com` (Account 0)
2. `work@gmail.com` (Account 1)

**Settings:**
- Global Default: Account 0
- Gmail: Account 0
- Google Calendar: Account 1
- Google Drive: Account 0

**Result:**
- Visiting `gmail.com` → redirects to `personal@gmail.com`
- Visiting `calendar.google.com` → redirects to `work@gmail.com`
- Visiting `drive.google.com` → redirects to `personal@gmail.com`

## Permissions

The extension requires the following permissions:

| Permission | Purpose |
|-----------|---------|
| `storage` | Store your account preferences |
| `webNavigation` | Intercept navigation to Google services |
| `*://*.google.com/*` | Access Google services |
| `*://*.youtube.com/*` | Access YouTube |
| `*://gmail.com/*` | Access Gmail shortcut domain |
| `*://www.gmail.com/*` | Access Gmail www shortcut domain |

## Troubleshooting

### The extension isn't redirecting me to the right account

1. Verify you're logged into all configured accounts in your browser
2. Check that your account index is correct (Account 0 is your first logged-in account)
3. Try refreshing the page or clearing your browser cache
4. Ensure the extension has the correct permissions in `chrome://extensions/`

### Manual account switching isn't working

The extension respects manual selection. If you visit `calendar.google.com/calendar/u/2/` directly, the extension won't override it.

### I need to reset my settings

1. Open the extension popup
2. All dropdowns default to "Disabled"
3. Save Settings to clear all preferences

## Development

### Project Structure

```
Google-Account-Switcher/
├── manifest.json       # Extension configuration
├── popup.html          # UI template
├── popup.js            # Popup logic
├── popup.css           # Popup styles
├── background.js       # Service worker (redirection logic)
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Modifying the Extension

To add a new Google service:

1. Open `background.js`
2. Add an entry to the `SERVICES` array:
   ```javascript
   {
     id: "myservice",
     hostMatch: "myservice.google.com",
     pathPrefix: "/",
     insertAfter: "",
   }
   ```
3. Update `popup.html` to add a card for the new service
4. Reload the extension in `chrome://extensions/`

## License

This project is provided as-is without a specific license. Feel free to modify and use it for personal purposes.

## Support

For issues or feature requests, please open an issue on the [GitHub repository](https://github.com/tomxposed/Google-Account-Switcher).

---

**Disclaimer:** This extension is not affiliated with, endorsed by, or sponsored by Google. Use it at your own risk.
