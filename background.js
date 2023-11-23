chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('message', message, sender);
  if (message === 'activate-badge') {
    chrome.action.setBadgeText({ text: 'on', tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#7f7', tabId: sender.tab.id });
  }
});