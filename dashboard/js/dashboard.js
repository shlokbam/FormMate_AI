// Import Firebase initialization promise
import { firebaseInitPromise } from './config.js';

// Initialize dashboard
async function initializeDashboard() {
    try {
        console.log('Initializing dashboard...');
        // Wait for Firebase to be initialized
        await firebaseInitPromise;
        console.log('Firebase initialized for dashboard');

        // Check authentication state
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('User is authenticated:', user.email);
                // Update UI with user info
                const userEmail = document.getElementById('userEmail');
                if (userEmail) {
                    userEmail.textContent = user.email;
                }
                // Load user data and activity
                loadUserData(user.uid);
            } else {
                console.log('User is not authenticated, redirecting to login');
                // Redirect to login page if not authenticated
                window.location.href = 'login.html';
            }
        });

        // Set up logout handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await firebase.auth().signOut();
                    console.log('User signed out');
                    // Clear stored user data
                    localStorage.removeItem('user');
                    // Redirect to login page
                    window.location.href = 'login.html';
                } catch (error) {
                    console.error('Error signing out:', error);
                }
            });
        }

        console.log('Dashboard initialization complete');
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        // Show error to user
        const errorElement = document.createElement('div');
        errorElement.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ef4444; color: white; padding: 1rem; text-align: center; z-index: 9999;';
        errorElement.textContent = 'Error initializing dashboard. Please refresh the page.';
        document.body.appendChild(errorElement);
    }
}

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing dashboard...');
    initializeDashboard();
});

// Load user data from Firestore
async function loadUserData(userId) {
    try {
        const db = firebase.firestore();
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Update stats
            const qaCount = document.getElementById('qaCount');
            const formsCount = document.getElementById('formsCount');
            if (qaCount) {
                qaCount.textContent = userData.qaPairs || 0;
            }
            if (formsCount) {
                formsCount.textContent = userData.formsProcessed || 0;
            }
            
            // Calculate success rate
            const successRate = document.getElementById('successRate');
            if (successRate) {
                const successRateValue = userData.formsProcessed > 0 
                    ? Math.round((userData.successfulSubmissions / userData.formsProcessed) * 100) 
                    : 0;
                successRate.textContent = `${successRateValue}%`;
            }
            
            // Load recent activity
            loadRecentActivity(userId);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load recent activity
async function loadRecentActivity(userId) {
    try {
        const db = firebase.firestore();
        const activitySnapshot = await db
            .collection('users')
            .doc(userId)
            .collection('activity')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();
        
        const activityList = document.getElementById('activityList');
        if (activityList) {
            activityList.innerHTML = '';
            
            if (activitySnapshot.empty) {
                activityList.innerHTML = '<p class="no-activity">No recent activity</p>';
                return;
            }
            
            activitySnapshot.forEach(doc => {
                const activity = doc.data();
                const activityItem = createActivityItem(activity);
                activityList.appendChild(activityItem);
            });
        }
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// Create activity item element
function createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    
    const icon = document.createElement('i');
    icon.className = `fas ${getActivityIcon(activity.type)}`;
    
    const content = document.createElement('div');
    content.className = 'activity-content';
    
    const title = document.createElement('h4');
    title.textContent = activity.title;
    
    const time = document.createElement('span');
    time.textContent = formatTimestamp(activity.timestamp);
    
    content.appendChild(title);
    content.appendChild(time);
    
    item.appendChild(icon);
    item.appendChild(content);
    
    return item;
}

// Get icon for activity type
function getActivityIcon(type) {
    switch (type) {
        case 'qa_add':
            return 'fa-plus-circle';
        case 'form_process':
            return 'fa-tasks';
        case 'form_success':
            return 'fa-check-circle';
        case 'form_error':
            return 'fa-exclamation-circle';
        default:
            return 'fa-info-circle';
    }
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
} 