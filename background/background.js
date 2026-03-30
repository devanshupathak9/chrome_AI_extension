// Handle the keyboard shortcut defined in manifest.json
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "summarize_page") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { action: "extract_content" }, () => {
    if (chrome.runtime.lastError) {
      // Content script not loaded — inject it then retry
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/content.js"] })
        .then(() => chrome.tabs.sendMessage(tab.id, { action: "extract_content" }))
        .catch(() => {});
    }
  });
});

// Handle content processing requests from content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "process_text") {
    processText(message.data, sender.tab?.id);
  }
});

async function processText(text, tabId) {
  if (!tabId) return;

  try {
    const result = (await isGeminiNanoAvailable())
      ? await summarizeWithGeminiNano(text)
      : createFallbackSummary(text);

    chrome.tabs.sendMessage(tabId, { action: "display_result", data: result });
  } catch (error) {
    console.error("Processing error:", error);
    // On any failure, show the best fallback we can produce
    chrome.tabs.sendMessage(tabId, {
      action: "display_result",
      data: createFallbackSummary(text)
    });
  }
}

async function isGeminiNanoAvailable() {
  try {
    if (typeof ai === "undefined" || !ai.languageModel) return false;

    // Newer Chrome AI API (availability)
    if (typeof ai.languageModel.availability === "function") {
      const status = await ai.languageModel.availability();
      return status === "available" || status === "downloadable";
    }

    // Older Chrome AI API (capabilities)
    if (typeof ai.languageModel.capabilities === "function") {
      const caps = await ai.languageModel.capabilities();
      return caps.available === "readily" || caps.available === "after-download";
    }

    return false;
  } catch {
    return false;
  }
}

async function summarizeWithGeminiNano(text) {
  const session = await ai.languageModel.create({
    systemPrompt:
      "You are a concise content summarizer. Given webpage text, produce a clear, well-structured summary. " +
      "Focus on the main ideas and key points. Write in plain language without markdown headers. " +
      "Use short paragraphs or bullet points to make it easy to scan."
  });

  try {
    const prompt =
      "Summarize the following webpage content clearly and concisely. Highlight the key points:\n\n" +
      text.substring(0, 15000);
    const response = await session.prompt(prompt);
    return `AI Summary (Gemini Nano)\n\n${response}`;
  } finally {
    // Always destroy the session to free memory
    session.destroy();
  }
}

function createFallbackSummary(text) {
  if (!text || text.trim().length < 50) {
    return "This page does not contain enough readable text to summarize.";
  }

  // Split on sentence boundaries, filter noise
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25 && s.split(/\s+/).length >= 4 && s.length < 400);

  if (sentences.length === 0) {
    return `Content Preview\n\n${text.substring(0, 500).trim()}…`;
  }

  return `Page Summary\n\n${sentences.slice(0, 7).join(" ")}`;
}
