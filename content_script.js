// Content script for LLM Chat Navigator
// This script runs on LLM chat pages to index user messages and handle scrolling

// Site-specific configurations
const SITE_CONFIGS = {
  'gemini.google.com': {
    name: 'Gemini',
    selectors: {
      // User messages in Gemini (Updated selectors - Gemini changes frequently!)
      userMessages: '.query-content, [data-test-id*="user"], .user-query',
      // Alternative selectors to try (Gemini's UI changes often)
      fallbackSelectors: [
        'message-content[data-author="user"]',
        '[data-author="user"]',
        '.user-message',
        '[data-role="user"]',
        '.message[data-author="user"]',
        'div[class*="query"]',
        'div[class*="user"]'
      ],
      // Container to observe for new messages
      chatContainer: 'main, chat-window, .conversation-container, [role="main"]'
    }
  },
  'chat.openai.com': {
    name: 'ChatGPT',
    selectors: {
      // User messages in ChatGPT
      userMessages: '[data-message-author-role="user"]',
      fallbackSelectors: [
        '.request-:not(.response-)',
        '[data-testid*="user"]',
        '.user-message'
      ],
      chatContainer: 'main, .conversation-container'
    }
  },
  'chatgpt.com': {
    name: 'ChatGPT',
    selectors: {
      // Same as chat.openai.com
      userMessages: '[data-message-author-role="user"]',
      fallbackSelectors: [
        '.request-:not(.response-)',
        '[data-testid*="user"]',
        '.user-message'
      ],
      chatContainer: 'main, .conversation-container'
    }
  }
};

// Global state
let messageIndex = [];
let observer = null;
let currentConfig = null;
let messageIdCounter = 0;
let currentChatUrl = '';

// Initialize the content script
function init() {
  const hostname = window.location.hostname;
  
  // Store the current URL
  currentChatUrl = window.location.href;
  
  // Find matching site config
  for (const [domain, config] of Object.entries(SITE_CONFIGS)) {
    if (hostname.includes(domain)) {
      currentConfig = config;
      break;
    }
  }

  if (!currentConfig) {
    console.warn('[LLM Chat Navigator] No configuration found for this site');
    return;
  }

  // Initial scan of the page
  setTimeout(() => {
    scanPage();
    setupMutationObserver();
    setupUrlChangeDetection();
  }, 1000); // Wait for page to load
}

// Reset the message index (when switching chats)
function resetMessageIndex() {
  // Clear all existing IDs from DOM elements
  const oldElements = document.querySelectorAll('[data-chat-nav-id]');
  oldElements.forEach(el => el.removeAttribute('data-chat-nav-id'));
  
  // Reset global state
  messageIndex = [];
  messageIdCounter = 0;
  currentChatUrl = window.location.href;
  
  // Re-scan the new chat
  setTimeout(() => {
    scanPage();
  }, 500);
}

// Detect URL changes (chat switching)
function setupUrlChangeDetection() {
  // Check URL periodically
  setInterval(() => {
    const newUrl = window.location.href;
    if (newUrl !== currentChatUrl) {
      resetMessageIndex();
    }
  }, 1000); // Check every second
  
  // Also listen for history API changes (SPA navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    setTimeout(() => {
      if (window.location.href !== currentChatUrl) {
        resetMessageIndex();
      }
    }, 100);
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    setTimeout(() => {
      if (window.location.href !== currentChatUrl) {
        resetMessageIndex();
      }
    }, 100);
  };
}

// Scan the page for user messages
function scanPage() {
  if (!currentConfig) return;

  const selectors = currentConfig.selectors;
  let userMessages = [];

  // Try primary selector
  userMessages = Array.from(document.querySelectorAll(selectors.userMessages));

  // Try fallback selectors if primary fails
  if (userMessages.length === 0) {
    for (const fallbackSelector of selectors.fallbackSelectors) {
      try {
        userMessages = Array.from(document.querySelectorAll(fallbackSelector));
        if (userMessages.length > 0) {
          break;
        }
      } catch (error) {
        console.warn(`[LLM Chat Navigator] ⚠️ Error with selector ${fallbackSelector}:`, error);
      }
    }
  }

  // Process each message
  userMessages.forEach((element) => {
    processMessage(element);
  });
}

// Process a single message element
function processMessage(element) {
  // Check if already processed
  if (element.hasAttribute('data-chat-nav-id')) {
    return;
  }

  // Assign unique ID
  const messageId = messageIdCounter++;
  element.setAttribute('data-chat-nav-id', messageId);

  // Extract message text
  const text = extractMessageText(element);

  // Add to index
  messageIndex.push({
    id: messageId,
    text: text,
    timestamp: Date.now()
  });
}

