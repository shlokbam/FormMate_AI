// FormMate AI Content Script
console.log('=== FormMate AI Script Starting ===');

// Add a global error handler to catch any script loading issues
window.addEventListener('error', function(e) {
    console.error('FormMate AI Error:', e.message, 'at', e.filename, ':', e.lineno);
});

// Add a DOMContentLoaded listener to ensure we know when the page is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== FormMate AI: DOM Content Loaded ===');
});

class FormMate {
    constructor() {
        console.log('=== FormMate AI: Constructor Called ===');
        this.formData = null;
        this.apiEndpoint = 'http://localhost:5000/api/process-form';
        console.log('FormMate initialized with endpoint:', this.apiEndpoint);
        this.init();
    }

    async init() {
        console.log('Initializing FormMate...');
        // Wait for the form to be fully loaded
        await this.waitForForm();
        this.formData = this.parseForm();
        console.log('Form data parsed:', JSON.stringify(this.formData, null, 2));
        this.injectUI();
        this.setupListeners();
    }

    async waitForForm() {
        console.log('Waiting for form to load...');
        return new Promise((resolve) => {
            const checkForm = () => {
                const form = document.querySelector('form');
                if (form) {
                    console.log('Form found:', form);
                    resolve();
                } else {
                    setTimeout(checkForm, 100);
                }
            };
            checkForm();
        });
    }

    isInternalField(field) {
        // List of Google Form's internal field names and patterns
        const internalPatterns = [
            'entry.',
            'fbzx',
            'pageHistory',
            'token',
            'submissionTimestamp',
            'partialResponse',
            'draftResponse',
            'fvv',
            'submitButton'
        ];

        const fieldId = field.getAttribute('name') || field.id || '';
        console.log('Checking if field is internal:', fieldId);
        
        const isInternal = internalPatterns.some(pattern => {
            const matches = fieldId.toLowerCase().includes(pattern.toLowerCase());
            if (matches) {
                console.log(`Field ${fieldId} matches internal pattern: ${pattern}`);
            }
            return matches;
        });
        
        if (isInternal) {
            console.log('Skipping internal field:', fieldId);
        }
        return isInternal;
    }

    getQuestionText(field) {
        console.log('Getting question text for field:', field);
        
        // Skip internal fields
        if (this.isInternalField(field)) {
            console.log('Field is internal, skipping question text extraction');
            return null;
        }

        // For Google Forms, the question is usually in a div with role="heading"
        const listItem = field.closest('div[role="listitem"]');
        if (listItem) {
            const questionDiv = listItem.querySelector('div[role="heading"]');
            if (questionDiv) {
                const text = questionDiv.textContent.trim();
                console.log('Found question in heading:', text);
                return text;
            }
        }

        // Try to find the question in the parent container
        const container = field.closest('.freebirdFormviewerViewItemsItemItem');
        if (container) {
            const questionDiv = container.querySelector('.freebirdFormviewerViewItemsItemTitle');
            if (questionDiv) {
                const text = questionDiv.textContent.trim();
                console.log('Found question in container:', text);
                return text;
            }
        }

        // Fallback to label
        const label = field.closest('label') || 
                     document.querySelector(`label[for="${field.id}"]`) ||
                     field.previousElementSibling;
        
        if (label) {
            const text = label.textContent.trim();
            console.log('Found question in label:', text);
            return text;
        }

        // Fallback to placeholder or name
        const fallbackText = field.placeholder || field.name || field.id;
        console.log('Using fallback text:', fallbackText);
        return fallbackText;
    }

    parseForm() {
        console.log('Starting form parsing...');
        const form = document.querySelector('form');
        const questions = [];
        
        // Get all form fields
        const fields = form.querySelectorAll('input, textarea, select, div[role="radiogroup"], div[role="checkbox"]');
        console.log('Found form fields:', fields.length);
        
        fields.forEach((field, index) => {
            console.log(`\nProcessing field ${index + 1}:`, field);
            
            // Skip internal fields
            if (this.isInternalField(field)) {
                console.log('Skipping internal field');
                return;
            }

            const question = this.getQuestionText(field);
            const fieldId = field.getAttribute('name') || field.id;
            
            if (question && fieldId) {
                console.log('Field details:', {
                    question,
                    fieldId,
                    type: field.type || field.getAttribute('role') || field.tagName.toLowerCase()
                });
                
                questions.push({
                    question,
                    fieldId,
                    type: field.type || field.getAttribute('role') || field.tagName.toLowerCase()
                });
            } else {
                console.log('Skipping field - missing question or fieldId');
            }
        });

        console.log('\nFinal questions to be processed:', JSON.stringify(questions, null, 2));
        return {
            url: window.location.href,
            title: document.title,
            questions
        };
    }

