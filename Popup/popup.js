// document.getElementById("simplifyBtn").addEventListener("click", async () => {
//   try {
//     console.log("Simplify button clicked");
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     console.log("Active tab found:", tab.id);
    
//     if (!tab) {
//       console.error("No active tab found");
//       return;
//     }
    
//     chrome.tabs.sendMessage(tab.id, { action: "extract_content" }, (response) => {
//       if (chrome.runtime.lastError) {
//         console.error("Error sending message:", chrome.runtime.lastError);
//         injectContentScript(tab.id);
//       } else {
//         console.log("Message sent successfully");
//       }
//     });
//   } catch (error) {
//     console.error("Popup error:", error);
//   }
// });

// function injectContentScript(tabId) {
//   console.log("Attempting to inject content script...");
  
//   chrome.scripting.executeScript({
//     target: { tabId: tabId },
//     files: ['content/content.js']
//   })
//   .then(() => {
//     console.log("Content script injected successfully");
//     // Retry sending the message
//     chrome.tabs.sendMessage(tabId, { action: "extract_content" });
//   })
//   .catch(error => {
//     console.error("Failed to inject content script:", error);
//   });
// }

document.getElementById("simplifyBtn").addEventListener("click", async () => {
  try {
    console.log("Simplify button clicked");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log("Active tab found:", tab.id);
    
    if (!tab) {
      console.error("No active tab found");
      return;
    }
    
    chrome.tabs.sendMessage(tab.id, { action: "extract_content" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        injectContentScript(tab.id);
      } else {
        console.log("Message sent successfully");
      }
    });

    // Hide the extension popup
    // window.close();
  } catch (error) {
    console.error("Popup error:", error);
  }
});

function injectContentScript(tabId) {
  console.log("Attempting to inject content script...");
  
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content/content.js']
  })
  .then(() => {
    console.log("Content script injected successfully");
    // Retry sending the message
    chrome.tabs.sendMessage(tabId, { action: "extract_content" });
  })
  .catch(error => {
    console.error("Failed to inject content script:", error);
  });
}
