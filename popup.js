// popup.js
document.getElementById("askBtn").addEventListener("click", async () => {
    const input = document.getElementById("input").value.trim();
    const outputEl = document.getElementById("output");
  
    if (!input) {
      outputEl.textContent = "Please enter a question.";
      return;
    }
  
    outputEl.textContent = "Thinking...";
  
    try {
      // Create a local AI session using Chrome's built-in Gemini Nano
      const session = await ai.createTextSession();
  
      // Send your prompt
      const response = await session.prompt(input);
  
      // Show the AI's reply
      outputEl.textContent = response;
    } catch (error) {
      console.error(error);
      outputEl.textContent = "Error: AI model not available or Chrome version unsupported.";
    }
  });
  