// Extract text content from a message element
function extractMessageText(element) {
  let text = element.innerText || element.textContent || '';
  let attachmentInfo = [];

  // Check for images - be more specific
  const images = element.querySelectorAll('img[src]');
  
  if (images.length > 0) {
    // Filter out tiny icons and UI elements (likely not user-uploaded images)
    const actualImages = Array.from(images).filter(img => {
      const width = img.width || img.naturalWidth || 0;
      const height = img.height || img.naturalHeight || 0;
      const src = img.src || '';
      
      // Exclude very small images (likely icons)
      if (width > 0 && height > 0 && (width < 32 || height < 32)) {
        return false;
      }
      
      // Exclude common icon patterns in src
      if (src.includes('icon') || src.includes('avatar') || src.includes('logo')) {
        return false;
      }
      
      return true;
    });
    
    if (actualImages.length > 0) {
      attachmentInfo.push(`� ${actualImages.length} image${actualImages.length > 1 ? 's' : ''}`);
    }
  }

  // Check for file attachments - be more specific
  const fileSelectors = [
    'a[download]', // Download links
    '[class*="attachment"][class*="file"]', // Elements with both attachment and file
    '[data-file-name]', // Explicit file data attributes
    '[aria-label*="attached file"]',
    '[aria-label*="uploaded file"]'
  ];
  
  let fileCount = 0;
  fileSelectors.forEach(selector => {
    try {
      const elements = element.querySelectorAll(selector);
      fileCount += elements.length;
    } catch (e) {
      // Ignore selector errors
    }
  });

  if (fileCount > 0) {
    attachmentInfo.push(`� ${fileCount} file${fileCount > 1 ? 's' : ''}`);
  }

  // Check for code blocks
  const codeBlocks = element.querySelectorAll('pre code, code[class*="language-"], .code-block');
  if (codeBlocks.length > 0) {
    const codeCount = codeBlocks.length;
    attachmentInfo.push(`💻 ${codeCount} code block${codeCount > 1 ? 's' : ''}`);
  }

  // Clean up whitespace
  text = text.trim().replace(/\s+/g, ' ');

  // Combine text with attachment info
  let finalText = '';
  
  if (attachmentInfo.length > 0) {
    finalText = attachmentInfo.join(' · ');
    if (text && text.length > 0) {
      finalText += ' · ' + text;
    }
  } else {
    finalText = text;
  }

  // Truncate if too long (for display purposes)
  const maxLength = 150;
  if (finalText.length > maxLength) {
    finalText = finalText.substring(0, maxLength) + '...';
  }

  return finalText || '[Empty message]';
}

// Set up MutationObserver to detect new messages
function setupMutationObserver() {
  if (!currentConfig || observer) return;

  // Find the chat container
  const containerSelector = currentConfig.selectors.chatContainer;
  const container = document.querySelector(containerSelector);

  if (!container) {
    console.warn('[LLM Chat Navigator] Chat container not found');
    return;
  }

  // Create observer
  observer = new MutationObserver((mutations) => {
    let shouldRescan = false;

    for (const mutation of mutations) {
      // Check if new nodes were added
      if (mutation.addedNodes.length > 0) {
        shouldRescan = true;
        break;
      }
    }

    // Rescan if needed (debounced)
    if (shouldRescan) {
      clearTimeout(observer.rescanTimeout);
      observer.rescanTimeout = setTimeout(() => {
        scanPage();
      }, 500);
    }
  });

  // Start observing
  observer.observe(container, {
    childList: true,
    subtree: true
  });
}

// Scroll to a specific message
function scrollToMessage(messageId) {
  const element = document.querySelector(`[data-chat-nav-id="${messageId}"]`);

  if (!element) {
    console.warn(`[LLM Chat Navigator] Message ${messageId} not found in DOM - may need to scroll up to load it`);
    
    // Try to scroll to top to load older messages
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Wait for messages to load, then try again
    setTimeout(() => {
      scanPage(); // Rescan to index newly loaded messages
      const retryElement = document.querySelector(`[data-chat-nav-id="${messageId}"]`);
      if (retryElement) {
        scrollToElement(retryElement);
      } else {
        console.warn(`[LLM Chat Navigator] Message ${messageId} still not found after loading`);
      }
    }, 2000);
    
    return;
  }

  scrollToElement(element);
}

// Helper function to scroll to and highlight an element
function scrollToElement(element) {
  // Scroll smoothly to the element
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  });

  // Add highlight effect
  element.classList.add('chat-nav-highlight');
  
  // Remove highlight after animation
  setTimeout(() => {
    element.classList.remove('chat-nav-highlight');
  }, 2000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_MESSAGES') {
    // Send the current message index
    sendResponse({
      messages: messageIndex.slice().reverse(), // Newest first
      siteName: currentConfig?.name || 'Unknown',
      totalIndexed: messageIndex.length
    });
  } else if (request.type === 'SCROLL_TO_MSG') {
    // Check if message exists first
    const element = document.querySelector(`[data-chat-nav-id="${request.id}"]`);
    
    if (element) {
      // Message found, scroll immediately
      scrollToMessage(request.id);
      sendResponse({ success: true, found: true });
    } else {
      // Message not in DOM, try to load it
      console.log(`[LLM Chat Navigator] Message ${request.id} not in DOM, attempting to load...`);
      scrollToMessage(request.id); // This will handle the load logic
      sendResponse({ success: true, found: false, loading: true });
    }
  } else if (request.type === 'RESCAN') {
    // Force a rescan of the page
    scanPage();
    sendResponse({ success: true, messageCount: messageIndex.length });
  }

  return true; // Keep message channel open for async response
});

// Initialize when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
