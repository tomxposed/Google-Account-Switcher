/**
 * Google Account Switcher — Popup Script
 *
 * Renders per-service account selectors and persists preferences
 * in chrome.storage.sync.
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

const ACCOUNT_OPTIONS = `
  <option value="">— Use Global —</option>
  <option value="0">Account 0 (1st)</option>
  <option value="1">Account 1 (2nd)</option>
  <option value="2">Account 2 (3rd)</option>
  <option value="3">Account 3 (4th)</option>
  <option value="4">Account 4 (5th)</option>
  <option value="5">Account 5 (6th)</option>
`;

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
        ${ACCOUNT_OPTIONS}
      </select>
    `;
        container.appendChild(card);
    }
}

// ---- Load saved preferences ----
async function loadPrefs() {
    const prefs = await chrome.storage.sync.get(null);

    document.querySelectorAll(".account-select").forEach((sel) => {
        const key = sel.dataset.service;
        if (prefs[key] !== undefined) {
            sel.value = String(prefs[key]);
        }
    });
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
document.addEventListener("DOMContentLoaded", () => {
    renderServices();
    loadPrefs();
    document.getElementById("save-btn").addEventListener("click", savePrefs);
});
