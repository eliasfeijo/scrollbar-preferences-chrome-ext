const DEFAULT_SELECTOR = 'body';
const DEFAULT_CLASS = '__scrollbar-preferences-ext';
const DEFAULT_SCROLLBAR_WIDTH_PX = 15;
const DEFAULT_PREFERENCES_OBJ = {
  width: DEFAULT_SCROLLBAR_WIDTH_PX,
  selector: '',
};
const USE_SELECTOR_RADIO = { CUSTOM: 'custom', ROOT: 'root' };

function setScrollbarWidthVar(widthVar) {
  document.body.style.setProperty('--scrollbar-width', widthVar);
}

async function getScrollbarPreferences() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const storage = await chrome.storage.local.get(currentTab.url);
  const obj = {...DEFAULT_PREFERENCES_OBJ, ...storage[currentTab.url]};
  // const width = storage[currentTab.url];
  // const widthPx = width !== undefined ? `${width}px` : 'auto';
  // await chrome.scripting.executeScript({
  //   target: { tabId: currentTab.id },
  //   func: setScrollbarWidthVar,
  //   args: [widthPx],
  // });
  const isCustom = !!obj.selector && obj.selector !== ':root';
  document.querySelector('#scrollbar-width-input').value = obj.width;
  document.querySelector('#use-root-selector').checked = !isCustom;
  document.querySelector('#use-custom-selector').checked = isCustom;
  const selectorInput = document.querySelector('#custom-selector-input')
  selectorInput.value = obj.selector || ':root';
  selectorInput.disabled = !isCustom;
  const selectorLabel = selectorInput.parentNode.querySelector('label');
  selectorLabel.classList.toggle('disabled', !isCustom);
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

function addOrRemoveScrollbarPreferencesClass(shouldAddClass) {
  const func = shouldAddClass ? document.body.classList.add : document.body.classList.remove;
  func.call(document.body.classList, DEFAULT_CLASS);
}

async function onUseSelectorChange(radioValue) {
  console.log('onUseSelectorChange', radioValue);
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const storage = await chrome.storage.local.get(currentTab.url);
  const obj = {...DEFAULT_PREFERENCES_OBJ, ...storage[currentTab.url]};
  obj.selector = radioValue === USE_SELECTOR_RADIO.ROOT ? '' : obj.selector || DEFAULT_SELECTOR;
  await chrome.storage.local.set({ [currentTab.url]: obj });
  await getScrollbarPreferences();
  // await chrome.scripting.executeScript({
  //   target: { tabId: currentTab.id },
  //   func: addOrRemoveScrollbarPreferencesClass,
  //   args: [isCustom],
  // });
  // await getScrollbarWidth();
}

document.querySelectorAll('input[name="selector-radio"]').forEach((radio) => {
  radio.addEventListener('click', () => {
    onUseSelectorChange(radio.value);
  });
});

// (async () => {
//   console.log('popup opened');
//   const preferences = await getScrollbarPreferences();
//   const isCustom = !!preferences.selector && preferences.selector !== ':root';
//   document.querySelector('#use-custom-selector').checked = isCustom;
//   document.querySelector('#use-root-selector').checked = !isCustom;
//   onUseSelectorChange(isCustom ? USE_SELECTOR_RADIO.CUSTOM : USE_SELECTOR_RADIO.ROOT);
  // const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  // if (!tabs || !tabs.length) return;
  // const currentTab = tabs[0];
  // await chrome.scripting.insertCSS({
  //   css: `${DEFAULT_SELECTOR}.${DEFAULT_CLASS}::-webkit-scrollbar { width: var(--scrollbar-width) !important; }`,
  //   target: { tabId: currentTab.id },
  // });
// })();