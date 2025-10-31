// background/background.js - FIXED PROMPT API
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "process_text") {
        console.log('🎯 Processing text for summarization...');
        console.log('📊 Content length:', message.data?.length);
        
        try {
            let summary;
            
            if (await isPromptAPIAvailable()) {
                console.log('🤖 Using Prompt API for AI summarization...');
                summary = await createAISummary(message.data);
            } else {
                console.log('📊 Using text analysis (AI not available)...');
                summary = createTextSummary(message.data);
            }
            
            if (sender.tab?.id) {
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: "display_result",
                    data: summary,
                });
            }
            
        } catch (error) {
            console.error('❌ Summarization failed:', error);
            const fallback = createFallbackSummary(message.data);
            if (sender.tab?.id) {
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: "display_result",
                    data: fallback,
                });
            }
        }
    }
    
    // Don't return true - we're not using sendResponse asynchronously
    return false;
});

// Check if Prompt API is available
async function isPromptAPIAvailable() {
    try {
        if (typeof ai === 'undefined') {
            console.log('❌ AI object not available');
            return false;
        }
        
        if (!ai.prompt) {
            console.log('❌ Prompt API not available');
            return false;
        }
        
        const canCreate = await ai.prompt.canCreate();
        console.log('🔍 Prompt API canCreate:', canCreate);
        return canCreate;
        
    } catch (error) {
        console.log('❌ Prompt API check failed:', error);
        return false;
    }
}

// Create AI summary using Prompt API
async function createAISummary(text) {
    try {
        console.log('🚀 Creating AI summary...');
        
        // Clean the text for better results
        const cleanText = cleanContentForAI(text);
        
        const prompt = `Please provide a concise, easy-to-understand summary of the following content. Focus on the main topic and key information:

${cleanText}`;

        console.log('📝 Sending prompt to AI...');
        
        // Use the Prompt API
        const result = await ai.prompt(prompt, {
            systemPrompt: "You are a helpful AI assistant that creates clear, concise summaries. Respond in a natural, conversational tone and focus on the most important information."
        });
        
        console.log('✅ AI response received');
        
        return `🤖 AI Summary:\n\n${result}`;
        
    } catch (error) {
        console.error('❌ AI summarization failed:', error);
        throw error;
    }
}

function cleanContentForAI(text) {
    if (!text) return "";
    
    // Remove common noise and limit length
    return text
        .split('\n')
        .filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 10 && 
                   !trimmed.match(/^\s*$/) &&
                   !trimmed.match(/^[0-9\s]+$/) &&
                   !trimmed.toLowerCase().includes('color') &&
                   !trimmed.toLowerCase().includes('beta') &&
                   !trimmed.toLowerCase().includes('automatic') &&
                   !trimmed.toLowerCase().includes('light') &&
                   !trimmed.toLowerCase().includes('dark');
        })
        .join('\n')
        .replace(/\s+/g, ' ')
        .substring(0, 8000)
        .trim();
}

function createTextSummary(text) {
    if (!text || text.trim().length < 100) {
        return "This page doesn't contain enough readable content to summarize. Try a content-rich page like Wikipedia or a news article.";
    }
    
    // Simple text-based summarization
    const sentences = extractGoodSentences(text);
    
    if (sentences.length === 0) {
        return createFallbackSummary(text);
    }
    
    const summary = sentences.join(' ');
    return `📖 Summary:\n\n${summary}\n\n💡 Created using text analysis`;
}

function extractGoodSentences(text) {
    return text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(sentence => {
            // Filter for good summary sentences
            const words = sentence.split(/\s+/);
            const lower = sentence.toLowerCase();
            
            return sentence.length > 25 && 
                   sentence.length < 150 &&
                   words.length >= 5 &&
                   words.length <= 25 &&
                   !lower.includes('wikipedia') &&
                   !lower.includes('disambiguation') &&
                   !lower.includes('color') &&
                   !lower.includes('beta') &&
                   hasSubstantialContent(sentence);
        })
        .slice(0, 3)
        .map(s => s + '.');
}

function hasSubstantialContent(sentence) {
    // Check if sentence has meaningful content (not just UI text)
    const hasVerbs = /(\bis\b|\bare\b|\bwas\b|\bwere\b|\bhave\b|\bhas\b|\bdo\b|\bdoes\b)/i.test(sentence);
    const hasNouns = /(\bthe\b|\ba\b|\ban\b|\bthis\b|\bthat\b|\bthese\b|\bthose\b)/i.test(sentence);
    return hasVerbs && hasNouns;
}

function createFallbackSummary(text) {
    if (!text) return "Unable to summarize this page's content.";
    
    // Find the first meaningful part
    const meaningfulPart = text.split(/[.!?]+/)
        .map(s => s.trim())
        .find(s => s.length > 20 && s.length < 100 && hasSubstantialContent(s)) ||
        text.substring(0, 150).trim();
    
    return `📄 Content Overview:\n\n${meaningfulPart}...\n\n🔍 Showing extracted content`;
}

// Debug AI availability on startup
chrome.runtime.onInstalled.addListener(() => {
    console.log('🔧 Extension installed');
    checkAIAvailability();
});

async function checkAIAvailability() {
    try {
        const available = await isPromptAPIAvailable();
        console.log('🎯 Final AI availability:', available);
    } catch (error) {
        console.log('❌ AI availability check failed:', error);
    }
}
