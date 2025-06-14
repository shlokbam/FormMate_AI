// Function to extract questions from the page
function extractQuestions() {
    const questions = [];
    
    // Google Forms specific selectors
    const formElements = document.querySelectorAll('form div[role="listitem"]');
    
    formElements.forEach(item => {
        // Get the question text
        const questionElement = item.querySelector('div[role="heading"]');
        if (!questionElement) return;
        
        let question = questionElement.textContent.trim();
        
        // Clean up the question text
        question = question.replace(/[•*]/g, '').trim();
        
        // Remove any asterisk indicating required field
        question = question.replace(/\*$/, '').trim();
        
        // Remove any question number prefix (e.g., "1. ")
        question = question.replace(/^\d+\.\s*/, '').trim();

        // Check for radio group
        const radioInputs = item.querySelectorAll('input[type="radio"]');
        if (radioInputs.length > 0) {
            // Extract all radio options and their labels
            const options = [];
            radioInputs.forEach(radio => {
                let label = '';
                // Try to find the label text for this radio input
                // Google Forms: label is usually in a sibling span or div
                let labelSpan = null;
                let parent = radio.parentElement;
                // Traverse up to 2 levels up to find a span with text
                for (let i = 0; i < 2 && parent; i++) {
                    labelSpan = parent.querySelector('span');
                    if (labelSpan && labelSpan.textContent.trim()) {
                        label = labelSpan.textContent.trim();
                        break;
                    }
                    parent = parent.parentElement;
                }
                // Fallback: try next sibling
                if (!label && radio.nextElementSibling) {
                    label = radio.nextElementSibling.textContent.trim();
                }
                // Fallback: try parent text content
                if (!label && radio.parentElement) {
                    label = radio.parentElement.textContent.trim();
                }
                options.push({
                    value: radio.value,
                    label: label,
                    element: radio
                });
            });
            console.log(`Extracted radio options for question: "${question}"`, options.map(o => o.label));
            questions.push({
                question: question,
                type: 'radio',
                options: options
            });
            return;
        }

        // Get the input element
        const inputElement = item.querySelector('input, textarea, select');
        if (!inputElement) return;
        
        questions.push({
            question: question,
            type: inputElement.type || inputElement.tagName,
            element: inputElement
        });
    });
    
    console.log('All extracted questions:', questions);
    return questions;
}

// Function to normalize question text
function normalizeQuestion(question) {
    // Convert to lowercase and remove special characters
    let normalized = question.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim();

    // Map common variations to standard terms
    const variations = {
        'contact number': ['phone', 'mobile', 'cell', 'telephone', 'contact'],
        'name': ['full name', 'your name', 'first name', 'last name'],
        'email': ['email address', 'email id', 'mail'],
        'location': ['city', 'current location', 'where are you', 'where do you live'],
        'hometown': ['native place', 'home town', 'where are you from'],
        'role': ['position', 'job title', 'designation', 'what role', 'what position'],
        'prn': ['permanent registration number', 'registration number', 'roll number'],
        'cpi': ['cgpa', 'grade', 'score', 'percentage'],
        'branch': ['stream', 'course', 'specialization', 'major'],
        'joining': ['join date', 'when can you join', 'how soon can you join', 'availability', 'notice period', 'joining time', 'joining period', 'joining duration']
    };

    // Check for variations
    for (const [standard, vars] of Object.entries(variations)) {
        if (vars.some(v => normalized.includes(v))) {
            normalized = standard;
            break;
        }
    }

    return normalized;
}

