/**
 * Google Account Switcher — Popup Script
 *
 * Renders per-service account selectors and persists preferences
 * in chrome.storage.sync. The dropdowns list the Google accounts that are
 * currently signed in on the web.
 */

const SERVICES = [
    { id: "gmail", label: "Gmail", icon: "✉️", color: "#EA4335" },
    { id: "calendar", label: "Google Calendar", icon: "📅", color: "#4285F4" },
    { id: "drive", label: "Google Drive", icon: "📁", color: "#0F9D58" },
    { id: "photos", label: "Google Photos", icon: "🖼️", color: "#F4B400" },
    { id: "contacts", label: "Contacts", icon: "👤", color: "#4285F4" },
    { id: "keep", label: "Google Keep", icon: "📝", color: "#FBBC04" },
    { id: "youtube", label: "YouTube", icon: "▶️", color: "#FF0000" },
    { id: "maps", label: "Google Maps", icon: "📍", color: "#34A853" },
    { id: "meet", label: "Google Meet", icon: "🎥", color: "#00897B" },
];

// The endpoint Chrome itself uses to read the Google accounts signed in on the web
const LIST_ACCOUNTS_URL =
    "https://accounts.google.com/ListAccounts?gpsia=1&source=ChromiumBrowser&json=standard";

// Number of generic "Account N" entries shown when the account list is unavailable
const FALLBACK_ACCOUNT_COUNT = 6;

const ORIGIN_RULE_ID = 1;

// ListAccounts rejects the chrome-extension:// Origin that fetch() sends (403),
// and scripts can't set Origin, so rewrite it to the one Chrome itself uses.
// Scoped to this extension's own requests to that endpoint.
async function allowListAccountsOrigin() {
    await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [ORIGIN_RULE_ID],
        addRules: [{
            id: ORIGIN_RULE_ID,
            action: {
                type: "modifyHeaders",
                requestHeaders: [{ header: "origin", operation: "set", value: "https://www.google.com" }],
            },
            condition: {
                urlFilter: "|https://accounts.google.com/ListAccounts",
                initiatorDomains: [chrome.runtime.id],
                resourceTypes: ["xmlhttprequest"],
            },
        }],
    });
}

// ---- Fetch signed-in Google accounts ----
// Response: ["gaia.l.a.r", [[_, _, name, email, ..., signedOut (index 14), ...], ...]]
// Signed-in accounts are listed in /u/N/ order; signed-out ones have no index.
async function fetchAccounts() {
    await allowListAccountsOrigin();

    // GET returns 400; the endpoint only answers POSTs
    const res = await fetch(LIST_ACCOUNTS_URL, { method: "POST", credentials: "include" });
    if (!res.ok) throw new Error(`ListAccounts returned HTTP ${res.status}`);

    const data = JSON.parse((await res.text()).replace(/^\)\]\}'/, ""));
    if (!Array.isArray(data?.[1])) throw new Error("Unexpected ListAccounts response");

    return data[1]
        .filter((acc) => Array.isArray(acc) && acc[3] && !acc[14])
        .map((acc) => ({ email: acc[3] }));
}

// ---- Render service cards ----
function renderServices() {
    const container = document.getElementById("services-list");

    for (const svc of SERVICES) {
        const card = document.createElement("div");
        card.className = "service-card";
        card.innerHTML = `
      <div class="service-info">
        <span class="service-icon" style="--accent: ${svc.color}">${svc.icon}</span>
        <span class="service-name">${svc.label}</span>
      </div>
      <select class="account-select" data-service="${svc.id}">
        <option value="">— Use Global —</option>
      </select>
    `;
        container.appendChild(card);
    }
}

// ---- Populate account dropdowns ----
// `accounts` is null when the list is unknown; generic labels are used then.
// `prefs` supplies the values to select; without it, current selections are kept.
function populateSelects(accounts, prefs) {
    const labels = accounts
        ? accounts.map((a) => a.email)
        : Array.from({ length: FALLBACK_ACCOUNT_COUNT }, (_, i) => `Account ${i}`);

    document.querySelectorAll(".account-select").forEach((sel) => {
        const value = prefs ? String(prefs[sel.dataset.service] ?? "") : sel.value;

        // Keep the leading "— Use Global —" / "— Disabled —" option
        while (sel.options.length > 1) sel.remove(1);
        labels.forEach((label, i) => sel.add(new Option(label, String(i))));

        // Keep a saved index visible even if no signed-in account holds it now
        if (value !== "" && !Array.from(sel.options).some((o) => o.value === value)) {
            sel.add(new Option(`Account ${value} (not signed in)`, value));
        }

        sel.value = value;
        updateTitle(sel);
    });
}

// Full label on hover, since long emails are clipped in the service cards
function updateTitle(sel) {
    sel.title = sel.selectedOptions[0]?.textContent ?? "";
}

function showAccountsStatus(text) {
    document.getElementById("accounts-status").textContent = text;
}

// ---- Save preferences ----
function savePrefs() {
    const prefs = {};

    document.querySelectorAll(".account-select").forEach((sel) => {
        const key = sel.dataset.service;
        prefs[key] = sel.value;
    });

    chrome.storage.sync.set(prefs, () => {
        const toast = document.getElementById("toast");
        toast.classList.remove("hidden");
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
            toast.classList.add("hidden");
        }, 1800);
    });
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", async () => {
    renderServices();
    document.getElementById("save-btn").addEventListener("click", savePrefs);
    document.addEventListener("change", (e) => {
        if (e.target.matches(".account-select")) updateTitle(e.target);
    });

    // Show the last-known accounts immediately, then refresh from Google
    const [prefs, { accounts: cached }] = await Promise.all([
        chrome.storage.sync.get(null),
        chrome.storage.local.get("accounts"),
    ]);
    populateSelects(cached ?? null, prefs);

    try {
        const accounts = await fetchAccounts();
        chrome.storage.local.set({ accounts });
        populateSelects(accounts);
        showAccountsStatus(accounts.length ? "" : "No Google accounts are signed in.");
    } catch (err) {
        console.warn("Could not load Google accounts:", err);
        showAccountsStatus(cached
            ? "Couldn't refresh accounts — showing the last known list."
            : "Couldn't load your Google accounts — showing account numbers.");
    }
});