    injectUI() {
        console.log('Injecting UI...');
        const button = document.createElement('button');
        button.id = 'formmate-fill-button';
        button.textContent = 'Fill Form';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(button);
        console.log('UI injected');
    }

    setupListeners() {
        console.log('Setting up event listeners...');
        const button = document.getElementById('formmate-fill-button');
        button.addEventListener('click', () => this.handleFill());
        console.log('Event listeners set up');
    }

    async handleFill() {
        console.log('\n=== Starting Form Fill Process ===');
        try {
            const uid = await getUIDFromChromeStorage();
            console.log('UID from Chrome storage:', uid);
            if (!uid) {
                this.showError('Please log in to the FormMate AI dashboard first.');
                return;
            }

            // Filter out any remaining internal fields
            const validQuestions = this.formData.questions.filter(q => !this.isInternalField({ getAttribute: () => q.fieldId }));
            console.log('\nValid questions after filtering:', JSON.stringify(validQuestions, null, 2));

            // Log the questions being sent
            console.log('\nQuestions being sent to backend:', JSON.stringify(validQuestions.map(q => ({
                question: q.question,
                type: q.type
            })), null, 2));

            const payload = {
                uid: uid,
                questions: validQuestions.map(q => ({
                    question: q.question,
                    type: q.type
                }))
            };

            console.log('\nSending payload to backend:', JSON.stringify(payload, null, 2));

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const answers = await response.json();
            console.log('\nReceived answers from backend:', JSON.stringify(answers, null, 2));
            this.fillForm(answers);
        } catch (error) {
            console.error('Error in handleFill:', error);
            this.showError('Failed to get answers. Please try again.');
        }
    }

