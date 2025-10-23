// background.js

chrome.runtime.onMessage.addListener(async (message, sender) => {
    if (message.action === "process_text") {
      console.log("Received content for processing.");
  
      // Example simplification (mock processing)
      const simplified = message.data;
    //   simplifyText(message.data);
  
      // Send result back to the same tab
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "display_result",
          data: simplified,
        });
      }
    }
  });
  
  // A dummy simplification function
  function simplifyText(text) {
    const firstFewSentences = text.split(". ").slice(0, 3).join(". ");
    return "Simplified Summary:\n" + firstFewSentences + "...";
  }
  