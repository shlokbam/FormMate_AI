// FormMate AI Content Script

class FormMate {
    constructor() {
        this.formData = null;
        this.apiEndpoint = 'http://localhost:5000/api/process-form';
        this.init();
    }

    async init() {
        // Wait for the form to be fully loaded
        await this.waitForForm();
        this.formData = this.parseForm();
        this.injectUI();
        this.setupListeners();
    }

    async waitForForm() {
        return new Promise((resolve) => {
            const checkForm = () => {
                const form = document.querySelector('form');
                if (form) {
                    resolve();
                } else {
                    setTimeout(checkForm, 100);
                }
            };
            checkForm();
        });
    }

    parseForm() {
        const form = document.querySelector('form');
        const questions = [];
        
        // Get all form fields
        const fields = form.querySelectorAll('input, textarea, select');
        
        fields.forEach(field => {
            const question = this.getQuestionText(field);
            const fieldId = field.getAttribute('name') || field.id;
            
            if (question && fieldId) {
                questions.push({
                    question,
                    fieldId,
                    type: field.type || field.tagName.toLowerCase()
                });
            }
        });

        return {
            url: window.location.href,
            title: document.title,
            questions
        };
    }

    getQuestionText(field) {
        // Find the associated label or question text
        const label = field.closest('.freebirdFormviewerViewItemsItemItem');
        if (label) {
            const questionText = label.querySelector('.freebirdFormviewerViewItemsItemItemTitle');
            return questionText ? questionText.textContent.trim() : null;
        }
        return null;
    }

    injectUI() {
        const button = document.createElement('button');
        button.id = 'formmate-fill-button';
        button.textContent = 'Fill with FormMate';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            z-index: 10000;
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(button);
    }

    setupListeners() {
        const button = document.getElementById('formmate-fill-button');
        button.addEventListener('click', () => this.handleFill());
    }

    async handleFill() {
        try {
            const uid = await getUIDFromChromeStorage();
            console.log('UID from Chrome storage:', uid);
            if (!uid) {
                this.showError('Please log in to the FormMate AI dashboard first.');
                return;
            }
            const payload = {
                uid: uid,
                ...this.formData
            };
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
            this.fillForm(answers);
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to get answers. Please try again.');
        }
    }

    fillForm(answers) {
        Object.entries(answers).forEach(([fieldId, answer]) => {
            const field = document.querySelector(`[name="${fieldId}"]`) || 
                         document.getElementById(fieldId);
            
            if (field) {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = true;
                } else {
                    field.value = answer;
                }
                
                // Trigger change event
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #f44336;
            color: white;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// Initialize FormMate when the page loads
window.addEventListener('load', () => {
    new FormMate();
});

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

async function fillForm() {
    try {
        alert('fillForm started');
        const uid = await getUIDFromChromeStorage();
        alert('UID used for request: ' + uid);
        if (!uid) {
            alert('Please log in to the FormMate AI dashboard first.');
            return;
        }
        alert('Building payload...');
        const payload = {
            uid: uid,
            questions: getFormFields().map(f => ({
                question: f.question,
                type: f.type,
                required: f.required
            }))
        };
        alert('Payload built: ' + JSON.stringify(payload));
        const response = await fetch('http://localhost:5000/api/process-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        alert('Fetch sent, waiting for response...');
        const text = await response.text();
        alert('Raw backend response: ' + text);
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseErr) {
            alert('Failed to parse backend response.');
            console.error('Failed to parse backend response:', text);
            return;
        }
        if (data.error) {
            alert('Backend error: ' + data.error);
            throw new Error(data.error);
        }
        if (!Array.isArray(data) || data.length === 0) {
            alert('No answers received from backend.');
            return;
        }
        // Fill the form fields by matching question text
        const fields = getFormFields();
        let filledAny = false;
        data.forEach(answerObj => {
            const field = fields.find(f => f.question.trim().toLowerCase() === answerObj.question.trim().toLowerCase());
            if (field && answerObj.answer) {
                filledAny = true;
                if (field.type === 'text' || field.type === 'textarea') {
                    field.element.value = answerObj.answer;
                    field.element.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        });
        if (!filledAny) {
            alert('No matching fields were filled. Check if the questions match exactly.');
        }
    } catch (err) {
        alert('Top-level error in fillForm: ' + (err && err.message ? err.message : err));
        console.error('Error filling form:', err);
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