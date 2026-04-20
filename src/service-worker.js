chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({ colorHistory: [] });
  }
});

// Handle screenshot requests from the eyedropper content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'captureTab' && sender.tab) {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' })
      .then(dataUrl => sendResponse(dataUrl))
      .catch(() => sendResponse(null));
    return true; // keep channel open for async response
  }
});
