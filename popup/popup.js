const ROOT_SELECTOR = ':root';
const DEFAULT_SELECTOR = 'body';
const DEFAULT_CLASS = '__scrollbar-preferences-ext';
const DEFAULT_SCROLLBAR_WIDTH_PX = 15;
const DEFAULT_PREFERENCES_OBJ = {
  width: DEFAULT_SCROLLBAR_WIDTH_PX,
  isCustomSelector: true,
  selector: DEFAULT_SELECTOR,
  className: DEFAULT_CLASS,
};
const USE_SELECTOR_RADIO = { CUSTOM: 'custom', ROOT: 'root' };

async function getScrollbarPreferences() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const storage = await chrome.storage.local.get(currentTab.url);
  const obj = {...DEFAULT_PREFERENCES_OBJ, ...storage[currentTab.url]};
  document.querySelector('#scrollbar-width-input').value = obj.width;
  document.querySelector('#use-root-selector').checked = !obj.isCustomSelector;
  document.querySelector('#use-custom-selector').checked = obj.isCustomSelector;
  const selectorInput = document.querySelector('#custom-selector-input')
  selectorInput.value = obj.selector || DEFAULT_SELECTOR;
  selectorInput.disabled = !obj.isCustomSelector;
  const selectorLabel = selectorInput.parentNode.querySelector('label');
  selectorLabel.classList.toggle('disabled', !obj.isCustomSelector);
  console.log('getScrollbarPreferences', obj, currentTab)
  return obj;
}

getScrollbarPreferences();

document.querySelector('#scrollbar-width-input').addEventListener('change', async (event) => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const width = parseInt(event.target.value, 10);
  const storage = await chrome.storage.local.get(currentTab.url);
  const obj = {...DEFAULT_PREFERENCES_OBJ, ...storage[currentTab.url], width};
  await chrome.storage.local.set({ [currentTab.url]: obj });
  await getScrollbarPreferences();
  console.log('scrollbar-width-input changed', width, currentTab);
});

function applyOrRestoreScrollbarPreferences(shouldApply, preferences) {
  const { isCustomSelector, selector, width, className } = preferences;
  const fullSelector = isCustomSelector ? `${selector}.${className}` : ROOT_SELECTOR;
  if (shouldApply) {
    isCustomSelector && document.querySelector(selector).classList.add(className);
    document.querySelector(fullSelector).style.setProperty('--scrollbar-width', `${width ?? 0}px`);
    return;
  }
  document.querySelector(fullSelector).style.removeProperty('--scrollbar-width');
  isCustomSelector && document.querySelector(selector).classList.remove(className);
}

async function onUseSelectorChange(radioValue) {
  console.log('onUseSelectorChange', radioValue);
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const storage = await chrome.storage.local.get(currentTab.url);
  const obj = {...DEFAULT_PREFERENCES_OBJ, ...storage[currentTab.url]};
  obj.selector = radioValue === USE_SELECTOR_RADIO.ROOT ? ROOT_SELECTOR : obj.selector ?? DEFAULT_SELECTOR;
  obj.isCustomSelector = radioValue === USE_SELECTOR_RADIO.CUSTOM;
  await chrome.storage.local.set({ [currentTab.url]: obj });
  await getScrollbarPreferences();
}

document.querySelectorAll('input[name="selector-radio"]').forEach((radio) => {
  radio.addEventListener('click', () => {
    onUseSelectorChange(radio.value);
  });
});

document.querySelector('#save-button').addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const width = parseInt(document.querySelector('#scrollbar-width-input').value, 10);
  const selector = document.querySelector('#custom-selector-input').value;
  const storage = await chrome.storage.local.get(currentTab.url);
  const obj = {...DEFAULT_PREFERENCES_OBJ, ...storage[currentTab.url], width, selector};
  await chrome.storage.local.set({ [currentTab.url]: obj });
  const preferences = await getScrollbarPreferences();
  const fullSelector = preferences.isCustomSelector ? `${preferences.selector}.${DEFAULT_CLASS}` : '';
  await chrome.scripting.insertCSS({
    css: `${fullSelector}::-webkit-scrollbar { width: ${width ?? 0}px !important; }`,
    target: { tabId: currentTab.id },
    origin: 'USER',
  });
  await chrome.scripting.executeScript({
    target: { tabId: currentTab.id },
    func: applyOrRestoreScrollbarPreferences,
    args: [true, preferences],
  });
  console.log('save-button clicked', width, selector, currentTab);
});

document.querySelector('#restore-defaults-button').addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const preferences = await getScrollbarPreferences();
  await chrome.scripting.executeScript({
    target: { tabId: currentTab.id },
    func: applyOrRestoreScrollbarPreferences,
    args: [false, preferences],
  });
  console.log('restore-defaults-button clicked', preferences, currentTab);
  // The root selector doesn't have a class, so we need to reload the page to remove the style
  await chrome.storage.local.remove(currentTab.url);
  !preferences.isCustomSelector && await chrome.tabs.reload(currentTab.id);
});
