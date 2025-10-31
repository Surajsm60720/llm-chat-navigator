// Gemini Selector Finder Script
// Copy this entire script and paste it into Gemini's console (F12 → Console tab)
// Then press Enter to run it

console.clear();
console.log('%c🔍 LLM Chat Navigator - Gemini Selector Finder', 'color: blue; font-size: 16px; font-weight: bold');
console.log('%c====================================', 'color: blue');
console.log('');

// List of selectors to test
const selectorsToTest = [
  // Current selectors
  '.query-content',
  '[data-test-id*="user"]',
  '.user-query',
  'message-content[data-author="user"]',
  '[data-author="user"]',
  '.user-message',
  '[data-role="user"]',
  '.message[data-author="user"]',
  'div[class*="query"]',
  'div[class*="user"]',
  
  // Additional possibilities
  '.prompt',
  '.user-prompt',
  '[data-message-author="user"]',
  'user-message',
  'query-content',
  'message-content',
  '.conversation-prompt',
  '[role="user"]',
  '.input-message',
  'div[data-id*="user"]'
];

console.log('Testing', selectorsToTest.length, 'different selectors...\n');

const results = [];

selectorsToTest.forEach((selector, index) => {
  try {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      results.push({
        selector,
        count: elements.length,
        sample: elements[0]
      });
      console.log(`%c✅ ${selector}`, 'color: green', `→ Found ${elements.length} elements`);
      
      // Show first element's text preview
      const text = elements[0].textContent?.trim().substring(0, 50) || '(no text)';
      console.log(`   Preview: "${text}..."`);
    } else {
      console.log(`%c❌ ${selector}`, 'color: gray', '→ 0 elements');
    }
  } catch (error) {
    console.log(`%c⚠️  ${selector}`, 'color: orange', '→ Error:', error.message);
  }
});

console.log('\n' + '%c====================================', 'color: blue');
console.log('%c📊 SUMMARY', 'color: blue; font-size: 14px; font-weight: bold');
console.log('%c====================================', 'color: blue');

if (results.length === 0) {
  console.log('%c❌ No working selectors found!', 'color: red; font-weight: bold');
  console.log('\nPossible reasons:');
  console.log('1. No messages sent yet - try sending a message first');
  console.log('2. Gemini is using Shadow DOM - selectors can\'t reach inside');
  console.log('3. Gemini\'s structure has changed significantly');
  console.log('\n💡 Next step: Send a message, then right-click it and select "Inspect"');
} else {
  console.log(`%c✅ Found ${results.length} working selector(s)!`, 'color: green; font-weight: bold');
  console.log('\n📋 Best candidates:');
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.selector}`);
    console.log(`   Count: ${result.count} elements`);
    console.log(`   Element:`, result.sample);
  });
  
  console.log('\n💡 Recommendation:');
  const best = results.sort((a, b) => b.count - a.count)[0];
  console.log(`%cUse this selector: "${best.selector}"`, 'color: green; font-weight: bold; font-size: 14px');
  console.log('\n📝 Update content_script.js with this selector!');
}

console.log('\n' + '%c====================================', 'color: blue');
console.log('\n🔍 Additional DOM Analysis:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check for Shadow DOM
const shadowHosts = [...document.querySelectorAll('*')].filter(el => el.shadowRoot);
console.log(`\n🌑 Shadow DOM hosts found: ${shadowHosts.length}`);
if (shadowHosts.length > 0) {
  console.log('⚠️  This might be why selectors aren\'t working!');
  console.log('   Shadow DOM elements:', shadowHosts.map(h => h.tagName).join(', '));
}

// Check for custom elements
const customElements = [...new Set(
  [...document.querySelectorAll('*')]
    .map(el => el.tagName.toLowerCase())
    .filter(tag => tag.includes('-'))
)];
console.log(`\n🔧 Custom elements found: ${customElements.length}`);
if (customElements.length > 0) {
  console.log('   Elements:', customElements.join(', '));
}

// Check data attributes
const dataAttrs = [...document.querySelectorAll('[data-author], [data-role], [data-message], [data-user], [data-test-id]')];
console.log(`\n📊 Elements with data-* attributes: ${dataAttrs.length}`);
if (dataAttrs.length > 0) {
  const attrMap = {};
  dataAttrs.forEach(el => {
    [...el.attributes].forEach(attr => {
      if (attr.name.startsWith('data-')) {
        attrMap[attr.name] = (attrMap[attr.name] || 0) + 1;
      }
    });
  });
  console.log('   Common data attributes:', attrMap);
}

console.log('\n✅ Analysis complete!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
