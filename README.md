# LLM Chat Navigator

A Chrome extension to help you navigate your conversations with Large Language Models (LLMs).

## The Problem

When using LLM chat platforms like ChatGPT and Gemini, conversations can become very long. Finding a specific message or prompt often requires a lot of scrolling, which can be time-consuming and inefficient.

## The Solution

LLM Chat Navigator creates a searchable index of your messages in a conversation. You can click on any message in the index to instantly jump to its location in the chat history. This makes it easy to find important information and navigate long conversations.

## Features

- **Message Indexing**: Automatically creates an index of your prompts.
- **Instant Navigation**: Click any message in the index to scroll directly to it.
- **Search**: Filter messages in real-time to quickly find what you're looking for.
- **Message Count**: See the total number of messages in the index and in your search results.
- **Refresh**: Manually re-scan the conversation to update the index.
- **Modern UI**: A clean and intuitive interface for a seamless experience.
- **Lazy Loading Support**: Works with platforms that load older messages as you scroll up.

## Supported Platforms

- ChatGPT (chat.openai.com & chatgpt.com)
- Google Gemini (gemini.google.com)

## Installation

### Manual Installation for Chrome/Edge

1.  **Download the Extension**:
    - Clone this repository or download it as a ZIP file.
      ```bash
      git clone https://github.com/surajsm60720/llm-chat-navigator.git
      ```

2.  **Open Extension Management**:
    - In Chrome, go to `chrome://extensions/`.
    - In Edge, go to `edge://extensions/`.

3.  **Enable Developer Mode**:
    - Find and turn on the "Developer mode" toggle, usually in the top-right corner.

4.  **Load the Extension**:
    - Click the "Load unpacked" button.
    - Select the `llm-chat-navigator` folder that you downloaded.

5.  **Ready to Use**:
    - The extension is now installed. Visit any of the supported LLM chat platforms to start using it.

## How to Use

1.  **Open a chat** on a supported platform (e.g., ChatGPT).
2.  **Click the extension icon** in your browser's toolbar to open the popup.
3.  You will see a list of your messages.
4.  **Click on a message** to jump to it in the chat.
5.  Use the **search bar** at the top to filter messages.
6.  Click the **refresh button** to rescan the page for new messages.
