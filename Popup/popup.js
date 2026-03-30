const btn = document.getElementById("simplifyBtn");
const statusEl = document.getElementById("status");

btn.addEventListener("click", handleSimplify);

async function handleSimplify() {
  btn.disabled = true;
  showStatus("loading", "⏳ Analyzing page…");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      showStatus("error", "No active tab found.");
      btn.disabled = false;
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: "extract_content" }, () => {
      if (chrome.runtime.lastError) {
        // Content script not yet loaded on this page — inject it first
        injectAndRun(tab.id);
      } else {
        showStatus("success", "✅ Result will appear on the page.");
        setTimeout(() => window.close(), 1400);
      }
    });

  } catch {
    showStatus("error", "Something went wrong. Try reloading the page.");
    btn.disabled = false;
  }
}

function injectAndRun(tabId) {
  chrome.scripting.executeScript({ target: { tabId }, files: ["content/content.js"] })
    .then(() => {
      chrome.tabs.sendMessage(tabId, { action: "extract_content" });
      showStatus("success", "✅ Result will appear on the page.");
      setTimeout(() => window.close(), 1400);
    })
    .catch(() => {
      showStatus("error", "Cannot access this page.");
      btn.disabled = false;
    });
}

function showStatus(type, text) {
  statusEl.textContent = text;
  statusEl.className = `status ${type}`;
}
