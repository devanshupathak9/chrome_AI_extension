// background.js - WORKING VERSION
chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === "process_text") {
    console.log("Processing content for simplification...");
    
    try {
      // Use improved text summarization (no external AI dependency)
      const simplified = createSmartSummary(message.data);
      
      // Send result back
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "display_result",
          data: simplified,
        });
      }
    } catch (error) {
      console.error("Processing failed:", error);
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "display_error",
          data: "Failed to simplify content. Please try again."
        });
      }
    }
  }
});

function createSmartSummary(text) {
  // Clean and prepare the text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Split into sentences (better method)
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Simple algorithm to find important sentences
  const importantSentences = sentences
    .filter(sentence => {
      // Filter out very short or very long sentences
      const wordCount = sentence.split(' ').length;
      return wordCount > 5 && wordCount < 30;
    })
    .slice(0, 5) // Take first 5 reasonable sentences
    .map(sentence => sentence.trim() + '.');
  
  if (importantSentences.length === 0) {
    return "No meaningful content found to simplify. Try a different page with more text content.";
  }
  
  return `📝 Simplified Summary:\n\n${importantSentences.join(' ')}\n\n✨ Summary created using text analysis.`;
}
