const DEFAULT_SCROLLBAR_WIDTH_PX = 15;
const SCROLLBAR_USE_RADIO = { CUSTOM: 'custom', DEFAULT: 'default' };

function setScrollbarWidthVar(widthVar) {
  document.body.style.setProperty('--scrollbar-width', widthVar);
}

async function getScrollbarWidth() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const storage = await chrome.storage.local.get(currentTab.url);
  const width = storage[currentTab.url];
  const widthPx = width !== undefined ? `${width}px` : 'auto';
  await chrome.scripting.executeScript({
    target: { tabId: currentTab.id },
    func: setScrollbarWidthVar,
    args: [widthPx],
  });
  document.querySelector('#scrollbar-width-input').value = width ?? "";
  console.log('getScrollbarWidth', width, currentTab)
  return width;
}

getScrollbarWidth();

document.querySelector('#scrollbar-width-input').addEventListener('change', async (event) => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const width = parseInt(event.target.value, 10);
  await chrome.storage.local.set({ [currentTab.url]: width });
  await getScrollbarWidth();
  console.log('scrollbar-width-input changed', width, currentTab);
});

function addOrRemoveScrollbarPreferencesClass(shouldAddClass) {
  const func = shouldAddClass ? document.body.classList.add : document.body.classList.remove;
  func.call(document.body.classList, '__scrollbar-preferences-ext');
}

async function onScrollbarUseChange(radioValue) {
  console.log('onScrollbarUseChange', radioValue);
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const width = await getScrollbarWidth();
  const input = document.querySelector('#scrollbar-width-input');
  const isCustom = radioValue === SCROLLBAR_USE_RADIO.CUSTOM;
  if (isCustom) {
    input.disabled = false;
    const widthOverride = width ?? (input.value || DEFAULT_SCROLLBAR_WIDTH_PX);
    await chrome.storage.local.set({ [currentTab.url]: widthOverride });
  } else {
    input.disabled = true;
    await chrome.storage.local.remove(currentTab.url);
  }
  await chrome.scripting.executeScript({
    target: { tabId: currentTab.id },
    func: addOrRemoveScrollbarPreferencesClass,
    args: [isCustom],
  });
  await getScrollbarWidth();
}

document.querySelectorAll('input[name="scrollbar-use-radio"]').forEach((radio) => {
  radio.addEventListener('click', () => {
    onScrollbarUseChange(radio.value);
  });
});

/*
 * On popup open, initialize radio buttons to either "default" or "custom"
 * based on the scrollbar width for the current tab URL.
 * 
 * - If scrollbar width is not set, use "default" and disable the scrollbar width input.
 * - If scrollbar width is set, use "custom" and enable the scrollbar width input.
 */
(async () => {
  console.log('popup opened');
  const width = await getScrollbarWidth();
  const [checked, unchecked] = width !== undefined ? [SCROLLBAR_USE_RADIO.CUSTOM, SCROLLBAR_USE_RADIO.DEFAULT] : [SCROLLBAR_USE_RADIO.DEFAULT, SCROLLBAR_USE_RADIO.CUSTOM];
  document.querySelector(`#scrollbar-use-${checked}`).checked = true;
  document.querySelector(`#scrollbar-use-${unchecked}`).checked = false;
  onScrollbarUseChange(checked);
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  await chrome.scripting.insertCSS({
    css: `body.__scrollbar-preferences-ext::-webkit-scrollbar { width: var(--scrollbar-width); }`,
    target: { tabId: currentTab.id },
  });
})();