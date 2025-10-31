// Popup/popup.js - FIXED MESSAGE HANDLING
document.addEventListener('DOMContentLoaded', function() {
    const simplifyBtn = document.getElementById('simplifyBtn');
    
    simplifyBtn.addEventListener('click', async () => {
        console.log('🔘 Simplify button clicked');
        
        try {
            const [tab] = await chrome.tabs.query({ 
                active: true, 
                currentWindow: true 
            });
            
            if (!tab) {
                console.error('❌ No active tab found');
                return;
            }
            
            console.log('📋 Active tab:', tab.id, tab.url);
            
            // First, try to send message to existing content script
            chrome.tabs.sendMessage(tab.id, { action: "extract_content" })
                .then(() => {
                    console.log('✅ Message sent successfully to existing content script');
                })
                .catch(async (error) => {
                    console.log('⚠️ Content script not ready, injecting...', error.message);
                    
                    try {
                        // Inject the content script
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content/content.js']
                        });
                        
                        console.log('✅ Content script injected successfully');
                        
                        // Wait a moment for the content script to load, then send message
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tab.id, { action: "extract_content" })
                                .then(() => {
                                    console.log('✅ Message sent after injection');
                                })
                                .catch((retryError) => {
                                    console.error('❌ Failed to send message after injection:', retryError);
                                });
                        }, 100);
                        
                    } catch (injectError) {
                        console.error('❌ Failed to inject content script:', injectError);
                    }
                });
            
        } catch (error) {
            console.error('❌ Popup error:', error);
        }
    });
});
