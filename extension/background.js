import config from './config.js';

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    // Initialize default settings
    chrome.storage.sync.get({
        autoFill: false,
        saveAnswers: true,
        savedAnswers: {}
    }, (items) => {
        chrome.storage.sync.set(items);
    });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Inject content script if not already injected
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        }).catch(err => console.log('Content script already injected'));

        // Check if the page contains a form
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: () => document.querySelector('form') !== null
        }).then(([result]) => {
            if (result.result) {
                // Update extension icon to indicate form is present
                chrome.action.setIcon({
                    tabId: tabId,
                    path: {
                        16: 'icons/icon16.png',
                        48: 'icons/icon48.png',
                        128: 'icons/icon128.png'
                    }
                });
            } else {
                // Reset extension icon
                chrome.action.setIcon({
                    tabId: tabId,
                    path: {
                        16: 'icons/icon16.png',
                        48: 'icons/icon48.png',
                        128: 'icons/icon128.png'
                    }
                });
            }
        }).catch(err => console.log('Error checking form:', err));
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAuthToken') {
        // First try local storage for faster access
        chrome.storage.local.get(['token'], (result) => {
            if (result.token) {
                sendResponse({ token: result.token });
            } else {
                // If not in local storage, try sync storage
                chrome.storage.sync.get(['token'], (syncResult) => {
                    if (syncResult.token) {
                        // Store in local storage for future use
                        chrome.storage.local.set({ token: syncResult.token });
                    }
                    sendResponse({ token: syncResult.token });
                });
            }
        });
        return true; // Required for async sendResponse
    }
});

// Handle token expiration and validation
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.token) {
        const newToken = changes.token.newValue;
        if (newToken) {
            // Validate token with backend
            fetch(`${config.BACKEND_URL}/api/validate-token`, {
                headers: {
                    'Authorization': `Bearer ${newToken}`
                }
            }).then(response => {
                if (!response.ok) {
                    // If token validation fails, clear the token
                    chrome.storage.sync.remove(['token']);
                    chrome.storage.local.remove(['token']);
                }
            }).catch(() => {
                // If token validation fails, clear the token
                chrome.storage.sync.remove(['token']);
                chrome.storage.local.remove(['token']);
            });
        }
    }
}); 