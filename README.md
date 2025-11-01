# 🧭 LLM Chat Navigator

> **Navigate your LLM conversations with elegance and speed** — v1.3.0

A premium Chrome extension that transforms your LLM chat experience with a beautiful, intuitive table of contents. Jump to any message instantly, search your conversation history, and enjoy a modern interface designed for maximum productivity and user retention.

## ✨ What's New in v1.3.0

🎨 **Complete UI Overhaul**: Premium design with glassmorphism, gradient accents, and smooth animations  
🌓 **Dark Mode**: Full dark theme support with one-click toggle and persistent preferences  
✨ **Advanced Animations**: Delightful micro-interactions throughout the interface  
♿ **Enhanced Accessibility**: Keyboard navigation, WCAG AA compliance, screen reader support  
🎭 **Design System**: 50+ CSS custom properties for consistent, scalable theming  

## 🎯 Why You'll Love It

**Problem:** LLM chat histories (ChatGPT, Gemini, Claude) become very long. Finding a specific prompt requires endless scrolling and wastes valuable time.

**Solution:** This extension creates a beautiful, searchable index of all YOUR messages. Click any message to instantly jump to it with smooth scrolling. Modern UI keeps you engaged and productive.

## ⚡ Features

### 🎨 Premium Interface
- **Glassmorphism Effects**: Frosted glass aesthetics throughout
- **Dark Mode**: Easy on the eyes with beautiful dark theme
- **Smooth Animations**: 60fps micro-interactions that feel premium
- **Gradient Accents**: Eye-catching purple/lavender color palette
- **Custom Scrollbar**: Styled gradient scrollbar for elegance

### 🚀 Core Functionality
- **Smart Message Index**: Auto-detects and indexes your prompts
- **Instant Navigation**: Click to scroll directly to any message
- **Real-time Search**: Filter messages as you type
- **Lazy Loading Support**: Handles old messages on scroll-based platforms
- **Auto-Refresh**: Stay synced with your conversation
- **Toast Notifications**: Visual feedback for all actions

### 🌐 Platform Support
- ✅ **ChatGPT** (chat.openai.com & chatgpt.com)
- ✅ **Gemini** (gemini.google.com)
- ✅ **Claude** (claude.ai)
- 🔄 More platforms coming soon!

## Supported Platforms

Currently supports:
- ✅ **ChatGPT** (chat.openai.com, chatgpt.com)
- ✅ **Google Gemini** (gemini.google.com)
- ✅ **Claude** (claude.ai)

## Installation

### Chrome/Edge (Manual Installation)

1. **Download the Extension**
   - Clone this repository or download as ZIP
   ```bash
   git clone https://github.com/yourusername/llm-chat-navigator.git
   ```

2. **Open Extension Management**
   - Chrome: Go to `chrome://extensions/`
   - Edge: Go to `edge://extensions/`

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `llm-chat-navigator` folder

5. **You're Ready!**
   - Visit any supported LLM chat platform
   - The extension icon will light up when active
   - Click it to see your message index

### Adding Icons

The extension requires icon files. You can:

1. **Use the provided placeholder icons** (recommended for testing)
2. **Create custom icons**:
   - Create PNG images in the `icons/` folder:
     - `icon16.png` (16×16 pixels)
     - `icon48.png` (48×48 pixels)
     - `icon128.png` (128×128 pixels)
   - Use a design tool or online icon generator
   - Suggested design: Document/list icon with a chat bubble

## Usage

1. **Open a Chat**: Navigate to ChatGPT, Gemini, or Claude
2. **Send Messages**: Have a conversation as normal
3. **Open Navigator**: Click the extension icon in your browser toolbar
4. **Browse Your Messages**: See all your prompts listed chronologically
5. **Jump to Message**: Click any message to scroll to it in the chat
6. **Search**: Use the search box to filter messages
7. **Refresh**: Click the refresh button to re-scan the page

## Features in Detail

### Message Index
- Shows all YOUR messages (not AI responses)
- Newest messages first
- Each message shows:
  - Message number badge
  - First 150 characters of your prompt
  - Relative timestamp (e.g., "2h ago")

### Search Functionality
- Real-time filtering as you type
- Searches through message content
- Shows filtered count vs. total count

