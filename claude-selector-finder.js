// Claude Selector Finder Script
// Copy this entire script and paste it into Claude's console (F12 → Console tab)
// Then press Enter to run it

console.clear();
console.log('%c🔍 LLM Chat Navigator - Claude Selector Finder', 'color: purple; font-size: 16px; font-weight: bold');
console.log('%c====================================', 'color: purple');
console.log('');

// List of selectors to test for Claude
const selectorsToTest = [
  // Current/Updated selectors
  'div[data-testid="user-message"]',
  '.font-claude-message[data-is-user="true"]',
  '[data-is-user-msg="true"]',
  '[data-testid*="user"]',
  'div.font-user',
  '.user-message',
  '[data-side="user"]',
  '.font-user-message',
  'div[class*="UserMessage"]',
  'div[class*="user-message"]',
  
  // Additional possibilities
  '[role="user"]',
  '.user-query',
  '.user-input',
  'div[data-message-author="user"]',
  'div[data-author="user"]',
  '.prompt-message',
  'article[data-role="user"]',
  'div[class*="user"]',
  'div[class*="prompt"]',
  '.conversation-user',
  '[data-user="true"]'
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

console.log('\n' + '%c====================================', 'color: purple');
console.log('%c📊 SUMMARY', 'color: purple; font-size: 14px; font-weight: bold');
console.log('%c====================================', 'color: purple');

if (results.length === 0) {
  console.log('%c❌ No working selectors found!', 'color: red; font-weight: bold');
  console.log('\nPossible reasons:');
  console.log('1. No messages sent yet - try sending a message first');
  console.log('2. Claude is using Shadow DOM - selectors can\'t reach inside');
  console.log('3. Claude\'s structure has changed significantly');
  console.log('4. You might be on a different Claude URL (check if it\'s claude.ai)');
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

console.log('\n' + '%c====================================', 'color: purple');
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
const dataAttrs = [...document.querySelectorAll('[data-testid], [data-is-user], [data-author], [data-role], [data-message], [data-user]')];
console.log(`\n📊 Elements with data-* attributes: ${dataAttrs.length}`);
if (dataAttrs.length > 0) {
  const attrMap = {};
  dataAttrs.forEach(el => {
    [...el.attributes].forEach(attr => {
      if (attr.name.startsWith('data-')) {
        attrMap[`${attr.name}="${attr.value}"`] = (attrMap[`${attr.name}="${attr.value}"`] || 0) + 1;
      }
    });
  });
  console.log('   Common data attributes:', attrMap);
}

// Check for font-* classes (Claude often uses these)
const fontClasses = [...document.querySelectorAll('[class*="font-"]')];
console.log(`\n✏️ Elements with font-* classes: ${fontClasses.length}`);
if (fontClasses.length > 0) {
  const classMap = {};
  fontClasses.forEach(el => {
    const fontClass = [...el.classList].find(c => c.startsWith('font-'));
    if (fontClass) {
      classMap[fontClass] = (classMap[fontClass] || 0) + 1;
    }
  });
  console.log('   Font classes found:', classMap);
}

console.log('\n✅ Analysis complete!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('%c💡 Quick Debug Commands:', 'color: blue; font-weight: bold');
console.log('Run these one at a time to test specific selectors:\n');
console.log('document.querySelectorAll("div[data-testid*=\'user\']")');
console.log('document.querySelectorAll(".font-user")');
console.log('document.querySelectorAll("[data-is-user=\'true\']")');
console.log('document.querySelectorAll("div[class*=\'user\']")');
