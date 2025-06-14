// DOM Elements
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const userEmail = document.getElementById('user-email');
const status = document.getElementById('status');
const fillFormBtn = document.getElementById('fillForm');
const loading = document.getElementById('loading');

// Auth Elements
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const registerConfirmPassword = document.getElementById('register-confirm-password');
const termsCheckbox = document.getElementById('terms-checkbox');
const rememberMe = document.getElementById('remember-me');

// Q&A Manager Elements
const qaSearch = document.getElementById('qa-search');
const addQaBtn = document.getElementById('add-qa-btn');
const qaList = document.getElementById('qa-list');

// Profile Elements
const newPassword = document.getElementById('new-password');
const confirmPassword = document.getElementById('confirm-password');
const updatePasswordBtn = document.getElementById('update-password-btn');
const logoutBtn = document.getElementById('logout-btn');

// Tab Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// State
let currentUser = null;
let qaItems = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication status
        const token = await getStoredToken();
        if (token) {
            try {
                const user = await validateToken(token);
                showMainSection(user);
            } catch (error) {
                console.error('Token validation failed:', error);
                showAuthSection();
            }
        } else {
            showAuthSection();
        }

        // Check for Google Form
        checkForm();
    } catch (error) {
        console.error('Initialization error:', error);
        showAuthSection();
    }
});

// Tab Navigation
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show active tab content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
            }
        });
    });
});

// Auth Section Toggle
document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
});

// Helper Functions
function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Login Handler
document.getElementById('login-btn').addEventListener('click', async () => {
    try {
        showLoading();
        const email = loginEmail.value;
        const password = loginPassword.value;
        
        if (!email || !password) {
            showToast('Please fill in all fields');
            return;
        }

        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            showToast(data.error || 'Invalid credentials');
            return;
        }

        await storeToken(data.token);
        showMainSection(data.user);
        showToast('Login successful!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showToast('Failed to connect to server. Please try again.');
    } finally {
        hideLoading();
    }
});

// Register Handler
document.getElementById('register-btn').addEventListener('click', async () => {
    try {
        showLoading();
        const email = registerEmail.value;
        const password = registerPassword.value;
        const confirmPassword = registerConfirmPassword.value;
        
        if (!email || !password || !confirmPassword) {
            showToast('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match');
            return;
        }

        if (!termsCheckbox.checked) {
            showToast('Please accept the terms and conditions');
            return;
        }

        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.error === 'Email already exists') {
                showToast('This email is already registered. Please try logging in instead.');
            } else {
                showToast(data.error || 'Registration failed. Please try again.');
            }
            return;
        }

        await storeToken(data.token);
        showMainSection(data.user);
        showToast('Registration successful!', 'success');
        
        // Clear form fields
        registerEmail.value = '';
        registerPassword.value = '';
        registerConfirmPassword.value = '';
        termsCheckbox.checked = false;
        
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Failed to connect to server. Please try again.');
    } finally {
        hideLoading();
    }
});

// Logout Handler
logoutBtn.addEventListener('click', async () => {
    try {
        await removeStoredToken();
        showAuthSection();
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Form Fill Handler
fillFormBtn.addEventListener('click', async () => {
    try {
        showLoading();
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'fillForm' });
        
        if (!response.success) {
            throw new Error(response.error || 'Failed to fill form');
        }
        
        status.textContent = 'Form filled successfully!';
        status.className = 'status ready';
    } catch (error) {
        status.textContent = error.message;
        status.className = 'status error';
    } finally {
        hideLoading();
    }
});

// Q&A Management
async function loadQAs() {
    try {
        showLoading();
        const token = await getStoredToken();
        console.log('Retrieved token:', token ? 'Token exists' : 'No token found');
        
        if (!token) {
            throw new Error('Not authenticated');
        }

        console.log('Loading Q&A items...');
        const response = await fetch('http://localhost:5000/api/qa', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Failed to load Q&A items');
        }

        qaItems = data;
        console.log('Loaded Q&A items:', qaItems);
        renderQAs();
    } catch (error) {
        console.error('Load Q&A error:', error);
        qaList.innerHTML = `<div class="error">Error loading Q&A items: ${error.message}</div>`;
    } finally {
        hideLoading();
    }
}

function renderQAs() {
    qaList.innerHTML = '';
    if (qaItems.length === 0) {
        qaList.innerHTML = '<div class="empty-state">No Q&A items found. Add some using the form below.</div>';
        return;
    }

    qaItems.forEach(item => {
        const qaElement = createQAElement(item);
        qaList.appendChild(qaElement);
    });
}

function renderFilteredQAs(filteredItems) {
    qaList.innerHTML = '';
    if (filteredItems.length === 0) {
        qaList.innerHTML = '<div class="empty-state">No matching Q&A items found.</div>';
        return;
    }

    filteredItems.forEach(item => {
        const qaElement = createQAElement(item);
        qaList.appendChild(qaElement);
    });
}

function createQAElement(item) {
    const div = document.createElement('div');
    div.className = 'qa-item';
    div.innerHTML = `
        <div class="qa-item-header">
            <strong>${item.question}</strong>
            <div class="qa-item-actions">
                <button class="edit-btn" data-id="${item.id}">Edit</button>
                <button class="delete-btn" data-id="${item.id}">Delete</button>
            </div>
        </div>
        <div class="qa-item-answer">${item.answer}</div>
    `;

    // Add event listeners for edit and delete buttons
    const editBtn = div.querySelector('.edit-btn');
    const deleteBtn = div.querySelector('.delete-btn');

    editBtn.addEventListener('click', () => {
        // Show edit form with current values
        const questionInput = document.getElementById('qa-question');
        const answerInput = document.getElementById('qa-answer');
        const qaIdInput = document.getElementById('qa-id');
        
        questionInput.value = item.question;
        answerInput.value = item.answer;
        qaIdInput.value = item.id;
        
        // Change add button to update button
        addQaBtn.textContent = 'Update Q&A';
        addQaBtn.dataset.mode = 'edit';
    });

    deleteBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this Q&A item?')) {
            try {
                showLoading();
                const token = await getStoredToken();
                const response = await fetch(`http://localhost:5000/api/qa/${item.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to delete Q&A item');
                }

                // Remove from local array and re-render
                qaItems = qaItems.filter(qa => qa.id !== item.id);
                renderQAs();
            } catch (error) {
                console.error('Delete Q&A error:', error);
                alert(error.message);
            } finally {
                hideLoading();
            }
        }
    });

    return div;
}

// Add Q&A Handler
addQaBtn.addEventListener('click', async () => {
    try {
        showLoading();
        const questionInput = document.getElementById('qa-question');
        const answerInput = document.getElementById('qa-answer');
        const qaIdInput = document.getElementById('qa-id');
        
        const question = questionInput.value.trim();
        const answer = answerInput.value.trim();
        const qaId = qaIdInput.value;
        
        if (!question || !answer) {
            throw new Error('Please fill in both question and answer');
        }

        const token = await getStoredToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        let response;
        if (addQaBtn.dataset.mode === 'edit') {
            // Update existing Q&A
            response = await fetch(`http://localhost:5000/api/qa/${qaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ question, answer })
            });
        } else {
            // Add new Q&A
            response = await fetch('http://localhost:5000/api/qa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ question, answer })
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save Q&A item');
        }

        // Clear form
        questionInput.value = '';
        answerInput.value = '';
        qaIdInput.value = '';
        addQaBtn.textContent = 'Add Q&A';
        addQaBtn.dataset.mode = 'add';

        // Reload Q&A items
        await loadQAs();
    } catch (error) {
        console.error('Save Q&A error:', error);
        alert(error.message);
    } finally {
        hideLoading();
    }
});

