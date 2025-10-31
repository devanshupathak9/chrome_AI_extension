// content/content.js - IMPROVED CONTENT EXTRACTION
console.log("🚀 Content script loaded successfully");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📩 Content script received message:", message);

    if (message.action === "extract_content") {
        console.log("🎯 Extracting page content...");
        extractAndSendContent();
    }

    // Don't return true unless we're using sendResponse asynchronously
    return false;
});

function extractAndSendContent() {
    try {
        // Get clean content
        const content = getCleanContent();
        console.log("📊 Clean content length:", content.length);
        console.log("📝 First 200 chars:", content.substring(0, 200));
        
        if (content.length < 50) {
            console.log("⚠️ Very little content found");
            sendToBackground("Not enough meaningful content found on this page.");
            return;
        }
        
        sendToBackground(content);
        
    } catch (error) {
        console.error("❌ Content extraction error:", error);
        sendToBackground("Error extracting page content.");
    }
}

function getCleanContent() {
    // Remove unwanted elements first
    removeUnwantedElements();
    
    // Try multiple strategies to get clean content
    const strategies = [
        getMainContent,
        getArticleContent,
        getBodyContent
    ];
    
    for (const strategy of strategies) {
        const content = strategy();
        if (content && content.length > 100) {
            return cleanText(content);
        }
    }
    
    return "";
}

function removeUnwantedElements() {
    // Hide unwanted elements temporarily
    const unwantedSelectors = [
        'nav', 'header', 'footer', 'aside', 'menu',
        '.nav', '.navbar', '.navigation', '.menu',
        '.header', '.footer', '.sidebar',
        'script', 'style', 'noscript'
    ];
    
    unwantedSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.style.display = 'none';
        });
    });
}

function getMainContent() {
    const mainSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.main-content',
        '#main-content',
        '.content',
        '#content'
    ];
    
    for (const selector of mainSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent && element.textContent.trim().length > 100) {
            console.log("✅ Found main content with:", selector);
            return element.textContent;
        }
    }
    return null;
}

function getArticleContent() {
    const articleSelectors = [
        '.article',
        '.post-content',
        '.entry-content',
        '.story-content',
        '.page-content'
    ];
    
    for (const selector of articleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent && element.textContent.trim().length > 100) {
            console.log("✅ Found article content with:", selector);
            return element.textContent;
        }
    }
    return null;
}

function getBodyContent() {
    // Get body content but filter out navigation and UI text
    const body = document.body;
    if (!body) return "";
    
    const text = body.textContent || "";
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => {
            // Filter out navigation and UI elements
            return line.length > 20 && 
                   !isNavigationLine(line) &&
                   !isUILine(line);
        });
    
    return lines.join('\n\n');
}

function isNavigationLine(line) {
    const lower = line.toLowerCase();
    const navTerms = [
        'home', 'about', 'contact', 'login', 'sign up',
        'menu', 'navigation', 'search', 'jump to', 'skip to',
        'cookie', 'privacy', 'terms', 'policy',
        'follow', 'share', 'like', 'subscribe'
    ];
    
    return navTerms.some(term => lower.includes(term));
}

function isUILine(line) {
    const lower = line.toLowerCase();
    const uiTerms = [
        'read also', 'related articles', 'you may also like',
        'advertisement', 'sponsored', 'promoted',
        'click here', 'learn more', 'read more'
    ];
    
    return uiTerms.some(term => lower.includes(term));
}

function cleanText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
}

function sendToBackground(content) {
    showLoadingIndicator();
    
    console.log("📤 Sending to background, length:", content.length);
    
    chrome.runtime.sendMessage({ 
        action: "process_text", 
        data: content.substring(0, 10000)
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.log("⚠️ Background response error:", chrome.runtime.lastError);
        }
    });
}

function showLoadingIndicator() {
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
    if (existing) existing.remove();
}

chrome.runtime.onMessage.addListener((message) => {
    console.log("📨 Received:", message.action);

    if (message.action === "display_result") {
        removeLoadingIndicator();
        displayResult(message.data);
    } else if (message.action === "display_error") {
        removeLoadingIndicator();
        displayError(message.data);
    }
});

function displayResult(content) {
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
}

function displayError(message) {
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
    setTimeout(() => errorDiv.remove(), 5000);
}
