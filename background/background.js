// background/background.js - UPDATED FOR CHROME 143
chrome.runtime.onMessage.addListener(async (message, sender) => {
    if (message.action === "process_text") {
        console.log('🎯 Processing text with AI...');
        
        try {
            let simplified;
            
            // Try Gemini Nano first
            if (await isGeminiNanoAvailable()) {
                console.log('🤖 Using Gemini Nano...');
                simplified = await summarizeWithGeminiNano(message.data);
            } else {
                console.log('📊 Using enhanced text analysis...');
                simplified = createImprovedSummary(message.data);
            }
            
            if (sender.tab?.id) {
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: "display_result",
                    data: simplified,
                });
            }
        } catch (error) {
            console.error('❌ Processing failed:', error);
            const fallbackSummary = createImprovedSummary(message.data);
            if (sender.tab?.id) {
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: "display_result",
                    data: fallbackSummary,
                });
            }
        }
    }
});

// Check if Gemini Nano is available
async function isGeminiNanoAvailable() {
    try {
        // Check for the modern API
        if (typeof ai === 'undefined') {
            console.log('❌ ai object not found');
            return false;
        }
        
        // Check for language model availability
        const available = await ai.languageModel.available();
        console.log('🔍 Gemini Nano available:', available);
        return available;
        
    } catch (error) {
        console.log('❌ Gemini Nano check failed:', error);
        return false;
    }
}

// Modern Gemini Nano implementation
async function summarizeWithGeminiNano(text) {
    try {
        console.log('🚀 Starting Gemini Nano summarization...');
        
        // Create model with modern API
        const model = await ai.languageModel.create({
            systemPrompt: "You are a helpful AI assistant that creates clear, concise summaries. Focus on extracting the main ideas and key information from the text. Keep the summary easy to understand and well-structured."
        });
        
        // Prepare text (limit size)
        const cleanText = text.substring(0, 15000);
        const prompt = `Please summarize the following text in a clear, concise way. Focus on the main points and key information:\n\n${cleanText}`;
        
        console.log('📝 Sending prompt to Gemini Nano...');
        
        // Generate response
        const response = await model.prompt(prompt);
        
        console.log('✅ Gemini Nano response received');
        
        return `🤖 AI-Powered Summary (Gemini Nano):\n\n${response}`;
        
    } catch (error) {
        console.error('❌ Gemini Nano summarization failed:', error);
        throw error;
    }
}

// Enhanced text analysis fallback
function createImprovedSummary(text) {
    try {
        const cleanText = text.replace(/\s+/g, ' ').trim();
        
        // Remove common web page noise
        const filteredText = cleanText
            .split('\n')
            .filter(line => {
                const lower = line.toLowerCase().trim();
                return !lower.includes('cookie') &&
                       !lower.includes('privacy') &&
                       !lower.includes('menu') &&
                       !lower.includes('navigation') &&
                       !lower.includes('login') &&
                       !lower.includes('sign up') &&
                       line.trim().length > 20;
            })
            .join(' ');
        
        // Extract meaningful sentences
        const sentences = filteredText.split(/[.!?]+/)
            .filter(sentence => {
                const trimmed = sentence.trim();
                const words = trimmed.split(' ');
                return words.length > 4 && 
                       words.length < 25 &&
                       trimmed.length > 20 &&
                       !trimmed.match(/[<>{}]/) && // Filter HTML/Code
                       !trimmed.match(/^(http|www|@)/); // Filter URLs
            })
            .slice(0, 6)
            .map(s => s.trim() + '.');
        
        if (sentences.length === 0) {
            return "I couldn't extract meaningful content to summarize. The page might contain mostly navigation, code, or unstructured content.";
        }
        
        return `📊 Smart Summary:\n\n${sentences.join(' ')}\n\n💡 Using enhanced text analysis`;
        
    } catch (error) {
        return "Error processing content. Please try a different page.";
    }
}
