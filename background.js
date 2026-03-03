/**
 * Google Account Switcher — Background Service Worker
 *
 * Intercepts navigations to Google services and redirects them
 * to the user-configured account index (/u/N/).
 *
 * Two redirect modes:
 *   1. ALIAS hosts (e.g. gmail.com) → full rewrite to canonical URL + /u/N/
 *   2. CANONICAL hosts (e.g. mail.google.com) → inject /u/N/ only if missing
 *      (if /u/N/ is already present, the user chose it manually — don't touch)
 */

// ---------------------------------------------------------------------------
// Service definitions
// ---------------------------------------------------------------------------

// Aliases: shortcut domains that should redirect to a canonical Google URL
// with the correct account. These are ALWAYS redirected.
const ALIASES = [
  {
    id: "gmail",
    aliasHosts: ["gmail.com", "www.gmail.com"],
    canonicalUrl: "https://mail.google.com/mail/u/{account}/",
  },
];

// Canonical services: only redirect when /u/N/ is NOT already in the URL.
// This ensures manual account switching is never blocked.
const SERVICES = [
  {
    id: "gmail",
    hostMatch: "mail.google.com",
    pathPrefix: "/mail",
    insertAfter: "/mail",
  },
  {
    id: "calendar",
    hostMatch: "calendar.google.com",
    pathPrefix: "/",
    insertAfter: "",
  },
  {
    id: "drive",
    hostMatch: "drive.google.com",
    pathPrefix: "/",
    insertAfter: "",
  },
  {
    id: "photos",
    hostMatch: "photos.google.com",
    pathPrefix: "/",
    insertAfter: "",
  },
  {
    id: "contacts",
    hostMatch: "contacts.google.com",
    pathPrefix: "/",
    insertAfter: "",
  },
  {
    id: "keep",
    hostMatch: "keep.google.com",
    pathPrefix: "/",
    insertAfter: "",
  },
  {
    id: "youtube",
    hostMatch: "www.youtube.com",
    pathPrefix: "/",
    insertAfter: "",
  },
  {
    id: "maps",
    hostMatch: "maps.google.com",
    pathPrefix: "/",
    insertAfter: "",
  },
  {
    id: "meet",
    hostMatch: "meet.google.com",
    pathPrefix: "/",
    insertAfter: "",
  },
];

const ACCOUNT_SEGMENT_RE = /\/u\/\d+/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAccountIndex(serviceId, prefs) {
  if (prefs[serviceId] !== undefined && prefs[serviceId] !== "") {
    const n = Number(prefs[serviceId]);
    if (!isNaN(n)) return n;
  }
  if (prefs._default !== undefined && prefs._default !== "") {
    const n = Number(prefs._default);
    if (!isNaN(n)) return n;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Core redirect logic
// ---------------------------------------------------------------------------

function getRedirectUrl(rawUrl, prefs) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  // ── 1. Check alias hosts (gmail.com → mail.google.com/mail/u/N/) ──
  for (const alias of ALIASES) {
    if (!alias.aliasHosts.includes(url.hostname)) continue;

    const accountIndex = getAccountIndex(alias.id, prefs);
    if (accountIndex === null) return null;

    return alias.canonicalUrl.replace("{account}", accountIndex);
  }

  // ── 2. Check canonical hosts — only if URL does NOT already have /u/N/ ──
  //    If the user manually typed /u/2/, we respect that and do nothing.
  if (ACCOUNT_SEGMENT_RE.test(url.pathname)) {
    return null;
  }

  for (const svc of SERVICES) {
    const hosts = Array.isArray(svc.hostMatch) ? svc.hostMatch : [svc.hostMatch];
    if (!hosts.includes(url.hostname)) continue;
    if (!url.pathname.startsWith(svc.pathPrefix)) continue;

    const accountIndex = getAccountIndex(svc.id, prefs);
    if (accountIndex === null) return null;

    // Inject /u/N/ into the path
    const insertPoint = svc.insertAfter;
    let newPath;

    if (insertPoint && url.pathname.startsWith(insertPoint)) {
      const rest = url.pathname.slice(insertPoint.length);
      newPath = `${insertPoint}/u/${accountIndex}${rest || "/"}`;
    } else {
      newPath = `/u/${accountIndex}${url.pathname}`;
    }

    // Ensure trailing slash
    if (!newPath.endsWith("/")) {
      newPath += "/";
    }

    url.pathname = newPath;
    return url.toString();
  }

  return null;
}

// ---------------------------------------------------------------------------
// Event listener
// ---------------------------------------------------------------------------
chrome.webNavigation.onBeforeNavigate.addListener(
  async (details) => {
    if (details.frameId !== 0) return;

    const prefs = await chrome.storage.sync.get(null);
    const redirectUrl = getRedirectUrl(details.url, prefs);

    if (redirectUrl && redirectUrl !== details.url) {
      chrome.tabs.update(details.tabId, { url: redirectUrl });
    }
  },
  {
    url: [
      { hostContains: ".google.com" },
      { hostEquals: "www.youtube.com" },
      { hostEquals: "gmail.com" },
      { hostEquals: "www.gmail.com" },
    ],
  }
);

// Log installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Google Account Switcher installed / updated.");
});
