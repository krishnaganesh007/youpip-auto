// Content script for YouTube Auto PiP Extension

let video = null;
let isInPiP = false;
let pipTimeout = null;
let enabledCache = true;

// Debounce helper
function debounce(fn, delay) {
  let timerId;
  return function(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Read enable state once and subscribe to changes
function bootstrapEnabledState() {
  try {
    chrome.storage.sync.get(['isEnabled'], (result) => {
      enabledCache = result && result.isEnabled !== false;
    });
  } catch (_) {}
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.isEnabled) {
        enabledCache = changes.isEnabled.newValue !== false;
      }
    });
  } catch (_) {}
}

// Initialize when DOM is ready
function init() {
  bootstrapEnabledState();
  findVideo();

  // Watch for video changes (SPA navigation, player rebuilds)
  const observer = new MutationObserver(() => {
    if (!video || video.src === '') {
      findVideo();
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Listen for play/pause to avoid PiP when paused
  document.addEventListener('play', handleVisibilityChange, true);
  document.addEventListener('pause', handleVisibilityChange, true);

  // Listen for YouTube SPA navigation events
  window.addEventListener('yt-navigate-finish', () => {
    // After navigation completes, the video element may be replaced
    setTimeout(findVideo, 200);
  });
  window.addEventListener('yt-page-data-updated', () => {
    setTimeout(findVideo, 200);
  });
}

// Find the YouTube video element and bind events
function findVideo() {
  const videoElement = document.querySelector('video');

  if (videoElement && videoElement !== video) {
    video = videoElement;

    video.addEventListener('enterpictureinpicture', () => {
      isInPiP = true;
    });

    video.addEventListener('leavepictureinpicture', () => {
      isInPiP = false;
    });

    // If tab is hidden and video playing, attempt PiP
    handleVisibilityChange();
  }
}

const debouncedEnter = debounce(async () => {
  if (!video || video.paused) return;
  if (!document.pictureInPictureEnabled || video.disablePictureInPicture) return;
  if (document.visibilityState !== 'hidden') return;
  try {
    await video.requestPictureInPicture();
  } catch (error) {
    // swallow
  }
}, 250);

const debouncedExit = debounce(async () => {
  if (!isInPiP) return;
  try {
    await document.exitPictureInPicture();
  } catch (error) {
    // swallow
  }
}, 250);

function handleVisibilityChange() {
  if (!enabledCache) return;

  if (document.hidden && video && !video.paused) {
    debouncedEnter();
  } else if (!document.hidden) {
    debouncedExit();
  }
}

// Initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

