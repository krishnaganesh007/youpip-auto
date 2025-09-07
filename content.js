// Content script for YouTube Auto PiP Extension

let video = null;
let isInPiP = false;
let pipTimeout = null;

// Initialize when DOM is ready
function init() {
  findVideo();
  
  // Watch for video changes (e.g., when navigating to new video)
  const observer = new MutationObserver(() => {
    if (!video || video.src === '') {
      findVideo();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

// Find the YouTube video element
function findVideo() {
  const videoElement = document.querySelector('video');
  
  if (videoElement && videoElement !== video) {
    video = videoElement;
    
    // Add event listeners for PiP events
    video.addEventListener('enterpictureinpicture', () => {
      isInPiP = true;
    });
    
    video.addEventListener('leavepictureinpicture', () => {
      isInPiP = false;
    });
  }
}

// Handle page visibility changes
function handleVisibilityChange() {
  if (document.hidden && video && !video.paused) {
    // Page is hidden and video is playing - request PiP
    requestPiP();
  } else if (!document.hidden && isInPiP) {
    // Page is visible and in PiP - exit PiP
    exitPiP();
  }
}

// Request Picture-in-Picture mode
async function requestPiP() {
  if (!video || isInPiP || video.paused) return;
  
  try {
    // Check if PiP is supported and enabled
    if (!document.pictureInPictureEnabled || video.disablePictureInPicture) {
      return;
    }
    
    // Add a small delay to avoid rapid toggling
    clearTimeout(pipTimeout);
    pipTimeout = setTimeout(async () => {
      try {
        await video.requestPictureInPicture();
      } catch (error) {
        console.log('PiP request failed:', error);
      }
    }, 300);
    
  } catch (error) {
    console.log('PiP not available:', error);
  }
}

// Exit Picture-in-Picture mode
async function exitPiP() {
  if (!isInPiP) return;
  
  try {
    clearTimeout(pipTimeout);
    await document.exitPictureInPicture();
  } catch (error) {
    console.log('PiP exit failed:', error);
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enterPiP') {
    requestPiP();
  } else if (request.action === 'exitPiP') {
    exitPiP();
  }
});

// Initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
