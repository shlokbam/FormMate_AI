// Firebase configuration
let firebaseConfig = null;
let firebaseInitialized = false;

// Create and export the initialization promise
export const firebaseInitPromise = (async () => {
    if (firebaseInitialized) {
        return firebaseConfig;
    }

    try {
        console.log('Fetching Firebase configuration...');
        const response = await fetch('/api/config');
        
        if (!response.ok) {
            throw new Error(`Failed to fetch Firebase configuration: ${response.status} ${response.statusText}`);
        }
        
        firebaseConfig = await response.json();
        console.log('Firebase configuration received:', firebaseConfig);
        
        if (!firebaseConfig.FIREBASE_API_KEY) {
            throw new Error('Firebase API key is missing');
        }
        
        // Initialize Firebase only if not already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp({
                apiKey: firebaseConfig.FIREBASE_API_KEY,
                authDomain: firebaseConfig.FIREBASE_AUTH_DOMAIN,
                projectId: firebaseConfig.FIREBASE_PROJECT_ID,
                storageBucket: firebaseConfig.FIREBASE_STORAGE_BUCKET,
                messagingSenderId: firebaseConfig.FIREBASE_MESSAGING_SENDER_ID,
                appId: firebaseConfig.FIREBASE_APP_ID
            });
            console.log('Firebase initialized successfully');
        } else {
            console.log('Firebase already initialized');
        }
        
        firebaseInitialized = true;
        return firebaseConfig;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        throw error;
    }
})();

// Initialize Firebase when the script loads
document.addEventListener('DOMContentLoaded', () => {
    firebaseInitPromise.catch(error => {
        console.error('Failed to initialize Firebase:', error);
        // Show error to user
        const errorElement = document.createElement('div');
        errorElement.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ef4444; color: white; padding: 1rem; text-align: center; z-index: 9999;';
        errorElement.textContent = 'Error connecting to the server. Please try again later.';
        document.body.appendChild(errorElement);
    });
}); 