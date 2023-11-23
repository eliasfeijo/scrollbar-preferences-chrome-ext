async function loadScrollbarPreferences() {
  const url = window.location.href;
  const storage = await chrome.storage.local.get(url);
  const { isCustomSelector, selector, width, className } = storage[url] ?? {};
  if (width == undefined) return;
  const fullSelectorCSS = isCustomSelector ? `${selector}.${className}` : '';
  const style = document.createElement('style');
  style.innerHTML = `
    ${fullSelectorCSS}::-webkit-scrollbar {
      width: ${width}px !important;
    }
  `;
  document.head.appendChild(style);
  const fullSelector = isCustomSelector ? `${selector}.${className}` : selector;
  isCustomSelector && document.querySelector(selector).classList.add(className);
  document.querySelector(fullSelector).style.setProperty('--scrollbar-width', `${width ?? 0}px`);
  console.log('loadScrollbarPreferences', url)
  chrome.runtime.sendMessage('activate-badge');
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded');
  await loadScrollbarPreferences();
});