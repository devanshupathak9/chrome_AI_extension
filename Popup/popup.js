document.getElementById("simplifyBtn").addEventListener("click", async () => {
  // Get the active tab in the current window
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: "extract_content" });
});


document.getElementById("askBtn").addEventListener("click", async () => {
  const input = document.getElementById("input").value.trim();
  const outputEl = document.getElementById("output");

  if (!input) {
    outputEl.textContent = "Please enter a question.";
    return;
  }
  outputEl.textContent = "Thinking...";
  try {
    outputEl.textContent = "Generating your response...";
  }
  catch(error){
    console.error(error);
    outputEl.textContent = "Internal Error!!:)";
  }
});