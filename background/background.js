chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === "process_text") {
    console.log('🎯 Processing text for summarization...');
    console.log('📊 Content length:', message.data?.length);
    try {
      let summary;

      if (await isGeminiNanoAvailable()) {
        console.log('🤖 Using Gemini Nano for AI summarization...');
        summary = await summarizeWithGeminiNano(message.data);
      } else {
        console.log('📊 Using smart text summarization...');
        summary = createSmartSummary(message.data);
      }

      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "display_result",
          data: summary,
        });
      }
    } catch (error) {
      console.error('❌ Summarization failed:', error);
      const fallback = createLenientSummary(message.data);
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "display_result",
          data: fallback,
        });
      }
    }
  }
});

async function isGeminiNanoAvailable() {
  try {
    if (!('LanguageModel' in self)) {
      console.log('❌ Prompt API is not supported in this browser.');
      return false;
    }

    const availability = await LanguageModel.availability();
    console.log('🔍 Gemini Nano availability:', availability);

    // It's "available", "downloadable", "downloading", or "unavailable"
    return availability === "available" || availability === "downloadable";
  } catch (error) {
    console.log('❌ Gemini Nano availability check failed:', error);
    return false;
  }
}

async function summarizeWithGeminiNano(text) {
  try {
    // Create a session. This will trigger the download if needed.
    const session = await LanguageModel.create({
      monitor(monitor) {
        monitor.addEventListener('downloadprogress', (event) => {
          console.log(`Download progress: ${(event.loaded / event.total * 100).toFixed(1)}%`);
        });
      }
    });

    console.log("Sending prompt to the model!!");
    const prompt = `
    You are a helpful AI assistant that summarizes web pages clearly and concisely.
    
    The following text is extracted from a webpage. 
    Please:
    1. Summarize the key ideas and important details.
    2. Present the summary in a structured, reader-friendly format with headings or bullet points if useful.
    3. Remove ads, navigation text, or irrelevant content.
    4. Keep the language simple, clear, and engaging.
    5. End with a one-line takeaway describing what the page is mainly about.
    
    --- Webpage Content ---
    ${text}
    `;
    const summary = await session.prompt(prompt);
    console.log("Response Generated!!");
    
    return summary;
  } catch (error) {
    console.error('❌ Summarization with Gemini Nano failed:', error);
    throw error;
  }
}

function createSmartSummary(text) {
  if (!text || text.length < 50) {
    return "The page doesn't contain enough readable content to summarize. Try a content-rich page like a news article or blog post.";
  }

  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200)
    .filter(s => !isNavigationSentence(s))
    .slice(0, 5)
    .map(s => s + '.');

  if (sentences.length === 0) {
    return createLenientSummary(text);
  }

  const summary = sentences.join(' ');
  return `📖 Summary:\n\n${summary}\n\n✨ Created using text analysis`;
}

function isNavigationSentence(sentence) {
  const lower = sentence.toLowerCase();
  const navWords = [
    'home', 'about', 'contact', 'login', 'sign up', 'search',
    'menu', 'navigation', 'jump to', 'skip to', 'cookie',
    'privacy', 'terms', 'policy', 'follow', 'share', 'like',
    'subscribe', 'advertisement', 'sponsored'
  ];

  return navWords.some(word => lower.includes(word));
}

function createLenientSummary(text) {
  if (!text) return "No content found on this page.";

  // Just take the first substantial part of the text
  const firstSubstantial = text.split('\n\n')
    .find(paragraph => paragraph.length > 30 && paragraph.length < 500) ||
    text.substring(0, 300);

  return `📄 Content Overview:\n\n${firstSubstantial}...\n\n💡 Showing page content`;
}

function createFallbackSummary(content) {
  // Find the first meaningful chunk of text
  const meaningfulChunk = content.substring(0, 200).split('.')[0] + '.';
  return `This page appears to be about: ${meaningfulChunk}`;
}
