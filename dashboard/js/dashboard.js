document.addEventListener('DOMContentLoaded', () => {
  // Use global firebase object
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Example: Listen for auth state changes
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Save UID to Chrome storage for extension
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ formmate_uid: user.uid }, function() {
          console.log('UID saved to Chrome storage:', user.uid);
        });
      }
      // Display UID in the dashboard
      const uidDisplay = document.getElementById('uid-display');
      if (uidDisplay) {
        uidDisplay.textContent = user.uid;
      }
    }
  });

  // ...rest of your dashboard logic...

  // Placeholder for dashboard logic
  document.getElementById('logout').onclick = function(e) {
    e.preventDefault();
    auth.signOut().then(() => {
      window.location.href = 'index.html';
    });
  };
}); 