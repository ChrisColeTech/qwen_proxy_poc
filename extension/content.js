// Content script for chat.qwen.ai - Qwen Credential Extractor
console.log('[Qwen Extension] Content script loaded on:', window.location.href);

/**
 * Check if user is logged in by looking for auth indicators
 */
function isLoggedIn() {
  // Check for common logged-in indicators on chat.qwen.ai

  // Check if URL indicates logged-in state
  const url = window.location.href;
  if (url.includes('/login') || url.includes('/signin')) {
    return false;
  }

  // Check for user profile elements (adjust selectors as needed)
  const hasUserProfile = document.querySelector('[data-user-id]') !== null ||
                         document.querySelector('.user-profile') !== null ||
                         document.querySelector('[class*="avatar"]') !== null ||
                         document.querySelector('[class*="Avatar"]') !== null ||
                         document.querySelector('button[class*="user"]') !== null;

  return hasUserProfile;
}

/**
 * Monitor for login completion
 */
function monitorLogin() {
  console.log('[Content Script] Monitoring for login...');

  // Check immediately
  if (isLoggedIn()) {
    console.log('[Content Script] Already logged in, extracting credentials');
    handleLoginDetected();
    return;
  }

  // Watch for navigation/DOM changes indicating login
  const observer = new MutationObserver((mutations) => {
    if (isLoggedIn()) {
      console.log('[Content Script] Login detected via DOM change');
      observer.disconnect();
      handleLoginDetected();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also listen for URL changes
  let lastUrl = window.location.href;
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log('[Content Script] URL changed:', currentUrl);

      if (isLoggedIn()) {
        observer.disconnect();
        handleLoginDetected();
      }
    }
  }, 1000);
}

/**
 * Handle login detection - send message to background script
 */
async function handleLoginDetected() {
  console.log('[Content Script] Handling login...');

  // Wait a bit for cookies to be set
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('[Content Script] Requesting credential extraction from background...');

  try {
    // Send message to background script to extract credentials
    const response = await chrome.runtime.sendMessage({
      type: 'EXTRACT_CREDENTIALS'
    });

    console.log('[Content Script] Background response:', response);

    if (response.success) {
      showNotification('Qwen credentials saved successfully!');
    } else {
      showNotification('Failed to save credentials: ' + response.error, true);
    }

  } catch (error) {
    console.error('[Content Script] Failed to communicate with background:', error);
    showNotification('Extension error: ' + error.message, true);
  }
}

/**
 * Show user notification
 * @param {string} message - Notification message
 * @param {boolean} isError - Whether this is an error notification
 */
function showNotification(message, isError = false) {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${isError ? '#ef4444' : '#10b981'};
    color: white;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 999999;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Start monitoring when script loads
monitorLogin();
