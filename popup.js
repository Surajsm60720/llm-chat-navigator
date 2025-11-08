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
  
  // Initialize theme
  initTheme();
  
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
  if (!currentTabId) {
    hideLoading();
    return;
  }

  showLoading();

  try {
    const response = await chrome.tabs.sendMessage(currentTabId, { 
      type: 'GET_MESSAGES' 
    });

    if (response && response.messages) {
      allMessages = response.messages;
      filteredMessages = allMessages;

      // Update site info with easter egg
      if (response.siteName) {
        siteInfo.textContent = `on ${response.siteName}`;
        setupSiteInfoEasterEgg(response.siteName);
      }
      
      // Show message if chat was recently switched
      if (response.totalIndexed === 0 && allMessages.length === 0) {
        // New/empty chat
        hideLoading();
        showEmpty();
        return;
      }

      // Update message count
      updateMessageCount();

      // Render messages (this will hide loading)
      renderMessages();
    } else {
      hideLoading();
      showEmpty();
    }
  } catch (error) {
    console.error('[LLM Chat Navigator] Error loading messages:', error);
    hideLoading();
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
    try {
      // First, tell content script to rescan the page
      try {
        await chrome.tabs.sendMessage(currentTabId, { type: 'RESCAN' });
      } catch (rescanError) {
        console.warn('[LLM Chat Navigator] Rescan failed, continuing anyway:', rescanError);
      }
      // Then reload the messages
      await loadMessages();
    } catch (error) {
      console.error('[LLM Chat Navigator] Error during refresh:', error);
      // Only show error if we don't have any messages already
      if (allMessages.length === 0) {
        showError('Unable to refresh. Make sure you\'re on a supported chat page.');
      }
    } finally {
      // Always remove spinner, even if there's an error
      refreshBtn.classList.remove('spinning');
    }
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
  hideLoading(); // Ensure loading is hidden
  // Reset to default empty state message
  const emptyParagraphs = emptyState.querySelectorAll('p');
  if (emptyParagraphs[0]) {
    emptyParagraphs[0].textContent = 'No messages found';
  }
  emptyState.style.display = 'flex';
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
  const emptyParagraphs = emptyState.querySelectorAll('p');
  if (emptyParagraphs[0]) {
    emptyParagraphs[0].textContent = message;
  }
  messageList.style.display = 'none';
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

const funnyMessages = [
  "Nice try! We only do light mode here",
  "Plot twist: There is no dark mode!",
  "Embrace the light! Dark mode is overrated anyway",
  "Error 404: Dark mode not found",
  "One theme to rule them all!",
  "Why so dark? Stay in the light!",
  "Dark mode machine broke",
  "Achievement unlocked! You found the useless button"
];

// Initialize fake theme toggle
function initTheme() {
  // Always use light mode
  document.documentElement.setAttribute('data-theme', 'light');
  createThemeToggle();
}

// Create fake theme toggle button (it does nothing useful)
function createThemeToggle() {
  const header = document.querySelector('.header');
  if (!header || document.querySelector('.theme-toggle')) return;
  
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'theme-toggle';
  toggleBtn.setAttribute('aria-label', 'Fake theme toggle');
  toggleBtn.innerHTML = '🌙';
  
  toggleBtn.addEventListener('click', showFunnyMessage);
  header.appendChild(toggleBtn);
}

// Show a random funny message instead of changing themes
function showFunnyMessage() {
  const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
  showToast(randomMessage, 'info');
}

const llmEasterEggs = {
  'ChatGPT': {
    facts: [
      "Fun fact: ChatGPT went viral faster than any app in history - 100M users in 2 months!",
      "Did you know? ChatGPT's training data cutoff means it doesn't know about recent events",
      "Plot twist: GPT stands for 'Generative Pre-trained Transformer', not 'Genius Problem Thinker'",
      "Easter egg: Type 'Act as a...' prompts to unlock ChatGPT's roleplaying superpowers",
      "Secret: ChatGPT can write code, poetry, AND dad jokes (though quality may vary)",
      "Speed run: The fastest way to confuse ChatGPT? Ask it what year it is!",
      "Achievement: You're chatting with a model that passed the bar exam!",
      "Pro tip: ChatGPT remembers context, so treat it like a conversation, not Google"
    ],
    clickCount: 0
  },
  'Claude': {
    facts: [
      "Fun fact: Claude is named after Claude Shannon, the father of information theory!",
      "Bookworm alert: Claude can read entire novels in one go (up to 200K tokens!)",
      "Constitutional AI: Claude was trained to be helpful, harmless, and honest - the triple H!",
      "Plot twist: Claude often says 'I aim to be helpful' because that's literally its core mission",
      "Enterprise favorite: Claude is known for being more 'professional' than other LLMs",
      "Philosophical moment: Claude will tell you when it's uncertain (rare in AI!)",
      "Secret talent: Claude excels at structured analysis and breaking down complex problems",
      "Ethics master: Claude has strong opinions about not helping with unethical stuff"
    ],
    clickCount: 0
  },
  'Gemini': {
    facts: [
      "Fun fact: Gemini is Google's answer to GPT - it's multimodal from the ground up!",
      "Google magic: Gemini can understand images, videos, audio, and text all together",
      "Speed demon: Gemini Ultra beat GPT-4 on several benchmarks (Google says so!)",
      "Identity crisis: Used to be called Bard, then became Gemini - still figuring itself out",
      "Search powers: Unlike ChatGPT, Gemini can access real-time Google search (when it wants to)",
      "Pro tip: Gemini is better at recent events since it can search the web",
      "Creative side: Gemini can generate images using Google's Imagen technology",
      "Multiverse: There are 3 Gemini versions - Nano, Pro, and Ultra (Pokémon evolution vibes)"
    ],
    clickCount: 0
  },
  'Perplexity': {
    facts: [
      "Fun fact: Perplexity is like ChatGPT and Google had a baby - it's a search-focused AI!",
      "Citation king: Perplexity always shows sources - it's the Wikipedia of AI chatbots",
      "Real-time powers: Unlike ChatGPT, Perplexity knows what happened 5 minutes ago",
      "Academic favorite: Researchers love Perplexity because it actually cites its sources",
      "Pro mode: Perplexity Pro uses GPT-4 and Claude under the hood - it's a multi-LLM ninja!",
      "Search engine killer? Perplexity wants to replace Google (ambitious much?)",
      "Fact checker: Perplexity is better at answering factual questions than creative ones",
      "Copilot mode: It can ask YOU questions to understand what you really want"
    ],
    clickCount: 0
  }
};

// Generic easter eggs for unknown platforms
const genericEasterEggs = [
  "You're chatting with an AI right now. Mind = blown 🤯",
  "Fun fact: You're using a navigator extension while navigating conversations. Meta!",
  "Achievement unlocked: Found the secret glitter icon click zone!",
  "Plot twist: This extension was probably built with help from an AI",
  "Easter egg level: Intermediate. Keep clicking for more!",
  "You know what's cool? You can search ALL your messages instantly!",
  "Pro tip: This extension works on multiple LLM platforms. Try them all!",
  "Prediction: You're going to click this 3 more times out of curiosity"
];

// Setup easter egg for site info glitter icon
function setupSiteInfoEasterEgg(siteName) {
  // Add click event listener to site info
  siteInfo.style.cursor = 'pointer';
  siteInfo.title = '✨ Click for a fun fact!';
  
  // Remove any existing listener
  const newSiteInfo = siteInfo.cloneNode(true);
  siteInfo.parentNode.replaceChild(newSiteInfo, siteInfo);
  
  // Get the new reference
  const siteInfoElement = document.getElementById('siteInfo');
  
  siteInfoElement.addEventListener('click', () => {
    triggerLLMEasterEgg(siteName, siteInfoElement);
  });
}

// Trigger easter egg with special effects
function triggerLLMEasterEgg(siteName, element) {
  // Find which LLM platform we're on
  let eggData = null;
  let platformKey = null;
  
  for (const [key, value] of Object.entries(llmEasterEggs)) {
    if (siteName.toLowerCase().includes(key.toLowerCase())) {
      eggData = value;
      platformKey = key;
      break;
    }
  }
  
  // Increment click count
  if (eggData) {
    eggData.clickCount++;
    const factIndex = eggData.clickCount % eggData.facts.length;
    const fact = eggData.facts[factIndex];
    
    // Special message every 5 clicks
    if (eggData.clickCount % 5 === 0) {
      showToast(`🎉 ${eggData.clickCount} clicks! You're a ${platformKey} superfan!`, 'success');
      setTimeout(() => showToast(fact, 'info'), 1500);
    } else {
      showToast(fact, 'info');
    }
    
    // Add sparkle animation
    addSparkleEffect(element);
  } else {
    // Generic easter egg for unknown platforms
    const randomEgg = genericEasterEggs[Math.floor(Math.random() * genericEasterEggs.length)];
    showToast(randomEgg, 'info');
    addSparkleEffect(element);
  }
}

// Add sparkle animation effect
function addSparkleEffect(element) {
  element.style.transform = 'scale(1.2)';
  element.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
  
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 300);
  
  // Create sparkle particles
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      createSparkle(element);
    }, i * 100);
  }
}

// Create sparkle particle
function createSparkle(element) {
  const sparkle = document.createElement('div');
  sparkle.textContent = ['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)];
  sparkle.style.position = 'fixed';
  sparkle.style.pointerEvents = 'none';
  sparkle.style.zIndex = '9999';
  sparkle.style.fontSize = '16px';
  
  const rect = element.getBoundingClientRect();
  sparkle.style.left = rect.left + rect.width / 2 + 'px';
  sparkle.style.top = rect.top + rect.height / 2 + 'px';
  
  document.body.appendChild(sparkle);
  
  // Animate sparkle
  const angle = (Math.random() * 360) * (Math.PI / 180);
  const distance = 40 + Math.random() * 30;
  const endX = Math.cos(angle) * distance;
  const endY = Math.sin(angle) * distance;
  
  sparkle.animate([
    { transform: 'translate(0, 0) scale(0)', opacity: 1 },
    { transform: `translate(${endX}px, ${endY}px) scale(1)`, opacity: 0 }
  ], {
    duration: 800,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }).onfinish = () => sparkle.remove();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
