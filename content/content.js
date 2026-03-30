// Guard against double injection (can happen when both manifest + scripting API inject the script)
if (!window.__simplifyAILoaded) {
  window.__simplifyAILoaded = true;

  // Inject animation keyframes once
  const styleTag = document.createElement("style");
  styleTag.id = "simplify-ai-styles";
  styleTag.textContent = `
    @keyframes simplify-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes simplify-fadein {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(styleTag);

  // Single unified message listener
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.action) {
      case "extract_content":
        extractAndSendContent();
        break;
      case "display_result":
        removeLoadingIndicator();
        displayResult(message.data);
        break;
      case "display_error":
        removeLoadingIndicator();
        displayError(message.data);
        break;
    }
  });
}

// ─── Content Extraction ───────────────────────────────────────────────────────

function extractAndSendContent() {
  try {
    let content = extractMainContent();
    if (content.length < 100) {
      content = document.body?.innerText || "";
    }
    sendToBackground(content);
  } catch {
    sendToBackground(document.body?.innerText || "");
  }
}

function extractMainContent() {
  const selectors = [
    "main", "article", '[role="main"]',
    ".content", ".main-content", "#content",
    ".post", ".story", ".article",
    ".page-content", ".entry-content", ".post-content"
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return cleanText(el.innerText);
  }

  return findLargestTextBlock();
}

function findLargestTextBlock() {
  const elements = [
    ...document.querySelectorAll("p, div, section, h1, h2, h3, h4, h5, h6, li")
  ];

  const candidates = elements.filter(el => {
    const text = el.innerText?.trim() ?? "";
    return (
      text.length > 50 &&
      !text.match(/^(https?:|www\.|@)/) &&
      !el.closest("nav, header, footer, aside, [role='navigation']") &&
      isVisible(el)
    );
  });

  candidates.sort((a, b) => b.innerText.length - a.innerText.length);

  const combined = candidates
    .slice(0, 5)
    .map(el => el.innerText)
    .join("\n\n");

  return cleanText(combined || document.body.innerText);
}

function isVisible(el) {
  const style = window.getComputedStyle(el);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    el.offsetHeight > 0
  );
}

function cleanText(text) {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\t/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function sendToBackground(content) {
  showLoadingIndicator();
  chrome.runtime.sendMessage({
    action: "process_text",
    data: content.substring(0, 20000)
  });
}

// ─── UI Components ────────────────────────────────────────────────────────────

function showLoadingIndicator() {
  removeLoadingIndicator();

  const el = document.createElement("div");
  el.id = "simplify-loading";
  Object.assign(el.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: "2147483647",
    background: "#1a73e8",
    color: "white",
    padding: "11px 16px",
    borderRadius: "10px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "13px",
    fontWeight: "500",
    boxShadow: "0 4px 16px rgba(26,115,232,0.4)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    animation: "simplify-fadein 0.2s ease"
  });

  const spinner = document.createElement("span");
  Object.assign(spinner.style, {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.35)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "simplify-spin 0.7s linear infinite",
    flexShrink: "0"
  });

  const label = document.createElement("span");
  label.textContent = "Simplifying…";

  el.append(spinner, label);
  document.body.appendChild(el);
}

function removeLoadingIndicator() {
  document.getElementById("simplify-loading")?.remove();
}

function displayResult(content) {
  document.getElementById("simplify-result")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "simplify-result";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: "2147483647",
    background: "white",
    width: "360px",
    maxHeight: "520px",
    borderRadius: "14px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(0,0,0,0.08)",
    animation: "simplify-fadein 0.25s ease"
  });

  // Header
  const header = document.createElement("div");
  Object.assign(header.style, {
    padding: "12px 14px",
    borderBottom: "1px solid #f1f3f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#f8f9fa",
    flexShrink: "0"
  });

  const title = document.createElement("span");
  Object.assign(title.style, {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1a73e8"
  });
  title.textContent = "🧠 Simplify.AI";

  const closeBtn = document.createElement("button");
  Object.assign(closeBtn.style, {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#5f6368",
    fontSize: "18px",
    lineHeight: "1",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
    transition: "background 0.15s"
  });
  closeBtn.textContent = "×";
  closeBtn.title = "Close";
  closeBtn.addEventListener("mouseover", () => { closeBtn.style.background = "#e8eaed"; });
  closeBtn.addEventListener("mouseout",  () => { closeBtn.style.background = "none"; });
  closeBtn.addEventListener("click", () => overlay.remove());

  header.append(title, closeBtn);

  // Body — use textContent (not innerHTML) to prevent XSS
  const body = document.createElement("div");
  Object.assign(body.style, {
    padding: "14px 16px",
    overflowY: "auto",
    flex: "1",
    fontSize: "13px",
    lineHeight: "1.65",
    color: "#3c4043",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  });
  body.textContent = content;

  overlay.append(header, body);
  document.body.appendChild(overlay);
}

function displayError(errorMessage) {
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: "2147483647",
    background: "#c5221f",
    color: "white",
    padding: "11px 16px",
    borderRadius: "10px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "13px",
    fontWeight: "500",
    boxShadow: "0 4px 16px rgba(197,34,31,0.35)",
    maxWidth: "300px",
    animation: "simplify-fadein 0.2s ease"
  });
  el.textContent = errorMessage;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}
