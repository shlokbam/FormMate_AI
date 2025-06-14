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
                        16: 'icons/placeholder.png',
                        32: 'icons/placeholder.png',
                        48: 'icons/placeholder.png',
                        128: 'icons/placeholder.png'
                    }
                });
            } else {
                // Reset extension icon
                chrome.action.setIcon({
                    tabId: tabId,
                    path: {
                        16: 'icons/placeholder.png',
                        32: 'icons/placeholder.png',
                        48: 'icons/placeholder.png',
                        128: 'icons/placeholder.png'
                    }
                });
            }
        }).catch(err => console.log('Error checking form:', err));
    }
}); 