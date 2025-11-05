// Dashboard bridge content script - runs on localhost to enable extension detection
console.log('[Qwen Extension] Dashboard bridge loaded on:', window.location.href);

// Listen for extension detection ping from dashboard
window.addEventListener('message', (event) => {
  // Only respond to messages from the same origin
  if (event.source !== window) {
    return;
  }

  if (event.data?.type === 'QWEN_PING') {
    console.log('[Dashboard Bridge] Received QWEN_PING, responding with QWEN_PONG');
    window.postMessage({ type: 'QWEN_PONG' }, '*');
  }

  if (event.data?.type === 'QWEN_OPEN') {
    console.log('[Dashboard Bridge] Received QWEN_OPEN, opening chat.qwen.ai');
    window.open('https://chat.qwen.ai', '_blank');
  }
});

console.log('[Qwen Extension] Dashboard bridge ready');
