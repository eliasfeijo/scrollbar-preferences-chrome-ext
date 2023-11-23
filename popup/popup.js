const DEFAULT_SCROLLBAR_WIDTH_PX = 5;
const SCROLLBAR_USE_RADIO = { CUSTOM: 'custom', DEFAULT: 'default' };

async function getScrollbarWidth() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const storage = await chrome.storage.local.get(currentTab.url);
  document.querySelector('#scrollbar-width-input').value = storage[currentTab.url];
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

async function onScrollbarUseChange(radioValue) {
  console.log('onScrollbarUseChange', radioValue);
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return;
  const currentTab = tabs[0];
  const width = await getScrollbarWidth();
  if(radioValue === SCROLLBAR_USE_RADIO.CUSTOM) {
    document.querySelector('#scrollbar-width-input').disabled = false;
    if (width === undefined) {
      document.querySelector('#scrollbar-width-input').value = DEFAULT_SCROLLBAR_WIDTH_PX;
      await chrome.storage.local.set({ [currentTab.url]: DEFAULT_SCROLLBAR_WIDTH_PX });
    }
    // await chrome.tabs.executeScript({
    //   code: `document.body.style.setProperty('--scrollbar-width', '${width}px');`
    // });
    return;
  }
  document.querySelector('#scrollbar-width-input').disabled = true;
  await chrome.storage.local.remove(currentTab.url);
  // await chrome.tabs.executeScript({
  //   code: `document.body.style.setProperty('--scrollbar-width', '');`
  // });
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
})();