// Function to fill form fields
async function fillFormFields(answers) {
    const questions = extractQuestions();
    let filledCount = 0;
    let errorCount = 0;
    
    console.log('Questions to fill:', questions);
    console.log('Answers received:', answers);
    
    for (const answer of answers) {
        console.log(`Processing answer for question: "${answer.question}"`);
        console.log(`Matched with knowledge base question: "${answer.matched_question}"`);
        
        const matchingQuestion = questions.find(q => q.question === answer.question);
        
        if (matchingQuestion) {
            try {
                if (matchingQuestion.type === 'radio' && matchingQuestion.options) {
                    // Match answer to label (case-insensitive, trimmed)
                    const match = matchingQuestion.options.find(opt =>
                        opt.label && opt.label.toLowerCase().trim() === answer.answer.toLowerCase().trim()
                    );
                    if (match) {
                        match.element.checked = true;
                        match.element.dispatchEvent(new Event('change', { bubbles: true }));
                        filledCount++;
                        console.log(`Selected radio option: ${match.label}`);
                        continue;
                    } else {
                        // Try partial match if exact match fails
                        const partial = matchingQuestion.options.find(opt =>
                            opt.label && opt.label.toLowerCase().includes(answer.answer.toLowerCase())
                        );
                        if (partial) {
                            partial.element.checked = true;
                            partial.element.dispatchEvent(new Event('change', { bubbles: true }));
                            filledCount++;
                            console.log(`Selected radio option (partial match): ${partial.label}`);
                            continue;
                        }
                    }
                    errorCount++;
                    console.warn(`No matching radio option found for answer: ${answer.answer}`);
                }
                else if (matchingQuestion.type === 'checkbox') {
                    const element = matchingQuestion.element;
                    const shouldCheck = ['yes', 'true', '1'].includes(answer.answer.toLowerCase());
                    element.checked = shouldCheck;
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    filledCount++;
                }
                else if (matchingQuestion.type === 'select-one' || matchingQuestion.type === 'SELECT') {
                    const element = matchingQuestion.element;
        const options = Array.from(element.options);
                    const matchingOption = options.find(opt => 
                        opt.text.toLowerCase() === answer.answer.toLowerCase() ||
                        opt.value.toLowerCase() === answer.answer.toLowerCase()
        );
        if (matchingOption) {
            element.value = matchingOption.value;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        filledCount++;
                    } else {
                        errorCount++;
                        console.warn(`No matching select option found for answer: ${answer.answer}`);
                    }
                }
                else {
                    // For text inputs, textareas, and other input types
                    const element = matchingQuestion.element;
                    element.value = answer.answer;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    filledCount++;
                }
                
                console.log(`Successfully filled field: "${matchingQuestion.question}"`);
                
            } catch (error) {
                console.error('Error filling field:', error);
                errorCount++;
            }
        } else {
            console.log(`No matching field found for question: "${answer.question}"`);
        }
    }
    
    console.log(`Form fill complete. Filled ${filledCount} fields, ${errorCount} errors.`);
    return {
        total: questions.length,
        filled: filledCount,
        errors: errorCount
    };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkForm') {
        const questions = extractQuestions();
        sendResponse({
            ready: questions.length > 0,
            fieldCount: questions.length
        });
    }
    
    else if (request.action === 'fillForm') {
        // Get auth token from background script
        chrome.runtime.sendMessage({ action: 'getAuthToken' }, async (response) => {
            if (!response || !response.token) {
                console.error('No auth token found');
                sendResponse({
                    success: false,
                    error: 'Not authenticated. Please log in.'
                });
                return;
            }
            
            try {
                const questions = extractQuestions();
                console.log('Extracted questions:', questions);
                
                // Send questions to backend
                const backendResponse = await fetch('http://localhost:5000/api/process-form', {
            method: 'POST',
            headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${response.token}`
            },
            body: JSON.stringify({
                        questions: questions.map(q => ({ question: q.question }))
            })
        });
                
                if (!backendResponse.ok) {
                    const errorData = await backendResponse.json();
                    throw new Error(errorData.error || 'Failed to get answers from backend');
                }
                
                const answers = await backendResponse.json();
                console.log('Received answers:', answers);
                
                // Fill the form with answers
                const result = await fillFormFields(answers);
                console.log('Form fill result:', result);
                
                sendResponse({
                    success: true,
                    result: result
                });
                
    } catch (error) {
                console.error('Error filling form:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            }
        });
        
        return true; // Required for async sendResponse
    }
}); 