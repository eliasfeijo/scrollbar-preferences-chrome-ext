const DEFAULT_SCROLLBAR_WIDTH_PX = 5;

async function getScrollbarWidth() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const storage = await chrome.storage.local.get(currentTab.url);
  document.querySelector('#scrollbar-width-input').value = storage[currentTab.url] || DEFAULT_SCROLLBAR_WIDTH_PX;
  return storage[currentTab.url];
}

getScrollbarWidth();

document.querySelector('#scrollbar-width-input').addEventListener('change', async (event) => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const width = parseInt(event.target.value, 10);
  console.log('scrollbar-width-input changed', width, currentTab);
  await chrome.storage.local.set({ [currentTab.url]: width });
});