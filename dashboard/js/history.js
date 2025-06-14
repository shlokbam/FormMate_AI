// Wait for Firebase initialization
let firebaseInitialized = false;

// Initialize Firebase
async function initializeHistory() {
    if (!firebaseInitialized) {
        await initializeFirebase();
        firebaseInitialized = true;
    }
    
    // DOM Elements
    const historyList = document.getElementById('historyList');
    const searchHistory = document.getElementById('searchHistory');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const pagination = document.getElementById('pagination');
    const detailsModal = document.getElementById('detailsModal');
    const closeModal = document.getElementById('closeModal');
    const modalBody = document.getElementById('modalBody');
    const logoutBtn = document.getElementById('logoutBtn');

    // Constants
    const ITEMS_PER_PAGE = 10;

    // State
    let currentUserId = null;
    let currentPage = 1;
    let totalPages = 1;
    let currentFilters = {
        search: '',
        status: 'all',
        dateRange: 'all'
    };

    // Check authentication state
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            // User is not signed in, redirect to login
            window.location.href = 'login.html';
            return;
        }
        
        currentUserId = user.uid;
        loadHistory();
    });

    // Load submission history
    async function loadHistory() {
        try {
            const db = firebase.firestore();
            let query = db
                .collection('users')
                .doc(currentUserId)
                .collection('activity')
                .where('type', 'in', ['form_success', 'form_error'])
                .orderBy('timestamp', 'desc');
            
            // Apply filters
            if (currentFilters.status !== 'all') {
                query = query.where('type', '==', `form_${currentFilters.status}`);
            }
            
            if (currentFilters.dateRange !== 'all') {
                const date = getDateRange(currentFilters.dateRange);
                query = query.where('timestamp', '>=', date);
            }
            
            // Get total count for pagination
            const snapshot = await query.get();
            totalPages = Math.ceil(snapshot.size / ITEMS_PER_PAGE);
            
            // Apply pagination
            query = query.limit(ITEMS_PER_PAGE)
                        .offset((currentPage - 1) * ITEMS_PER_PAGE);
            
            const historySnapshot = await query.get();
            
            historyList.innerHTML = '';
            
            if (historySnapshot.empty) {
                historyList.innerHTML = '<p class="no-history">No submissions found</p>';
                return;
            }
            
            historySnapshot.forEach(doc => {
                const submission = doc.data();
                const historyItem = createHistoryItem(doc.id, submission);
                historyList.appendChild(historyItem);
            });
            
            updatePagination();
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    // Create history item element
    function createHistoryItem(id, submission) {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const header = document.createElement('div');
        header.className = 'history-header';
        
        const title = document.createElement('h4');
        title.textContent = submission.title;
        
        const status = document.createElement('span');
        status.className = `status ${submission.type === 'form_success' ? 'success' : 'error'}`;
        status.textContent = submission.type === 'form_success' ? 'Success' : 'Error';
        
        header.appendChild(title);
        header.appendChild(status);
        
        const content = document.createElement('div');
        content.className = 'history-content';
        
        const time = document.createElement('span');
        time.className = 'timestamp';
        time.textContent = formatTimestamp(submission.timestamp);
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-secondary';
        viewBtn.textContent = 'View Details';
        viewBtn.onclick = () => showDetails(id, submission);
        
        content.appendChild(time);
        content.appendChild(viewBtn);
        
        item.appendChild(header);
        item.appendChild(content);
        
        return item;
    }

    // Show submission details
    function showDetails(id, submission) {
        modalBody.innerHTML = `
            <div class="details-content">
                <div class="detail-group">
                    <label>URL:</label>
                    <p>${submission.details.url}</p>
                </div>
                <div class="detail-group">
                    <label>Status:</label>
                    <p class="${submission.type === 'form_success' ? 'success' : 'error'}">
                        ${submission.type === 'form_success' ? 'Success' : 'Error'}
                    </p>
                </div>
                <div class="detail-group">
                    <label>Fields Processed:</label>
                    <ul>
                        ${submission.details.fields.map(field => `
                            <li>
                                <strong>${field.label}:</strong>
                                <span>${field.value || 'Not found'}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ${submission.details.suggestions ? `
                    <div class="detail-group">
                        <label>Suggestions:</label>
                        <ul>
                            ${submission.details.suggestions.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div class="detail-group">
                    <label>Timestamp:</label>
                    <p>${formatTimestamp(submission.timestamp)}</p>
                </div>
            </div>
        `;
        
        detailsModal.style.display = 'block';
    }

    // Close modal
    closeModal.addEventListener('click', () => {
        detailsModal.style.display = 'none';
    });

    // Update pagination controls
    function updatePagination() {
        pagination.innerHTML = '';
        
        if (totalPages <= 1) {
            return;
        }
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-secondary';
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                loadHistory();
            }
        };
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-secondary';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadHistory();
            }
        };
        
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        
        pagination.appendChild(prevBtn);
        pagination.appendChild(pageInfo);
        pagination.appendChild(nextBtn);
    }

    // Get date range for filter
    function getDateRange(range) {
        const now = new Date();
        const start = new Date();
        
        switch (range) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            default:
                return null;
        }
        
        return firebase.firestore.Timestamp.fromDate(start);
    }

    // Format timestamp
    function formatTimestamp(timestamp) {
        const date = timestamp.toDate();
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // Filter handlers
    searchHistory.addEventListener('input', (e) => {
        currentFilters.search = e.target.value;
        currentPage = 1;
        loadHistory();
    });

    statusFilter.addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        currentPage = 1;
        loadHistory();
    });

    dateFilter.addEventListener('change', (e) => {
        currentFilters.dateRange = e.target.value;
        currentPage = 1;
        loadHistory();
    });

    // Logout handler
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
            await firebase.auth().signOut();
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });
}

// Initialize when the script loads
initializeHistory(); 