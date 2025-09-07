// Background service worker for YouTube Auto PiP Extension

let isExtensionEnabled = true;

// Initialize extension state on startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(['isEnabled'], (result) => {
    isExtensionEnabled = result && result.isEnabled !== false;
  });
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ isEnabled: true }, () => {
    isExtensionEnabled = true;
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleExtension') {
    isExtensionEnabled = !!request.enabled;
    chrome.storage.sync.set({ isEnabled: isExtensionEnabled }, () => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'getStatus') {
    sendResponse({ enabled: isExtensionEnabled });
    return true;
  } else if (request.action === 'isEnabled') {
    sendResponse({ isEnabled: isExtensionEnabled });
    return true;
  }
});
