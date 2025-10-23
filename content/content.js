// content.js

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "extract_content") {
      console.log("Extracting page content...");
  
      // Extract visible text from the page
      const textContent = document.body.innerText;
  
      // Send it to background for processing
      chrome.runtime.sendMessage({ action: "process_text", data: textContent });
    }
  
    return true; // Keeps the channel open for async response if needed
  });
  
  // Listen for processed text from background.js
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "display_result") {
      // Create or update a floating box on the page
      let existingBox = document.getElementById("simplify-box");
      if (!existingBox) {
        existingBox = document.createElement("div");
        existingBox.id = "simplify-box";
        existingBox.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          background: #f9f9f9;
          color: #333;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          max-width: 300px;
          z-index: 999999;
        `;
        document.body.appendChild(existingBox);
      }
      existingBox.textContent = message.data;
    }
  });
  