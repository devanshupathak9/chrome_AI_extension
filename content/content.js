console.log("🚀 Content script loaded successfully");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📩 Content script received message:", message);

  if (message.action === "extract_content") {
    console.log("🎯 Starting content extraction...");
    extractAndSendContent();
  }

  return true;
});

function extractAndSendContent() {
  try {
    console.log("🔍 Extracting page content...");
    
    const pageContent = extractMainContent();
    console.log("📊 Extracted content length:", pageContent.length);
    
    if (pageContent.length < 50) {
      console.log("⚠️ Little content extracted, using body text");
      const bodyContent = document.body?.innerText || "";
      sendToBackground(bodyContent);
    } else {
      sendToBackground(pageContent);
    }
    
  } catch (error) {
    console.error("❌ Content extraction error:", error);
    // Fallback to simple body text
    const bodyContent = document.body?.innerText || "";
    sendToBackground(bodyContent);
  }
}

function extractMainContent() {
  // Strategy 1: Try to find main content areas
  const mainContent = findMainContentElement();
  if (mainContent) return cleanText(mainContent);
  
  // Strategy 2: Extract from common content selectors
  const contentFromSelectors = extractFromContentSelectors();
  if (contentFromSelectors.length > 100) return contentFromSelectors;
  
  // Strategy 3: Smart body text extraction (less aggressive)
  return extractSmartBodyText();
}

function findMainContentElement() {
  const mainSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '#main-content',
    '.content',
    '#content',
    '.entry-content',
    '.post-content',
    '.article-content',
    '.story-content',
    '.page-content'
  ];
  
  for (const selector of mainSelectors) {
    const element = document.querySelector(selector);
    if (element && hasSubstantialText(element)) {
      console.log("✅ Found main content with selector:", selector);
      return element.innerText;
    }
  }
  return null;
}

function extractFromContentSelectors() {
  const contentSelectors = [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'section'
  ];
  
  let content = '';
  contentSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // Only take elements that are likely content (not navigation)
      if (isLikelyContent(element) && hasSubstantialText(element)) {
        content += element.innerText + '\n\n';
      }
    });
  });
  
  return cleanText(content);
}

function extractSmartBodyText() {
  const body = document.body;
  if (!body) return "";
  
  // Get all text content and filter intelligently
  const allText = body.innerText;
  const lines = allText.split('\n')
    .map(line => line.trim())
    .filter(line => {
      // Keep lines that are likely content
      return isLikelyContentLine(line);
    });
  
  return lines.join('\n\n');
}

function isLikelyContent(element) {
  // Check if element is likely to be content (not navigation)
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  const className = element.className.toLowerCase();
  const id = element.id.toLowerCase();
  
  // Exclude obvious navigation elements
  const excludedSelectors = [
    'nav', 'header', 'footer', 'aside', 'menu',
    '.nav', '.navbar', '.navigation', '.menu',
    '.header', '.footer', '.sidebar'
  ];
  
  for (const selector of excludedSelectors) {
    if (element.closest(selector)) {
      return false;
    }
  }
  
  // Exclude by class/id patterns
  const excludedPatterns = [
    /nav/, /menu/, /header/, /footer/, /sidebar/, /advertisement/, /ad-/
  ];
  
  if (excludedPatterns.some(pattern => 
    pattern.test(className) || pattern.test(id))) {
    return false;
  }
  
  return true;
}

function isLikelyContentLine(line) {
  if (!line || line.length < 20) return false;
  
  const lower = line.toLowerCase();
  
  // Exclude navigation and UI text
  const excludePatterns = [
    /^home$/i,
    /^about$/i,
    /^contact$/i,
    /^login$/i,
    /^sign up$/i,
    /^search$/i,
    /^menu$/i,
    /^navigation$/i,
    /^skip to content$/i,
    /^jump to navigation$/i,
    /^cookie policy$/i,
    /^privacy policy$/i,
    /^terms of service$/i,
    /^follow us$/i,
    /^share this$/i,
    /^related articles$/i,
    /^you may also like$/i,
    /^advertisement$/i,
    /^sponsored$/i
  ];
  
  if (excludePatterns.some(pattern => pattern.test(line))) {
    return false;
  }
  
  // Exclude very short lines or lines that are mostly symbols
  if (line.length < 25 && !line.match(/[a-zA-Z]/)) {
    return false;
  }
  
  // Include lines that have substantial text content
  const wordCount = line.split(/\s+/).length;
  return wordCount >= 4;
}

function hasSubstantialText(element) {
  if (!element) return false;
  const text = element.innerText || "";
  const clean = text.trim();
  return clean.length > 50 && clean.split(/\s+/).length >= 10;
}

function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

function sendToBackground(content) {
  // Show loading indicator
  showLoadingIndicator();
  
  console.log("📤 Sending content to background, length:", content.length);
  console.log("📝 First 200 chars:", content.substring(0, 200));
  
  // Send to background for processing
  chrome.runtime.sendMessage({ 
    action: "process_text", 
    data: content.substring(0, 20000)
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("❌ Error sending to background:", chrome.runtime.lastError);
    } else {
      console.log("✅ Content sent to background successfully");
    }
  });
}

// ... KEEP ALL YOUR EXISTING UI FUNCTIONS (they remain the same)

function showLoadingIndicator() {
  console.log("⏳ Showing loading indicator...");
  
  const existing = document.getElementById("simplify-loading");
  if (existing) existing.remove();
  
  const loadingDiv = document.createElement("div");
  loadingDiv.id = "simplify-loading";
  loadingDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4285f4;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
    ">
      🔄 Simplifying Content...
    </div>
  `;
  document.body.appendChild(loadingDiv);
}

function removeLoadingIndicator() {
  const existing = document.getElementById("simplify-loading");
  if (existing) {
    console.log("🗑️ Removing loading indicator");
    existing.remove();
  }
}

// Listen for processed results
chrome.runtime.onMessage.addListener((message) => {
  console.log("📨 Content script received background message:", message.action);

  if (message.action === "display_result") {
    console.log("✅ Displaying result...");
    removeLoadingIndicator();
    displayResult(message.data);
  } else if (message.action === "display_error") {
    console.log("❌ Displaying error...");
    removeLoadingIndicator();
    displayError(message.data);
  }
});

function displayResult(content) {
  console.log("🖥️ Displaying result box");
  
  const existing = document.getElementById("simplify-result");
  if (existing) existing.remove();
  
  const resultDiv = document.createElement("div");
  resultDiv.id = "simplify-result";
  resultDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      color: #333;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      max-width: 400px;
      max-height: 500px;
      overflow-y: auto;
      z-index: 10001;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      border: 2px solid #4285f4;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #4285f4;">🧠 Simplified Content</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
      <div style="white-space: pre-wrap;">${content}</div>
    </div>
  `;
  
  document.body.appendChild(resultDiv);
  console.log("✅ Result box displayed");
}

function displayError(message) {
  console.log("🟡 Displaying error:", message);
  
  const errorDiv = document.createElement("div");
  errorDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10002;
      font-family: Arial, sans-serif;
      max-width: 300px;
      font-weight: bold;
    ">
      ❌ ${message}
    </div>
  `;
  
  document.body.appendChild(errorDiv);
  setTimeout(() => {
    errorDiv.remove();
    console.log("🗑️ Error box removed");
  }, 5000);
}
