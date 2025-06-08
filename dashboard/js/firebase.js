// Initialize Firebase using your config from config.js
if (!firebase.apps.length) {
  firebase.initializeApp(window.FIREBASE_CONFIG || window.firebaseConfig);
}
// No exports needed; use window.firebase everywhere. 