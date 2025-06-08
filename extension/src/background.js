// FormMate AI Background Script

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('FormMate AI extension installed');
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'logSubmission') {
        // Log form submission to Firebase
        logSubmissionToFirebase(request.data)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Required for async sendResponse
    }
});

// Function to log submission to Firebase
async function logSubmissionToFirebase(data) {
    try {
        const response = await fetch('http://localhost:5000/api/log-submission', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to log submission');
        }

        return await response.json();
    } catch (error) {
        console.error('Error logging submission:', error);
        throw error;
    }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.includes('google.com/forms')) {
        // Inject content script
        chrome.scripting.executeScript({
            target: { tabId },
            files: ['src/content.js']
        }).catch(error => {
            console.error('Error injecting content script:', error);
        });
    }
}); 