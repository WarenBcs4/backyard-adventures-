// Enhanced Authentication with modern features
class AuthService {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
        this.initializePasswordStrength();
    }

    // Password strength checker
    initializePasswordStrength() {
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', this.checkPasswordStrength);
        }
    }

    checkPasswordStrength(e) {
        const password = e.target.value;
        const strengthBar = document.getElementById('strength-bar');
        
        if (!strengthBar) return;

        let strength = 0;
        const checks = [
            password.length >= 8,
            /[a-z]/.test(password),
            /[A-Z]/.test(password),
            /[0-9]/.test(password),
            /[^A-Za-z0-9]/.test(password)
        ];

        strength = checks.filter(Boolean).length;

        strengthBar.className = 'strength-bar';
        
        if (strength === 0) {
            strengthBar.className += '';
        } else if (strength <= 2) {
            strengthBar.className += ' strength-weak';
        } else if (strength === 3) {
            strengthBar.className += ' strength-fair';
        } else if (strength === 4) {
            strengthBar.className += ' strength-good';
        } else {
            strengthBar.className += ' strength-strong';
        }
    }

    // Login functionality
    async login(email, password, remember = false) {
        try {
            // Call backend API
            const response = await api.login({ email, password });

            // Store user with token
            const userWithToken = {
                ...response.user,
                token: response.token
            };
            
            this.setCurrentUser(userWithToken, remember);
            
            return { success: true, user: response.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Registration functionality
    async register(userData) {
        try {
            // Validate password match
            if (userData.password !== userData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Call backend API
            const response = await api.register({
                fullName: userData.fullName,
                email: userData.email,
                phone: userData.phone,
                password: userData.password
            });

            // Store user with token
            const userWithToken = {
                ...response.user,
                token: response.token
            };
            
            this.setCurrentUser(userWithToken);

            return { success: true, user: response.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Simulate API call with loading
    simulateApiCall() {
        return new Promise((resolve) => {
            setTimeout(resolve, 1500);
        });
    }

    // Set current user and store in localStorage
    setCurrentUser(user, remember = false) {
        this.currentUser = user;
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('currentUser', JSON.stringify(user));
    }

    // Load current user from storage
    loadCurrentUser() {
        const stored = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Check if user is authenticated (alias for isLoggedIn)
    isAuthenticated() {
        return this.isLoggedIn();
    }

    // Check if user is admin
    isAdmin() {
        return this.currentUser && (this.currentUser.role === 'Admin' || this.currentUser.role === 'Staff');
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    // Show message
    showMessage(elementId, message, type = 'error') {
        const messageEl = document.getElementById(elementId);
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `message ${type} show`;
            
            setTimeout(() => {
                messageEl.classList.remove('show');
            }, 5000);
        }
    }

    // Set loading state
    setLoadingState(button, loading) {
        const spinner = button.querySelector('.loading-spinner');
        const text = button.querySelector('.button-text');
        
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';
            if (text) text.textContent = 'Processing...';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            if (spinner) spinner.style.display = 'none';
            if (text) text.textContent = button.dataset.originalText || 'Submit';
        }
    }
}

// Global auth instance
const auth = new AuthService();

// Password toggle functionality
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = 'Hide';
    } else {
        input.type = 'password';
        toggle.textContent = 'Show';
    }
}

// Social login functions
function loginWithGoogle() {
    alert('Google login integration would be implemented here.\n\nThis would typically use Google OAuth 2.0');
}

function loginWithFacebook() {
    alert('Facebook login integration would be implemented here.\n\nThis would typically use Facebook SDK');
}

function registerWithGoogle() {
    alert('Google registration integration would be implemented here.');
}

function registerWithFacebook() {
    alert('Facebook registration integration would be implemented here.');
}

// Forgot password functionality
function showForgotPassword() {
    const email = prompt('Enter your email address:');
    if (email) {
        alert(`Password reset link sent to ${email}\n\nThis would typically send an actual email.`);
    }
}

// DOM Content Loaded Event Handlers
document.addEventListener('DOMContentLoaded', function() {
    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember')?.checked || false;
            
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.dataset.originalText = submitBtn.querySelector('.button-text').textContent;
            
            auth.setLoadingState(submitBtn, true);
            
            try {
                const result = await auth.login(email, password, remember);
                
                if (result.success) {
                    auth.showMessage('login-message', 'Login successful! Redirecting...', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    auth.showMessage('login-message', result.error, 'error');
                }
            } catch (error) {
                auth.showMessage('login-message', 'An error occurred. Please try again.', 'error');
            } finally {
                auth.setLoadingState(submitBtn, false);
            }
        });
    }

    // Register form handler
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: document.getElementById('password').value,
                confirmPassword: document.getElementById('confirmPassword').value
            };
            
            const termsChecked = document.getElementById('terms')?.checked;
            if (!termsChecked) {
                auth.showMessage('register-message', 'Please agree to the terms and conditions.', 'error');
                return;
            }
            
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.dataset.originalText = submitBtn.querySelector('.button-text').textContent;
            
            auth.setLoadingState(submitBtn, true);
            
            try {
                const result = await auth.register(formData);
                
                if (result.success) {
                    auth.showMessage('register-message', 'Account created successfully! Redirecting...', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    auth.showMessage('register-message', result.error, 'error');
                }
            } catch (error) {
                auth.showMessage('register-message', 'An error occurred. Please try again.', 'error');
            } finally {
                auth.setLoadingState(submitBtn, false);
            }
        });
    }

    // Check if user is already logged in and redirect
    if (auth.isLoggedIn()) {
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'login.html' || currentPage === 'register.html') {
            window.location.href = 'dashboard.html';
        }
    }

    // Add input focus animations
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
});

// Global logout function
function logout() {
    auth.logout();
}