### Smooth Navigation
- Smooth scroll animation to target message
- Yellow highlight pulse effect for 2 seconds
- Centers the message in your viewport
- Popup auto-closes after navigation

## How It Works

### Technical Architecture

1. **manifest.json**: Defines extension permissions and components
2. **background.js**: Manages icon state based on current URL
3. **content_script.js**: 
   - Scans the page DOM for user messages
   - Assigns unique IDs to each message
   - Uses MutationObserver for real-time updates
   - Handles scroll commands from popup
4. **popup.html/js/css**: User interface for message navigation

### Site-Specific Selectors

The extension uses DOM selectors specific to each platform:
- **Gemini**: `message-content[data-author="user"]`
- **ChatGPT**: `[data-message-author-role="user"]`
- **Claude**: `[data-is-user-msg="true"]`

## Known Limitations

1. **DOM Fragility**: The extension depends on the HTML structure of LLM websites. If the platforms update their UI, the extension may stop working until updated with new selectors.

2. **Lazy Loading**: Only messages currently loaded in the DOM are indexed. For very long conversations, you may need to scroll up in the main window first to load older messages.

3. **Platform Updates**: Each LLM platform may change their structure at any time. This is an inherent limitation of browser extensions that scrape content.

4. **Single-Page Apps**: Works best with single chat sessions. Opening multiple chats may require refreshing the index.

## Customization

### Adding New Platforms

To add support for a new LLM platform:

1. Open `content_script.js`
2. Add a new entry to `SITE_CONFIGS`:

```javascript
'newplatform.com': {
  name: 'Platform Name',
  selectors: {
    userMessages: 'your-user-message-selector',
    fallbackSelectors: ['alternative-selector-1', 'alternative-selector-2'],
    chatContainer: 'main-chat-container-selector'
  }
}
```

3. Update `manifest.json` to include the new domain in:
   - `host_permissions`
   - `content_scripts.matches`

4. Update `background.js` to add the domain to `SUPPORTED_URLS`

### Customizing Styles

- **Popup appearance**: Edit `popup.css`
- **Highlight effect**: Edit `content_styles.css`
- **Colors**: Change the gradient colors in the CSS files

## Troubleshooting

### Extension not working?

1. **Check if on supported platform**: The icon should light up automatically
2. **Refresh the page**: Sometimes the content script needs a fresh start
3. **Check browser console**: Look for `[LLM Chat Navigator]` logs
4. **Reload extension**: Go to extensions page and click reload
5. **Try the refresh button**: In the popup, click the refresh button

### No messages showing?

1. **Send a message first**: The extension only shows YOUR messages
2. **Wait a moment**: The page needs to load completely
3. **Check DOM selectors**: The platform may have updated their HTML
4. **Open browser console**: Look for error messages

### Scroll not working?

1. **Check message is visible**: Scroll up in the main chat first
2. **Wait for page load**: Ensure the page is fully loaded
3. **Try refreshing**: Use the refresh button in the popup

## Development

### File Structure
```
llm-chat-navigator/
├── manifest.json           # Extension configuration
├── background.js           # Service worker for URL monitoring
├── content_script.js       # Main logic for message indexing
├── content_styles.css      # Styles injected into chat pages
├── popup.html             # Popup interface HTML
├── popup.js               # Popup logic and UI handling
├── popup.css              # Popup styles
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

### Testing

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click "Reload" on the extension
4. Refresh any open LLM chat pages
5. Test the functionality

### Debugging

- **Content Script**: Check the page's console (F12)
- **Popup**: Right-click the extension icon → "Inspect popup"
- **Background**: Go to `chrome://extensions/` → Click "Inspect views: service worker"

## Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs**: Open an issue with details about the problem
2. **Suggest Features**: Share your ideas for improvements
3. **Update Selectors**: If a platform updates and breaks the extension, submit a PR with updated selectors
4. **Add Platforms**: Add support for new LLM platforms
5. **Improve UI**: Enhance the design and user experience

## License

MIT License - Feel free to use and modify as needed.

## Acknowledgments

Built with ❤️ for the LLM community. Special thanks to all the users who help keep the DOM selectors up to date!

## Support

Having issues or questions? 
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the console logs for error messages

---

**Note**: This extension is not affiliated with OpenAI, Google, Anthropic, or any LLM provider. It's an independent tool designed to enhance your chat experience.