// Search Q&A Handler
qaSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = qaItems.filter(item => 
        item.question.toLowerCase().includes(searchTerm) ||
        item.answer.toLowerCase().includes(searchTerm)
    );
    renderFilteredQAs(filtered);
});

// Profile Management
updatePasswordBtn.addEventListener('click', async () => {
    try {
        showLoading();
        const password = newPassword.value;
        const confirm = confirmPassword.value;
        
        if (!password || !confirm) {
            showToast('Please fill in all fields');
            return;
        }

        if (password !== confirm) {
            showToast('Passwords do not match');
            return;
        }

        const response = await fetch('http://localhost:5000/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getStoredToken()}`
            },
            body: JSON.stringify({ password })
        });

        if (!response.ok) {
            const data = await response.json();
            showToast(data.error || 'Failed to update password');
            return;
        }

        showToast('Password updated successfully!', 'success');
        newPassword.value = '';
        confirmPassword.value = '';
    } catch (error) {
        console.error('Password update error:', error);
        showToast('Failed to connect to server. Please try again.');
    } finally {
        hideLoading();
    }
});

// Helper Functions
async function checkForm() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkForm' });
        
        if (response.ready) {
            status.textContent = `Form ready (${response.fieldCount} fields)`;
            status.className = 'status ready';
            fillFormBtn.disabled = false;
        } else {
            status.textContent = response.error || 'No form found';
            status.className = 'status error';
            fillFormBtn.disabled = true;
        }
    } catch (error) {
        status.textContent = 'Error checking form';
        status.className = 'status error';
        fillFormBtn.disabled = true;
    }
}

function showLoading() {
    loading.classList.add('active');
}

function hideLoading() {
    loading.classList.remove('active');
}

function showAuthSection() {
    authSection.style.display = 'block';
    mainSection.style.display = 'none';
}

function showMainSection(user) {
    currentUser = user;
    userEmail.textContent = user.email;
    authSection.style.display = 'none';
    mainSection.style.display = 'block';
    loadQAs(); // Load Q&A items when showing main section
}

// Storage Functions
async function storeToken(token) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ token }, () => {
            // Also store the token in local storage for immediate access
            chrome.storage.local.set({ token }, resolve);
        });
    });
}

async function getStoredToken() {
    return new Promise((resolve) => {
        // First try to get from local storage for faster access
        chrome.storage.local.get(['token'], (result) => {
            console.log('Local storage token check:', result.token ? 'Token exists' : 'No token');
            if (result.token) {
                resolve(result.token);
            } else {
                // If not in local storage, try sync storage
                chrome.storage.sync.get(['token'], (syncResult) => {
                    console.log('Sync storage token check:', syncResult.token ? 'Token exists' : 'No token');
                    if (syncResult.token) {
                        // Store in local storage for future use
                        chrome.storage.local.set({ token: syncResult.token });
                    }
                    resolve(syncResult.token);
                });
            }
        });
    });
}

async function removeStoredToken() {
    return new Promise((resolve) => {
        // Remove from both storages
        chrome.storage.local.remove(['token'], () => {
            chrome.storage.sync.remove(['token'], resolve);
        });
    });
}

async function validateToken(token) {
    try {
        const response = await fetch('http://localhost:5000/api/validate-token', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Invalid token');
        }

        const data = await response.json();
        return data.user;
    } catch (error) {
        // If token is invalid, remove it
        await removeStoredToken();
        throw error;
    }
} 