    fillForm(answers) {
        console.log('\n=== Starting Form Fill ===');
        if (!Array.isArray(answers)) {
            console.error('Invalid answers format:', answers);
            return;
        }

        let filledAny = false;
        let errorMessages = [];

        answers.forEach((answerObj, index) => {
            console.log(`\nProcessing answer ${index + 1}:`, answerObj);

            if (!answerObj.question) {
                console.error('Answer object missing question:', answerObj);
                return;
            }

            const field = this.formData.questions.find(q => q.question === answerObj.question);
            if (!field) {
                console.log(`No matching field found for question: ${answerObj.question}`);
                return;
            }

            console.log('Found matching field:', field);

            const element = document.querySelector(`[name="${field.fieldId}"]`) || 
                           document.getElementById(field.fieldId);

            if (!element) {
                console.log(`No element found for field ID: ${field.fieldId}`);
                return;
            }

            if (answerObj.error) {
                console.log(`Error for field ${field.question}: ${answerObj.error}`);
                errorMessages.push(`${field.question}: ${answerObj.error}`);
            } else if (answerObj.answer) {
                console.log(`Filling field ${field.question} with answer: ${answerObj.answer}`);
                filledAny = true;
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = true;
                } else {
                    element.value = answerObj.answer;
                }
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        if (!filledAny) {
            console.log('No fields were filled');
            errorMessages.push('No answers were found in your knowledge base. Please add answers to your knowledge base first.');
        }

        if (errorMessages.length > 0) {
            console.log('Showing error messages:', errorMessages);
            this.showError(errorMessages.join('\n'));
        }
    }

    showError(message) {
        console.log('Showing error:', message);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 4px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        errorDiv.innerHTML = `
            <strong>FormMate AI Notice:</strong>
            <p style="margin: 5px 0;">${message}</p>
            <button onclick="this.parentElement.remove()" style="position: absolute; top: 5px; right: 5px; background: none; border: none; cursor: pointer; font-size: 16px;">×</button>
        `;
        document.body.appendChild(errorDiv);
    }
}

// Initialize FormMate
new FormMate();

console.log('FormMate AI content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Only alert for fillForm action
    switch (request.action) {
        case 'checkForm':
            checkForm().then(sendResponse).catch(error => {
                console.error('Error in checkForm:', error);
                sendResponse({ ready: false, error: error.message });
            });
            return true;
        case 'fillForm':
            fillForm()
                .then(() => sendResponse({ success: true }))
                .catch(error => {
                    alert('Error in fillForm: ' + (error && error.message ? error.message : error));
                    console.error('Error in fillForm:', error);
                    sendResponse({ success: false, error: error ? error.message : 'Unknown error' });
                });
            return true;
        case 'saveForm':
            saveForm().then(sendResponse).catch(error => {
                console.error('Error in saveForm:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true;
    }
});

// Check if form is ready to be filled
async function checkForm() {
    console.log('Checking form...');
    try {
        const formFields = getFormFields();
        console.log('Found form fields:', formFields);
        
        if (formFields.length === 0) {
            console.log('No form fields found');
            return { ready: false, error: 'No form fields found' };
        }

        return {
            ready: true,
            fieldCount: formFields.length,
            fields: formFields.map(f => ({
                question: f.question,
                type: f.type,
                required: f.required
            }))
        };
    } catch (error) {
        console.error('Error checking form:', error);
        return { ready: false, error: error.message };
    }
}

// Get all form fields
function getFormFields() {
    console.log('Getting form fields...');
    const fields = [];
    
    // Get text inputs
    document.querySelectorAll('input[type="text"]').forEach(input => {
        console.log('Found text input:', input);
        fields.push({
            type: 'text',
            element: input,
            question: getQuestionText(input),
            required: input.hasAttribute('required')
        });
    });

    // Get textareas
    document.querySelectorAll('textarea').forEach(textarea => {
        console.log('Found textarea:', textarea);
        fields.push({
            type: 'textarea',
            element: textarea,
            question: getQuestionText(textarea),
            required: textarea.hasAttribute('required')
        });
    });

    // Get radio buttons
    document.querySelectorAll('div[role="radiogroup"]').forEach(group => {
        console.log('Found radio group:', group);
        const options = Array.from(group.querySelectorAll('div[role="radio"]')).map(radio => ({
            text: radio.textContent.trim(),
            value: radio.getAttribute('data-value')
        }));

        fields.push({
            type: 'radio',
            element: group,
            question: getQuestionText(group),
            options,
            required: group.hasAttribute('aria-required')
        });
    });

    // Get checkboxes
    document.querySelectorAll('div[role="checkbox"]').forEach(checkbox => {
        console.log('Found checkbox:', checkbox);
        fields.push({
            type: 'checkbox',
            element: checkbox,
            question: getQuestionText(checkbox),
            required: checkbox.hasAttribute('aria-required')
        });
    });

    console.log('Total fields found:', fields.length);
    return fields;
}

// Get question text for a field
function getQuestionText(element) {
    console.log('Getting question text for:', element);
    
    // Try to find the question text in various ways
    const questionElement = element.closest('div[role="listitem"]')?.querySelector('div[role="heading"]');
    if (questionElement) {
        const text = questionElement.textContent.trim();
        console.log('Found question in heading:', text);
        return text;
    }

    // Try to find label
    const label = element.closest('label') || element.previousElementSibling;
    if (label) {
        const text = label.textContent.trim();
        console.log('Found question in label:', text);
        return text;
    }

    // Try to find aria-label
    if (element.hasAttribute('aria-label')) {
        const text = element.getAttribute('aria-label');
        console.log('Found question in aria-label:', text);
        return text;
    }

    console.log('No question text found, using default');
    return 'Unknown Question';
}

function getUIDFromChromeStorage() {
    return new Promise((resolve) => {
        if (window.chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['formmate_uid'], function(result) {
                resolve(result.formmate_uid);
            });
        } else {
            resolve(null);
        }
    });
}

// Add this function before fillForm()
function normalizeQuestionText(text) {
    if (!text) return '';
    
    // Remove asterisks and other special characters first
    text = text.replace(/[*]/g, '').trim();
    
    // Convert to lowercase and remove remaining special characters
    text = text.toLowerCase().trim();
    text = text.replace(/[^a-z0-9\s]/g, '');
    
    // Common variations mapping with more flexible matching
    const variations = {
        'contact number': ['phone number', 'mobile number', 'cell number', 'telephone number', 'contact', 'phone'],
        'name': ['full name', 'complete name', 'your name', 'fullname'],
        'email': ['email address', 'e mail', 'e-mail'],
        'location': ['current location', 'where are you', 'your location', 'present location', 'current place', 'where do you live', 'residence', 'address'],
        'hometown': ['home town', 'native place', 'place of origin', 'where are you from', 'birth place', 'native city'],
        'role': ['role applied for', 'position', 'job role', 'applied position', 'desired role', 'job title', 'applying for']
    };

    // First try exact match
    for (const [standard, alts] of Object.entries(variations)) {
        if (text === standard || alts.includes(text)) {
            return standard;
        }
    }

    // Then try partial match
    for (const [standard, alts] of Object.entries(variations)) {
        // Check if the text contains any of the variations
        if (text.includes(standard) || alts.some(alt => text.includes(alt))) {
            return standard;
        }
    }

    // Special cases for common fields
    if (text.includes('name')) return 'name';
    if (text.includes('location') || text.includes('where') || text.includes('place') || text.includes('address')) return 'location';
    if (text.includes('home') || text.includes('town') || text.includes('native')) return 'hometown';
    if (text.includes('role') || text.includes('position') || text.includes('job')) return 'role';
    if (text.includes('phone') || text.includes('contact') || text.includes('mobile')) return 'contact number';
    if (text.includes('email') || text.includes('mail')) return 'email';

    return text;
}

async function fillForm() {
    try {
        console.log('fillForm started');
        const uid = await getUIDFromChromeStorage();
        console.log('UID used for request:', uid);
        if (!uid) {
            console.error('Please log in to the FormMate AI dashboard first.');
            return;
        }
        console.log('Building payload...');
        const payload = {
            uid: uid,
            questions: getFormFields().map(f => ({
                question: f.question,
                type: f.type,
                required: f.required
            }))
        };
        console.log('Payload built:', payload);
        const response = await fetch('http://localhost:5000/api/process-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('Fetch sent, waiting for response...');
        const text = await response.text();
        console.log('Raw backend response:', text);
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseErr) {
            console.error('Failed to parse backend response:', text);
            return;
        }
        if (data.error) {
            console.error('Backend error:', data.error);
            throw new Error(data.error);
        }
        if (!Array.isArray(data) || data.length === 0) {
            console.error('No answers received from backend.');
            return;
        }

        // Get all form fields
        const fields = getFormFields();
        console.log('Form fields found:', fields.map(f => f.question));

        // Create a map of normalized questions to fields
        const fieldMap = new Map();
        fields.forEach(field => {
            const normalizedQuestion = normalizeQuestionText(field.question);
            fieldMap.set(normalizedQuestion, field);
            console.log(`Mapped field "${field.question}" to normalized form "${normalizedQuestion}"`);
        });

        // Fill the form fields
        let filledAny = false;
        let errorMessages = [];
        
        data.forEach(answerObj => {
            const normalizedAnswerQuestion = normalizeQuestionText(answerObj.question);
            console.log(`\nProcessing answer for question: "${answerObj.question}"`);
            console.log(`Normalized to: "${normalizedAnswerQuestion}"`);

            // Try to find matching field
            const field = fieldMap.get(normalizedAnswerQuestion);
            
            if (field) {
                if (answerObj.error) {
                    console.log(`Error for field "${field.question}": ${answerObj.error}`);
                    errorMessages.push(`${field.question}: ${answerObj.error}`);
                } else if (answerObj.answer) {
                    console.log(`Found matching field: "${field.question}"`);
                    filledAny = true;
                    if (field.type === 'text' || field.type === 'textarea') {
                        field.element.value = answerObj.answer;
                        field.element.dispatchEvent(new Event('input', { bubbles: true }));
                        console.log(`Filled field with answer: "${answerObj.answer}"`);
                    }
                }
            } else {
                console.log(`No matching field found for "${normalizedAnswerQuestion}"`);
            }
        });

        if (!filledAny) {
            console.warn('No matching fields were filled. Check if the questions match exactly.');
            errorMessages.push('No answers were found in your knowledge base. Please add answers to your knowledge base first.');
        }

        // Show error messages if any
        if (errorMessages.length > 0) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ffebee; color: #c62828; padding: 15px; border-radius: 4px; z-index: 10000; max-width: 300px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
            errorDiv.innerHTML = `
                <strong>FormMate AI Notice:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    ${errorMessages.map(msg => `<li>${msg}</li>`).join('')}
                </ul>
                <p style="margin: 10px 0 0 0; font-size: 0.9em;">Please add answers to your knowledge base in the FormMate AI dashboard.</p>
                <button onclick="this.parentElement.remove()" style="position: absolute; top: 5px; right: 5px; background: none; border: none; cursor: pointer; font-size: 16px;">×</button>
            `;
            document.body.appendChild(errorDiv);
        }
    } catch (err) {
        console.error('Top-level error in fillForm:', err);
        throw err;
    }
}

// Save the form for later
async function saveForm() {
    console.log('Saving form...');
    try {
        const fields = getFormFields();
        if (fields.length === 0) {
            throw new Error('No form fields found');
        }

        console.log('Saving form with fields:', fields.map(f => f.question));

        // Save to backend
        const response = await fetch('http://localhost:5000/api/save-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: window.location.href,
                title: document.title,
                fields: fields.map(f => ({
                    question: f.question,
                    type: f.type,
                    required: f.required
                }))
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to save form: ${response.statusText}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error saving form:', error);
        return { success: false, error: error.message };
    }
} 