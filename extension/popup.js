document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup script loaded');
    
    const status = document.getElementById('status');
    const fillFormBtn = document.getElementById('fillForm');
    const saveFormBtn = document.getElementById('saveForm');
    const loading = document.getElementById('loading');
    const uidInput = document.getElementById('uid-input');
    const saveBtn = document.getElementById('save-uid-btn');

    // Check if we're on a Google Form
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Current tab:', tab);

    if (!tab.url.includes('google.com/forms')) {
        status.textContent = 'Please open a Google Form to use FormMate AI';
        status.classList.add('error');
        return;
    }

    // Check form status
    try {
        console.log('Sending checkForm message to content script');
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkForm' });
        console.log('Received response from content script:', response);

        if (response.ready) {
            status.textContent = `Form ready (${response.fieldCount} fields found)`;
            status.classList.add('ready');
            fillFormBtn.disabled = false;
            saveFormBtn.disabled = false;
        } else {
            status.textContent = response.error || 'No form fields found';
            status.classList.add('error');
        }
    } catch (error) {
        console.error('Error checking form:', error);
        status.textContent = 'Error checking form. Please refresh the page and try again.';
        status.classList.add('error');
    }

    // Fill Form Button
    if (fillFormBtn) {
        fillFormBtn.onclick = async () => {
            try {
                loading.classList.add('active');
                fillFormBtn.disabled = true;
                saveFormBtn.disabled = true;
                status.textContent = 'Filling form...';
                status.classList.remove('error', 'ready');

                console.log('Sending fillForm message to content script');
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'fillForm' });
                console.log('Received response from content script:', response);
                
                if (response && response.success) {
                    status.textContent = 'Form filled successfully!';
                    status.classList.add('ready');
                } else {
                    status.textContent = response && response.error ? response.error : 'Error filling form';
                    status.classList.add('error');
                }
            } catch (error) {
                console.error('Error filling form:', error);
                status.textContent = 'Error filling form. Please try again.';
                status.classList.add('error');
            } finally {
                loading.classList.remove('active');
                fillFormBtn.disabled = false;
                saveFormBtn.disabled = false;
            }
        };
    }

    // Save Form Button
    saveFormBtn.addEventListener('click', async () => {
        try {
            loading.classList.add('active');
            fillFormBtn.disabled = true;
            saveFormBtn.disabled = true;
            status.textContent = 'Saving form...';
            status.classList.remove('error', 'ready');

            console.log('Sending saveForm message to content script');
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'saveForm' });
            console.log('Received response from content script:', response);
            
            if (response.success) {
                status.textContent = 'Form saved successfully!';
                status.classList.add('ready');
            } else {
                status.textContent = response.error || 'Error saving form';
                status.classList.add('error');
            }
        } catch (error) {
            console.error('Error saving form:', error);
            status.textContent = 'Error saving form. Please try again.';
            status.classList.add('error');
        } finally {
            loading.classList.remove('active');
            fillFormBtn.disabled = false;
            saveFormBtn.disabled = false;
        }
    });

    if (saveBtn && uidInput) {
        saveBtn.onclick = function() {
            const uid = uidInput.value.trim();
            if (uid) {
                chrome.storage.local.set({ formmate_uid: uid }, function() {
                    alert('UID saved!');
                });
            } else {
                alert('Please enter a UID.');
            }
        };
        chrome.storage.local.get(['formmate_uid'], function(result) {
            if (result.formmate_uid) {
                uidInput.value = result.formmate_uid;
            }
        });
    }
}); 