// Background service worker for YouTube Auto PiP Extension

let isExtensionEnabled = true;
let youtubeTabId = null;

// Initialize extension state on startup
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.sync.get(['isEnabled']);
  isExtensionEnabled = result.isEnabled !== false;
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.sync.set({ isEnabled: true });
  isExtensionEnabled = true;
});

// Listen for tab activation changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!isExtensionEnabled) return;
  
  const tab = await chrome.tabs.get(activeInfo.tabId);
  const isYouTubeTab = tab.url && tab.url.includes('youtube.com/watch');
  
  if (isYouTubeTab) {
    // User switched back to YouTube tab - exit PiP
    youtubeTabId = activeInfo.tabId;
    chrome.tabs.sendMessage(activeInfo.tabId, { action: 'exitPiP' });
  } else if (youtubeTabId) {
    // User switched away from YouTube tab - enter PiP
    chrome.tabs.sendMessage(youtubeTabId, { action: 'enterPiP' });
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!isExtensionEnabled) return;
  
  if (changeInfo.url && tab.url && tab.url.includes('youtube.com/watch')) {
    youtubeTabId = tabId;
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleExtension') {
    isExtensionEnabled = request.enabled;
    chrome.storage.sync.set({ isEnabled: isExtensionEnabled });
    
    // If disabling, exit any active PiP
    if (!isExtensionEnabled && youtubeTabId) {
      chrome.tabs.sendMessage(youtubeTabId, { action: 'exitPiP' });
    }
    
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    sendResponse({ enabled: isExtensionEnabled });
  }
});

// Handle window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (!isExtensionEnabled) return;
  
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus - enter PiP if YouTube is active
    if (youtubeTabId) {
      chrome.tabs.sendMessage(youtubeTabId, { action: 'enterPiP' });
    }
  } else {
    // Browser gained focus - check if YouTube tab is active
    const [activeTab] = await chrome.tabs.query({ active: true, windowId: windowId });
    if (activeTab && activeTab.url && activeTab.url.includes('youtube.com/watch')) {
      youtubeTabId = activeTab.id;
      chrome.tabs.sendMessage(activeTab.id, { action: 'exitPiP' });
    }
  }
});
