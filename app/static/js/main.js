// Form Processing
async function processForm(formUrl) {
    try {
        const response = await fetch('/process-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ form_url: formUrl }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            showFormPreview(data.form_data, data.answers);
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error processing form', 'error');
    }
}

// Q&A Management
async function saveQA(question, answer) {
    try {
        const response = await fetch('/save-qa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question, answer }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.reload();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error saving Q&A pair', 'error');
    }
}

async function deleteQA(id) {
    if (!confirm('Are you sure you want to delete this Q&A pair?')) {
        return;
    }
    
    try {
        const response = await fetch(`/delete-qa/${id}`, {
            method: 'DELETE',
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.reload();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error deleting Q&A pair', 'error');
    }
}

// UI Helpers
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} animate-fade-in`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showFormPreview(formData, answers) {
    const modal = document.createElement('div');
    modal.className = 'modal-container';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <h3 class="text-lg font-medium text-gray-900 mb-4">${formData.title}</h3>
            <div class="space-y-4">
                ${formData.questions.map(q => `
                    <div class="space-y-2">
                        <label class="form-label">${q.text}</label>
                        <textarea class="form-input" rows="3">${answers[q.id] || ''}</textarea>
                    </div>
                `).join('')}
            </div>
            <div class="mt-6 flex justify-end space-x-3">
                <button onclick="this.closest('.modal-container').remove()" class="btn-secondary">
                    Cancel
                </button>
                <button onclick="submitForm('${formData.url}', ${JSON.stringify(answers)})" class="btn-primary">
                    Submit
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function submitForm(formUrl, answers) {
    try {
        const response = await fetch('/save-submission', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                form_url: formUrl,
                answers: answers,
            }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Form submitted successfully');
            window.location.href = '/submissions';
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error submitting form', 'error');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Form processing
    const processFormElement = document.getElementById('processForm');
    if (processFormElement) {
        processFormElement.addEventListener('submit', (e) => {
            e.preventDefault();
            const formUrl = document.getElementById('formUrl').value;
            processForm(formUrl);
        });
    }
    
    // Q&A management
    const addQAForm = document.getElementById('addQAForm');
    if (addQAForm) {
        addQAForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const question = document.getElementById('question').value;
            const answer = document.getElementById('answer').value;
            saveQA(question, answer);
        });
    }
}); 