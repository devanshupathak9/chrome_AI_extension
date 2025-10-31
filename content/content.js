console.log("🚀 Content script loaded successfully");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📩 Content script received message:", message);

  if (message.action === "extract_content") {
    console.log("🎯 Starting content extraction...");
    extractAndSendContent();
  }
});

function extractAndSendContent() {
  try {
    console.log("🔍 Extracting page content...");

    const pageContent = extractMainContent();
    console.log("📊 Extracted content length:", pageContent.length);
    
    if (pageContent.length < 100) {
      console.log("⚠️ Very little content extracted, using fallback");
      // Fallback to body text if main content extraction fails
      const fallbackContent = document.body?.innerText || "No content found";
      sendToBackground(fallbackContent);
    } else {
      sendToBackground(pageContent);
    }
    
  } catch (error) {
    console.error("❌ Content extraction error:", error);
    // Fallback to simple body text
    const fallbackContent = document.body?.innerText || "Error extracting content";
    sendToBackground(fallbackContent);
  }
}

function extractMainContent() {
  // Try to find main content areas first
  const mainContentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.content',
    '.main-content',
    '#content',
    '.post',
    '.story',
    '.article',
    '.page-content',
    '.entry-content',
    '.post-content'
  ];
  
  for (const selector of mainContentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log("✅ Found main content with selector:", selector);
      return cleanText(element.innerText);
    }
  }
  
  // Fallback: Try to find the largest text block
  console.log("🔍 No main content found, searching for largest text block...");
  return findLargestTextBlock();
}

function findLargestTextBlock() {
  // Get all paragraph-like elements
  const contentElements = [
    ...document.querySelectorAll('p, div, section, h1, h2, h3, h4, h5, h6, li, span')
  ];
  
  // Filter elements with substantial text content
  const elementsWithContent = contentElements.filter(el => {
    const text = el.innerText.trim();
    return text.length > 50 && 
           !text.match(/^(http|www|@)/) && // Not URLs
           !el.closest('nav, header, footer, aside, menu, .nav, .header, .footer') && // Not in navigation
           isVisible(el);
  });
  
  // Sort by text length and take the largest ones
  elementsWithContent.sort((a, b) => b.innerText.length - a.innerText.length);
  
  // Combine top 5 largest elements
  const mainContent = elementsWithContent.slice(0, 5)
    .map(el => el.innerText)
    .join('\n\n');
  
  return cleanText(mainContent || document.body.innerText);
}

function isVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         element.offsetWidth > 0 && 
         element.offsetHeight > 0;
}

function cleanText(text) {
  return text
    .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
    .replace(/\t/g, ' ')         // Replace tabs with spaces
    .replace(/\s+/g, ' ')        // Collapse multiple spaces
    .trim();
}

function sendToBackground(content) {
  showLoadingIndicator();
  
  console.log("📤 Sending content to background, length:", content.length);
  
  // Send to background for processing
  chrome.runtime.sendMessage({ 
    action: "process_text", 
    data: content.substring(0, 20000) // Increased limit
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("❌ Error sending to background:", chrome.runtime.lastError);
    } else {
      console.log("✅ Content sent to background successfully");
    }
  });
}

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
  
  // Remove existing result
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

// Temporary debug function - uncomment to test content extraction
/*
function debugContentExtraction() {
  const mainContent = extractMainContent();
  console.log('=== DEBUG CONTENT EXTRACTION ===');
  console.log('Extracted content length:', mainContent.length);
  console.log('First 500 chars:', mainContent.substring(0, 500));
  console.log('=== END DEBUG ===');
}
*/
