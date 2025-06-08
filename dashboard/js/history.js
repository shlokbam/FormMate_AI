// Load submission history
async function loadHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '<p>Loading...</p>';

    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');

        const snapshot = await db.collection('submissions')
            .where('userId', '==', user.uid)
            .orderBy('timestamp', 'desc')
            .get();

        if (snapshot.empty) {
            historyList.innerHTML = '<p>No submissions yet.</p>';
            return;
        }

        historyList.innerHTML = '';
        snapshot.forEach(doc => {
            const submission = doc.data();
            const submissionDiv = document.createElement('div');
            submissionDiv.className = 'submission-item';
            submissionDiv.innerHTML = `
                <div class="submission-header">
                    <h3>${submission.formData.title || 'Untitled Form'}</h3>
                    <span class="timestamp">${new Date(submission.timestamp.toDate()).toLocaleString()}</span>
                </div>
                <div class="submission-content">
                    ${Object.entries(submission.answers || {}).map(([question, answer]) => `
                        <div class="qa-pair">
                            <strong>${question}</strong>
                            <p>${answer}</p>
                        </div>
                    `).join('')}
                </div>
            `;
            historyList.appendChild(submissionDiv);
        });
    } catch (error) {
        historyList.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

// Search functionality
document.getElementById('search-history').addEventListener('input', async (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const submissions = document.querySelectorAll('.submission-item');

    submissions.forEach(submission => {
        const text = submission.textContent.toLowerCase();
        submission.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
});

// Load history when page loads
document.addEventListener('DOMContentLoaded', loadHistory);

// Logout handler
document.getElementById('logout').onclick = function(e) {
    e.preventDefault();
    auth.signOut();
};
// TODO: Integrate with Firestore to fetch and search submission history 