// Wait for Firebase initialization
let firebaseInitialized = false;

// Initialize Firebase
async function initializeApp() {
    if (!firebaseInitialized) {
        await initializeFirebase();
        firebaseInitialized = true;
    }

    // Check authentication state
    firebase.auth().onAuthStateChanged((user) => {
        const authBtn = document.getElementById('authBtn');
        const getStartedBtn = document.getElementById('getStartedBtn');

        if (user) {
            // User is signed in
            authBtn.textContent = 'Dashboard';
            authBtn.href = 'dashboard.html';
            getStartedBtn.textContent = 'Go to Dashboard';
            getStartedBtn.href = 'dashboard.html';
        } else {
            // User is not signed in
            authBtn.textContent = 'Login / Register';
            authBtn.href = 'login.html';
            getStartedBtn.textContent = 'Get Started';
            getStartedBtn.href = 'login.html';
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Animate feature cards on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.feature-card').forEach(card => {
        observer.observe(card);
    });
}

// Initialize when the script loads
initializeApp(); 