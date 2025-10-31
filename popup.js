// Popup script for LLM Chat Navigator
// Handles the UI and communication with content script

let allMessages = [];
let filteredMessages = [];
let currentTabId = null;

// DOM elements
const messageList = document.getElementById('messageList');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const messageCount = document.getElementById('messageCount');
const siteInfo = document.getElementById('siteInfo');
const pinTip = document.getElementById('pinTip');
const pinExtensionLink = document.getElementById('pinExtensionLink');

// Initialize popup
async function init() {
  showLoading();
  
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTabId = tab.id;

    // Request messages from content script
    await loadMessages();

    // Set up event listeners
    setupEventListeners();
    
    // Show pin tip on first use
    showPinTipIfNeeded();
  } catch (error) {
    console.error('[LLM Chat Navigator] Error initializing popup:', error);
    showError('Failed to load messages. Please refresh the page and try again.');
  }
}

// Load messages from content script
async function loadMessages() {
  if (!currentTabId) return;

  showLoading();

  try {
    const response = await chrome.tabs.sendMessage(currentTabId, { 
      type: 'GET_MESSAGES' 
    });

    if (response && response.messages) {
      allMessages = response.messages;
      filteredMessages = allMessages;

      // Update site info
      if (response.siteName) {
        siteInfo.textContent = `on ${response.siteName}`;
      }
      
      // Show message if chat was recently switched
      if (response.totalIndexed === 0 && allMessages.length === 0) {
        // New/empty chat
        showEmpty();
        return;
      }

      // Update message count
      updateMessageCount();

      // Render messages
      renderMessages();
    } else {
      showEmpty();
    }
  } catch (error) {
    console.error('[LLM Chat Navigator] Error loading messages:', error);
    showError('Unable to connect. Make sure you\'re on a supported chat page.');
  }
}

// Render messages to the UI
function renderMessages() {
  messageList.innerHTML = '';

  if (filteredMessages.length === 0) {
    showEmpty();
    return;
  }

  hideLoading();
  hideEmpty();

  filteredMessages.forEach((message, index) => {
    const li = document.createElement('li');
    li.className = 'message-item';
    li.setAttribute('data-id', message.id);
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'button');

    // Create message number badge
    const badge = document.createElement('span');
    badge.className = 'message-badge';
    badge.textContent = `#${filteredMessages.length - index}`;

    // Create message text
    const text = document.createElement('span');
    text.className = 'message-text';
    text.textContent = message.text;

    // Create timestamp (optional)
    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = formatTime(message.timestamp);

    li.appendChild(badge);
    li.appendChild(text);
    li.appendChild(time);

    messageList.appendChild(li);
  });
}

// Set up event listeners
function setupEventListeners() {
  // Click on message to scroll
  messageList.addEventListener('click', async (e) => {
    const messageItem = e.target.closest('.message-item');
    if (!messageItem) return;

    const messageId = parseInt(messageItem.getAttribute('data-id'));
    await scrollToMessage(messageId);
  });

  // Keyboard navigation
  messageList.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const messageItem = e.target.closest('.message-item');
      if (messageItem) {
        e.preventDefault();
        const messageId = parseInt(messageItem.getAttribute('data-id'));
        await scrollToMessage(messageId);
      }
    }
  });

  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query === '') {
      filteredMessages = allMessages;
    } else {
      filteredMessages = allMessages.filter(msg => 
        msg.text.toLowerCase().includes(query)
      );
    }

    updateMessageCount();
    renderMessages();
  });

  // Refresh button
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.classList.add('spinning');
    await loadMessages();
    setTimeout(() => {
      refreshBtn.classList.remove('spinning');
    }, 500);
  });
}

// Scroll to a message in the chat
async function scrollToMessage(messageId) {
  if (!currentTabId) return;

  try {
    // Send scroll command to content script
    const response = await chrome.tabs.sendMessage(currentTabId, {
      type: 'SCROLL_TO_MSG',
      id: messageId
    });

    if (response && response.loading) {
      // Message is being loaded
      showToast('Loading older messages... This may take a moment', 'info');
      setTimeout(() => {
        window.close();
      }, 2500);
    } else if (response && response.found) {
      // Message found immediately
      showToast('Jumping to message...', 'success');
      setTimeout(() => {
        window.close();
      }, 300);
    } else {
      // Close popup after short delay
      setTimeout(() => {
        window.close();
      }, 500);
    }
  } catch (error) {
    console.error('[LLM Chat Navigator] Error scrolling to message:', error);
    showToast('Connection failed. Please refresh the page.', 'error');
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
  
  return toast;
}

// Update message count display
function updateMessageCount() {
  const count = filteredMessages.length;
  messageCount.textContent = `${count} ${count === 1 ? 'message' : 'messages'}`;
  
  if (searchInput.value && count < allMessages.length) {
    messageCount.textContent += ` (${allMessages.length} total)`;
  }
}

// Format timestamp
function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

// Show loading state
function showLoading() {
  loadingState.style.display = 'flex';
  emptyState.style.display = 'none';
  messageList.style.display = 'none';
}

// Hide loading state
function hideLoading() {
  loadingState.style.display = 'none';
  messageList.style.display = 'block';
}

// Show empty state
function showEmpty() {
  emptyState.style.display = 'flex';
  loadingState.style.display = 'none';
  messageList.style.display = 'none';
}

// Hide empty state
function hideEmpty() {
  emptyState.style.display = 'none';
}

// Show error message
function showError(message) {
  hideLoading();
  emptyState.style.display = 'flex';
  emptyState.querySelector('p').textContent = message;
  emptyState.querySelector('.empty-icon').textContent = '⚠️';
}

// Show pin tip if needed
function showPinTipIfNeeded() {
  // Check if user has seen the tip before
  chrome.storage.local.get(['pinTipShown'], (result) => {
    if (!result.pinTipShown) {
      // Show the tip
      pinTip.style.display = 'block';
      
      // Mark as shown after 3 seconds
      setTimeout(() => {
        chrome.storage.local.set({ pinTipShown: true });
      }, 3000);
      
      // Add click handler for the link
      pinExtensionLink.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Click the puzzle piece icon 🧩 in your toolbar, then click the pin 📌 next to this extension', 'info');
        chrome.storage.local.set({ pinTipShown: true });
        setTimeout(() => {
          pinTip.style.display = 'none';
        }, 500);
      });
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
