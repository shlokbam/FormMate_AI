// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkForm') {
        const form = document.querySelector('form');
        if (!form) {
            sendResponse({ ready: false, error: 'No form found on this page' });
        } else {
            // Count input fields
            const inputs = form.querySelectorAll('input, textarea, select');
            sendResponse({ ready: inputs.length > 0, fieldCount: inputs.length, error: inputs.length === 0 ? 'No form fields found' : undefined });
        }
    } else if (request.action === 'fillForm') {
        handleFormFill().then(sendResponse);
        return true; // Required for async response
    }
});

// Main form filling function
async function handleFormFill() {
    try {
        const form = document.querySelector('form');
        if (!form) {
            return { success: false, error: 'No form found on this page' };
        }

        console.log('Form found:', form); // Debug log

        // Try different selectors for Google Forms questions
        const formItems = form.querySelectorAll([
            '.freebirdFormviewerViewItemsItemItem', // Standard form items
            '.freebirdFormviewerViewItemsItem',     // Alternative class
            '[role="listitem"]',                    // Role-based selector
            '.freebirdFormviewerViewItemsItemItemTitle', // Direct question title
            '.freebirdFormviewerViewItemsItemItemHeader' // Question header
        ].join(','));

        console.log('Found form items:', formItems.length); // Debug log

        const questions = [];
        const inputMap = [];

        // Extract questions from Google Forms structure
        formItems.forEach(item => {
            console.log('Processing item:', item); // Debug log

            // Try different selectors for question text
            const questionElement = item.querySelector([
                '.freebirdFormviewerViewItemsItemItemTitle',
                '.freebirdFormviewerViewItemsItemItemHeader',
                '[role="heading"]',
                '.freebirdFormviewerViewItemsItemItemTitleContainer'
            ].join(','));

            if (!questionElement) {
                console.log('No question element found in item:', item);
                return;
            }

            const question = questionElement.textContent.trim();
            if (!question) {
                console.log('Empty question text found');
                return;
            }

            console.log('Found question:', question); // Debug log

            // Get the input element - try different selectors
            const input = item.querySelector([
                'input:not([type="hidden"])',
                'textarea',
                'select',
                '[role="textbox"]',
                '[role="combobox"]',
                '[role="listbox"]'
            ].join(','));

            if (!input) {
                console.log('No input element found for question:', question);
                return;
            }

            console.log('Found input element:', input); // Debug log

            questions.push({ question: question });
            inputMap.push({ element: input, question: question });
        });

        if (questions.length === 0) {
            // If no questions found, try alternative approach
            const allTextElements = form.querySelectorAll('div[role="heading"], .freebirdFormviewerViewItemsItemItemTitle');
            console.log('Trying alternative approach, found elements:', allTextElements.length);

            allTextElements.forEach(element => {
                const question = element.textContent.trim();
                if (question) {
                    // Find the next input element
                    let nextElement = element.nextElementSibling;
                    while (nextElement && !nextElement.matches('input, textarea, select')) {
                        nextElement = nextElement.nextElementSibling;
                    }

                    if (nextElement) {
                        console.log('Found question (alternative):', question);
                        questions.push({ question: question });
                        inputMap.push({ element: nextElement, question: question });
                    }
                }
            });
        }

        if (questions.length === 0) {
            return { success: false, error: 'No questions found in the form' };
        }

        console.log('Questions to be sent:', questions); // Debug log

        // Get UID from Chrome storage
        const uid = await getUID();
        if (!uid) {
            return { success: false, error: 'No UID found. Please save your UID in the extension popup.' };
        }

        // Fetch answers from backend
        const answers = await fetchAnswersFromBackend(uid, questions);
        if (!answers || !Array.isArray(answers)) {
            return { success: false, error: 'No answers returned from backend.' };
        }

        console.log('Received answers:', answers); // Debug log

        // Fill form fields with answers
        for (const { element, question } of inputMap) {
            const answerObj = answers.find(a => a.question && a.question.trim() === question);
            if (answerObj && answerObj.answer) {
                console.log(`Filling answer for question "${question}":`, answerObj.answer); // Debug log
                fillInput(element, answerObj.answer);
            } else {
                console.log(`No answer found for question "${question}"`); // Debug log
                fillInput(element, ''); // Leave blank if no answer found
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Form filling error:', error);
        return { success: false, error: error.message };
    }
}

// Helper function to find label for an input
function findLabel(input) {
    // Check for label with 'for' attribute
    const id = input.id;
    if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return label.textContent.trim();
    }

    // Check for parent label
    const parentLabel = input.closest('label');
    if (parentLabel) {
        const labelText = parentLabel.textContent.trim();
        return labelText.replace(input.value, '').trim();
    }

    // Check for preceding label
    const precedingLabel = input.previousElementSibling;
    if (precedingLabel && precedingLabel.tagName === 'LABEL') {
        return precedingLabel.textContent.trim();
    }

    return null;
}

// Helper function to fill input with answer
function fillInput(element, answer) {
    if (element.tagName === 'SELECT') {
        // Handle select elements
        const options = Array.from(element.options);
        const matchingOption = options.find(option => 
            option.text.toLowerCase().includes(answer.toLowerCase())
        );
        if (matchingOption) {
            element.value = matchingOption.value;
        }
    } else {
        // Handle text inputs and textareas
        element.value = answer;
    }

    // Trigger change event
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
}

// Helper function to get UID from Chrome storage
async function getUID() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['formmate_uid'], function(result) {
            resolve(result.formmate_uid || null);
        });
    });
}

// Helper function to fetch answers from backend
async function fetchAnswersFromBackend(uid, questions) {
    try {
        console.log('Sending request to backend with:', { uid, questions }); // Debug log
        
        // Try different backend URLs
        const backendUrls = [
            'http://localhost:5000',
            'https://formmate-ai-backend.onrender.com',  // Add your production URL here
            'http://127.0.0.1:5000'
        ];

        let lastError = null;
        for (const baseUrl of backendUrls) {
            try {
                const response = await fetch(`${baseUrl}/api/process-form`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        uid: uid,
                        questions: questions
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Backend error response from ${baseUrl}:`, errorText);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const data = await response.json();
                console.log('Backend response:', data);
                return data;
            } catch (error) {
                console.log(`Failed to connect to ${baseUrl}:`, error);
                lastError = error;
                continue; // Try next URL
            }
        }

        // If all URLs failed
        throw lastError || new Error('Failed to connect to any backend server');
    } catch (error) {
        console.error('Error fetching answers from backend:', error);
        return null;
    }
} 