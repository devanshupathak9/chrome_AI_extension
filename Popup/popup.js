// popup.js - WITH DEBUGGING
// popup.js - WITH DEBUGGING AND KEY SHORTCUT
document.getElementById("simplifyBtn").addEventListener("click", handleSimplify);

document.addEventListener("keydown", (event) => {
  // Trigger on 'S' or 's' key press (optional: with Ctrl)
  if (event.key.toLowerCase() === "s" && !event.repeat) {
    console.log("Shortcut 'S' pressed");
    handleSimplify();
  }
});

async function handleSimplify() {
  try {
    console.log("Simplify triggered");

    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log("Active tab found:", tab?.id);

    if (!tab) {
      console.error("No active tab found");
      return;
    }

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: "extract_content" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        injectContentScript(tab.id);
      } else {
        console.log("Message sent successfully");
      }
    });

  } catch (error) {
    console.error("Popup error:", error);
  }
}

// Fallback: Inject content script if not loaded
function injectContentScript(tabId) {
  console.log("Attempting to inject content script...");
  
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content/content.js']
  })
  .then(() => {
    console.log("Content script injected successfully");
    chrome.tabs.sendMessage(tabId, { action: "extract_content" });
  })
  .catch(error => {
    console.error("Failed to inject content script:", error);
  });
}


// document.getElementById("simplifyBtn").addEventListener("click", async () => {
//   try {
//     console.log("Simplify button clicked");
    
//     // Get the active tab
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     console.log("Active tab found:", tab.id);
    
//     if (!tab) {
//       console.error("No active tab found");
//       return;
//     }
    
//     // Send message to content script
//     chrome.tabs.sendMessage(tab.id, { action: "extract_content" }, (response) => {
//       if (chrome.runtime.lastError) {
//         console.error("Error sending message:", chrome.runtime.lastError);
//         // Content script might not be loaded, try injecting it
//         injectContentScript(tab.id);
//       } else {
//         console.log("Message sent successfully");
//       }
//     });
    
//   } catch (error) {
//     console.error("Popup error:", error);
//   }
// });

// // Fallback: Inject content script if not loaded
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
