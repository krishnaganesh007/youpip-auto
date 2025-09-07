// Popup script for YouTube Auto PiP Extension

document.addEventListener('DOMContentLoaded', async () => {
  const enableToggle = document.getElementById('enableToggle');
  const statusText = document.getElementById('statusText');
  const statusMessage = document.getElementById('statusMessage');
  const statusDot = document.querySelector('.status-dot');
  
  // Get current extension status
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
    const isEnabled = response.enabled;
    
    enableToggle.checked = isEnabled;
    updateStatus(isEnabled);
    
  } catch (error) {
    console.error('Failed to get extension status:', error);
    updateStatus(false);
  }
  
  // Handle toggle changes
  enableToggle.addEventListener('change', async (event) => {
    const enabled = event.target.checked;
    
    try {
      await chrome.runtime.sendMessage({ 
        action: 'toggleExtension', 
        enabled: enabled 
      });
      
      updateStatus(enabled);
      
    } catch (error) {
      console.error('Failed to toggle extension:', error);
      // Revert toggle state on error
      enableToggle.checked = !enabled;
    }
  });
  
  function updateStatus(enabled) {
    if (enabled) {
      statusText.textContent = 'Auto PiP Enabled';
      statusMessage.textContent = 'Ready to watch';
      statusDot.classList.remove('inactive');
    } else {
      statusText.textContent = 'Auto PiP Disabled';
      statusMessage.textContent = 'Extension inactive';
      statusDot.classList.add('inactive');
    }
  }
});
