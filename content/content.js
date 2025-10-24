// content.js - SIMPLIFIED WORKING VERSION
console.log("Content script loaded successfully");

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message);
  
  if (message.action === "extract_content") {
    console.log("Extracting page content...");
    
    // Simple text extraction
    const textContent = document.body.innerText || "No text content found";
    console.log("Text extracted, length:", textContent.length);
    
    // Send to background for processing
    chrome.runtime.sendMessage({ 
      action: "process_text", 
      data: textContent.substring(0, 5000) // Limit length
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending to background:", chrome.runtime.lastError);
      } else {
        console.log("Message sent to background successfully");
      }
    });
  }
  
  return true;
});

// Listen for processed results
chrome.runtime.onMessage.addListener((message) => {
  console.log("Result message received:", message.action);
  
  if (message.action === "display_result") {
    displayResult(message.data);
  } else if (message.action === "display_error") {
    displayError(message.data);
  }
});

function displayResult(content) {
  console.log("Displaying result");
  
  // Remove any existing result box
  const existingBox = document.getElementById("simplify-result");
  if (existingBox) existingBox.remove();
  
  // Create result box
  const resultBox = document.createElement("div");
  resultBox.id = "simplify-result";
  resultBox.innerHTML = `
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
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      border: 2px solid #4285f4;
    ">
      <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0; color: #4285f4;">🧠 Simplified Content</h3>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
          margin-left: auto;
        ">×</button>
      </div>
      <div style="white-space: pre-wrap;">${content}</div>
    </div>
  `;
  
  document.body.appendChild(resultBox);
}

function displayError(message) {
  const errorBox = document.createElement("div");
  errorBox.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;
  errorBox.textContent = `❌ ${message}`;
  document.body.appendChild(errorBox);
  
  setTimeout(() => errorBox.remove(), 5000);
}
