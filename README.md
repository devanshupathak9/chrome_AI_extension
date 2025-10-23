# 🧠 Chrome AI Extension

A Chrome Extension that uses **Chrome’s built-in Gemini Nano AI APIs** (Prompt, Summarizer, Rewriter, Proofreader, and more) to enhance your productivity — summarize, rewrite, and proofread text instantly right inside your browser.

---
## 🧩 Extension Core Components

- **`manifest.json`**  
  The mandatory configuration file for every Chrome Extension.  
  It defines metadata such as the extension’s **name**, **version**, and **description**, as well as its **permissions**, **entry points**, and **scripts**.

- **Content Script (`content.js`)**  
  A JavaScript file that runs in the context of a web page.  
  It can interact with the page’s DOM and is useful when you want to **analyze, rewrite, or summarize** webpage text using APIs like the **Rewriter API** or **Summarizer API**.

- **Background Script (`background.js`)**  
  Runs in the background (as a service worker in Manifest V3).  
  It handles long-running tasks, message passing, and context menu actions — such as **triggering AI actions**, **listening for user events**, or **managing extension state**.

- **Popup HTML (`popup.html`)**  
  The small window that appears when you click the extension’s icon in Chrome.  
  It provides the **user interface** — like buttons, input boxes, or output areas — to interact with AI models.  
  No backend or external API calls are required if you’re using **Chrome’s built-in Gemini Nano APIs**.

---

## ⚙️ Loading Your Chrome Extension

1. **Open Google Chrome.**  
2. In the address bar, type:  
```bash
chrome://extensions/
```
3. **Turn on Developer Mode** (toggle switch in the top-right corner).  
4. Click **Load unpacked.**  
5. Select your project folder (e.g. `chrome-ai-extension/`).  
6. You should now see your extension listed.  
7. **Pin it** to the toolbar for quick access.  
8. Click the extension icon to open and test it.

---
