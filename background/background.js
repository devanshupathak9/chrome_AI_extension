chrome.runtime.onMessage.addListener(async (message, sender) => {
    if (message.action === "process_text") {
        console.log('🎯 Processing text with AI...');
        console.log('📊 Content length received:', message.data?.length);
        
        try {
            let simplified;
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
            const fallbackSummary = createLenientSummary(message.data);
            if (sender.tab?.id) {
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: "display_result",
                    data: fallbackSummary,
                });
            }
        }
    }
});

async function isGeminiNanoAvailable() {
    try {
        if (typeof ai === 'undefined') {
            console.log('❌ ai object not found');
            return false;
        }
        
        const available = await ai.languageModel.available();
        console.log('🔍 Gemini Nano available:', available);
        return available;
        
    } catch (error) {
        console.log('❌ Gemini Nano check failed:', error);
        return false;
    }
}
async function summarizeWithGeminiNano(text) {
    try {
        console.log('🚀 Starting Gemini Nano summarization...');
        const model = await ai.languageModel.create({
            systemPrompt: "You are a helpful AI assistant that creates clear, concise summaries. Focus on extracting the main ideas and key information from the text. Keep the summary easy to understand and well-structured."
        });
        const cleanText = text.substring(0, 15000);
        
        const prompt = `Please summarize the following text in a clear, concise way. Focus on the main points and key information:\n\n${cleanText}`;
        console.log('📝 Sending prompt to Gemini Nano...');
        
        const response = await model.prompt(prompt);
        console.log('✅ Gemini Nano response received');
        return `🤖 AI-Powered Summary (Gemini Nano):\n\n${response}`;
    } catch (error) {
        console.error('❌ Gemini Nano summarization failed:', error);
        throw error;
    }
}

function createImprovedSummary(text) {
    try {
        console.log('📝 Creating summary from text length:', text.length);
        if (!text || text.length < 50) {
            return "The page doesn't contain enough text content to summarize. Try a content-rich page like a news article or blog post.";
        }
        
        const sentences = text.split(/[.!?]+/)
            .filter(sentence => {
                const trimmed = sentence.trim();
                const wordCount = trimmed.split(/\s+/).length;
                
                // More lenient criteria
                return trimmed.length > 10 &&      // Shorter sentences OK
                       wordCount >= 3 &&           // Only 3+ words
                       trimmed.length < 500 &&     // Longer sentences OK
                       !trimmed.match(/^\s*$/);    // Not just whitespace
            })
            .slice(0, 8) // Take more sentences
            .map(s => s.trim() + '.');
        
        console.log('📊 Sentences found:', sentences.length);
        
        if (sentences.length === 0) {
            return createLenientSummary(text);
        }
        
        return `📖 Page Summary:\n\n${sentences.join(' ')}\n\n✨ Summary created from page content`;
        
    } catch (error) {
        console.error('Summary error:', error);
        return createLenientSummary(text);
    }
}

function createLenientSummary(text) {
    if (!text) return "No content found on this page.";
    
    // Just take the first reasonable chunk of text
    const reasonableText = text.substring(0, 1000);
    const firstParagraph = reasonableText.split('\n\n')[0] || reasonableText.split('.')[0] + '.';
    
    return `📄 Content Preview:\n\n${firstParagraph.substring(0, 500)}...\n\n🔍 This page contains content that may not be ideal for summarization.`;
}
