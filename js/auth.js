// User Authentication and Registration Handler
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.setupEventListeners();
        this.checkAuthState();
        this.protectRoutes();
    }

    // Load users from localStorage
    loadUsers() {
        const savedUsers = localStorage.getItem('erUsers');
        return savedUsers ? JSON.parse(savedUsers) : [];
    }

    // Save users to localStorage
    saveUsers() {
        localStorage.setItem('erUsers', JSON.stringify(this.users));
    }

    // Setup event listeners for forms
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const loginForm = document.getElementById('loginForm');
            const registrationForm = document.getElementById('accountRegistrationForm');
            
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }

            if (registrationForm) {
                registrationForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRegistration();
                });
            }
        });

        // Logout button click
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
    }

    // Handle login
    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        try {
            const user = this.users.find(u => u.email === email);
            if (!user) {
                throw new Error('User not found');
            }

            // In a real application, you would hash the password and compare hashes
            if (user.password !== password) {
                throw new Error('Invalid password');
            }

            this.currentUser = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            };

            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.updateUIForAuthState(true);
            this.updateAccessControl();
            
            // Hide login modal
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();

            // Show success message
            this.showToast('Login successful!', 'success');

        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
        }
    }

    // Handle registration
    async handleRegistration() {
        const firstName = document.getElementById('regFirstName').value;
        const lastName = document.getElementById('regLastName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const errorDiv = document.getElementById('registrationError');

        try {
            // Validate password
            if (password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }
            if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
                throw new Error('Password must include both numbers and letters');
            }
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Check if user already exists
            if (this.users.some(u => u.email === email)) {
                throw new Error('Email already registered');
            }

            // Create new user
            const newUser = {
                id: Date.now().toString(),
                firstName,
                lastName,
                email,
                password, // In a real application, this should be hashed
                createdAt: new Date().toISOString()
            };

            this.users.push(newUser);
            this.saveUsers();

            // Auto-login the new user
            this.currentUser = {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName
            };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            // Update UI
            this.updateUIForAuthState(true);

            // Hide registration modal
            const registrationModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            registrationModal.hide();

            // Show success message
            this.showToast('Registration successful!', 'success');

        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
        }
    }

    // Handle logout
    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUIForAuthState(false);
        this.updateAccessControl();
        this.showToast('Logged out successfully', 'info');
    }

    // Check authentication state on page load
    checkAuthState() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUIForAuthState(true);
            this.updateAccessControl();
        } else {
            this.updateAccessControl();
        }
    }

    // Update UI based on authentication state
    updateUIForAuthState(isAuthenticated) {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userNameDisplay = document.getElementById('userNameDisplay');

        if (isAuthenticated && this.currentUser) {
            loginBtn.classList.add('d-none');
            logoutBtn.classList.remove('d-none');
            userNameDisplay.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
            userNameDisplay.classList.remove('d-none');
        } else {
            loginBtn.classList.remove('d-none');
            logoutBtn.classList.add('d-none');
            userNameDisplay.classList.add('d-none');
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.innerHTML = `
            <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-${type} text-white">
                    <strong class="me-auto">ER Wait Time</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        document.body.appendChild(toastContainer);
        const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
        toast.show();

        // Remove the toast container after it's hidden
        toastContainer.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toastContainer);
        });
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    protectRoutes() {
        // Hide all tabs except login when not authenticated
        const protectedTabs = ['chat-tab', 'hospital-tab', 'registration-tab', 'records-tab', 'directions-tab'];
        const protectedContent = ['chat-tab', 'hospital-tab', 'registration-tab', 'records-tab', 'directions-tab'];
        
        // Check authentication on page load
        this.updateAccessControl();

        // Add authentication check when switching tabs
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('show.bs.tab', (event) => {
                if (!this.isAuthenticated()) {
                    event.preventDefault();
                    this.showLoginRequired();
                }
            });
        });
    }

    updateAccessControl() {
        const isAuth = this.isAuthenticated();
        const mainContent = document.querySelector('.container');
        const loginPrompt = document.getElementById('loginPrompt') || this.createLoginPrompt();

        if (!isAuth) {
            // Hide main content
            mainContent.style.display = 'none';
            loginPrompt.style.display = 'block';
            
            // Disable all tab buttons
            document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
                tab.classList.add('disabled');
                tab.setAttribute('disabled', 'disabled');
            });
        } else {
            // Show main content
            mainContent.style.display = 'block';
            loginPrompt.style.display = 'none';
            
            // Enable all tab buttons
            document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
                tab.classList.remove('disabled');
                tab.removeAttribute('disabled');
            });
        }
    }

    createLoginPrompt() {
        const loginPrompt = document.createElement('div');
        loginPrompt.id = 'loginPrompt';
        loginPrompt.className = 'text-center p-5';
        loginPrompt.innerHTML = `
            <div class="card mx-auto" style="max-width: 500px;">
                <div class="card-body">
                    <h2 class="card-title mb-4"><i class="fas fa-lock"></i> Access Restricted</h2>
                    <p class="card-text">Please log in or create an account to access the ER Wait Time system.</p>
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" onclick="showLoginModal()">
                            <i class="fas fa-sign-in-alt"></i> Login
                        </button>
                        <button class="btn btn-outline-primary" onclick="showRegistrationModal()">
                            <i class="fas fa-user-plus"></i> Create Account
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertBefore(loginPrompt, document.querySelector('.container'));
        return loginPrompt;
    }

    showLoginRequired() {
        this.showToast('Please log in to access this feature', 'warning');
        showLoginModal();
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Show login modal
function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

// Show registration modal
function showRegistrationModal() {
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (loginModal) {
        loginModal.hide();
    }
    const registrationModal = new bootstrap.Modal(document.getElementById('registrationModal'));
    registrationModal.show();
} 