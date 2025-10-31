// Background service worker for LLM Chat Navigator
// This script manages the extension's icon state based on the current URL

// Supported LLM platforms
const SUPPORTED_URLS = [
  'gemini.google.com',
  'chat.openai.com',
  'chatgpt.com',
  'claude.ai'
];

// Function to check if a URL is supported
function isSupportedUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return SUPPORTED_URLS.some(supportedUrl => hostname.includes(supportedUrl));
  } catch (error) {
    return false;
  }
}

// Listen for tab updates (navigation, page loads)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only process when the page is fully loaded
  if (changeInfo.status === 'complete' && tab.url) {
    updateIconState(tabId, tab.url);
  }
});

// Listen for tab activation (switching between tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    updateIconState(activeInfo.tabId, tab.url);
  }
});

// Update icon state based on URL
function updateIconState(tabId, url) {
  if (isSupportedUrl(url)) {
    // Enable the extension icon
    chrome.action.enable(tabId);
    chrome.action.setIcon({
      tabId: tabId,
      path: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    });
  } else {
    // Disable the extension icon (greyed out)
    chrome.action.disable(tabId);
  }
}

// Initialize on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LLM Chat Navigator installed');
  
  // Check all existing tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url) {
        updateIconState(tab.id, tab.url);
      }
    });
  });
});
