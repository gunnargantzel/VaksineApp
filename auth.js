// Configuration object
const CONFIG = {
    auth: {
        clientId: "dfbc8995-b6f7-4b28-b33b-662aba613448",
        authority: "https://login.microsoftonline.com/647bb407-d412-4d48-b7bf-367c871cfca6",
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        scopes: ["User.Read", "profile", "email", "openid"]
    },
    messages: {
        success: {
            loginSuccess: "Innlogging vellykket!",
            logoutSuccess: "Utlogging vellykket!"
        },
        errors: {
            authError: "Feil ved autentisering. Vennligst prøv igjen.",
            networkError: "Nettverksfeil. Sjekk internettforbindelsen."
        }
    }
};

// AuthManager class for handling authentication
class AuthManager {
    constructor() {
        this.msalInstance = null;
        this.currentUser = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('AuthManager: Starting initialization...');
            
            // Check if MSAL is available
            if (typeof msal === 'undefined') {
                console.error('MSAL library not loaded');
                throw new Error('MSAL library not loaded');
            }
            console.log('MSAL library is available');
            
            // Additional check for MSAL object
            if (!msal.PublicClientApplication) {
                console.error('MSAL PublicClientApplication not available');
                throw new Error('MSAL PublicClientApplication not available');
            }
            console.log('MSAL PublicClientApplication is available');
            
            // Initialize MSAL instance
            console.log('Creating MSAL instance...');
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
            console.log('iOS detected:', isIOS);
            
            this.msalInstance = new msal.PublicClientApplication({
                auth: {
                    ...CONFIG.auth,
                    navigateToLoginRequestUrl: false
                },
                cache: {
                    cacheLocation: isIOS ? 'sessionStorage' : 'localStorage',
                    storeAuthStateInCookie: isIOS ? true : false
                },
                system: {
                    loggerOptions: {
                        loggerCallback: (level, message, containsPii) => {
                            if (containsPii) return;
                            console.log(`[MSAL ${level}]: ${message}`);
                        },
                        piiLoggingEnabled: false,
                        logLevel: msal.LogLevel.Info
                    }
                }
            });
            console.log('MSAL instance created');
            
            // Add event callback for token/account events
            this.msalInstance.addEventCallback((event) => {
                if (event.eventType === msal.EventType.LOGIN_SUCCESS && event.payload?.account) {
                    this.msalInstance.setActiveAccount(event.payload.account);
                    this.currentUser = event.payload.account;
                }
                if (event.eventType === msal.EventType.ACQUIRE_TOKEN_SUCCESS && event.payload?.account) {
                    this.msalInstance.setActiveAccount(event.payload.account);
                }
            });

            // Handle redirect promise
            console.log('Handling redirect promise...');
            const response = await this.msalInstance.handleRedirectPromise();
            console.log('Redirect promise handled');
            
            if (response?.account) {
                console.log('Redirect response received:', response);
                console.log('Redirect response account:', response.account);
                this.msalInstance.setActiveAccount(response.account);
                this.currentUser = response.account;
                console.log('Login successful via redirect:', this.currentUser.username);
                this.showSuccess(CONFIG.messages.success.loginSuccess);
                
                // For redirect login, we need to trigger UI update after a short delay
                // to ensure the page is fully loaded
                setTimeout(() => {
                    console.log('Triggering UI update after redirect login');
                    console.log('Current user at UI update:', this.currentUser);
                    if (typeof showUserProfile === 'function') {
                        showUserProfile(this.currentUser);
                    } else {
                        console.error('showUserProfile function not available');
                    }
                }, 500);
            } else {
                // Check if user is already logged in
                console.log('Checking for existing accounts...');
                const accounts = this.msalInstance.getAllAccounts();
                console.log('Found accounts:', accounts.length);
                if (accounts.length > 0) {
                    this.msalInstance.setActiveAccount(accounts[0]);
                    this.currentUser = accounts[0];
                    console.log('User already logged in:', this.currentUser.username);
                }
            }
            
            // Ensure token is valid
            if (this.currentUser) {
                await this.ensureToken();
            }

            this.isInitialized = true;
            console.log('AuthManager initialization completed');
            console.log('Final state:', {
                isInitialized: this.isInitialized,
                currentUser: this.currentUser ? this.currentUser.username : null,
                isAuthenticated: this.isAuthenticated
            });
            return true;
        } catch (error) {
            console.error('Failed to initialize MSAL:', error);
            this.showError(CONFIG.messages.errors.authError);
            return false;
        }
    }

    async ensureToken() {
        const account = this.msalInstance.getActiveAccount();
        if (!account) return;

        try {
            await this.msalInstance.acquireTokenSilent({
                account,
                scopes: CONFIG.auth.scopes,
            });
            console.log('Token acquired silently');
        } catch (e) {
            if (e instanceof msal.InteractionRequiredAuthError) {
                console.log('Silent token acquisition failed, redirecting to login');
                await this.msalInstance.loginRedirect({ scopes: CONFIG.auth.scopes });
            } else {
                throw e;
            }
        }
    }

    async login() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const loginRequest = {
                scopes: CONFIG.auth.scopes,
                prompt: 'select_account'
            };

            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
            
            if (isIOS) {
                console.log('iOS device detected, using loginRedirect');
                return this.msalInstance.loginRedirect(loginRequest);
            }
            
            // Desktop/Android:
            try {
                const resp = await this.msalInstance.loginPopup(loginRequest);
                this.msalInstance.setActiveAccount(resp.account);
                this.currentUser = resp.account;
                this.showSuccess(CONFIG.messages.success.loginSuccess);
                return this.currentUser;
            } catch {
                console.log('Popup failed, trying redirect as fallback');
                return this.msalInstance.loginRedirect(loginRequest);
            }
        } catch (error) {
            console.error('Login failed:', error);
            
            if (error.errorCode === 'user_cancelled') {
                console.log('User cancelled login');
                return null;
            }
            
            // If popup fails, try redirect as fallback
            if (error.name === 'BrowserAuthError' && error.message.includes('popup')) {
                console.log('Popup failed, trying redirect as fallback');
                try {
                    await this.msalInstance.loginRedirect({
                        scopes: CONFIG.auth.scopes,
                        prompt: 'select_account'
                    });
                    return;
                } catch (redirectError) {
                    console.error('Redirect also failed:', redirectError);
                    this.showError(CONFIG.messages.errors.authError);
                    throw redirectError;
                }
            }
            
            this.showError(CONFIG.messages.errors.authError);
            throw error;
        }
    }

    async logout() {
        if (!this.isInitialized || !this.currentUser) {
            return;
        }

        try {
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
            const logoutRequest = {
                account: this.currentUser,
                postLogoutRedirectUri: CONFIG.auth.postLogoutRedirectUri
            };

            if (isIOS) {
                await this.msalInstance.logoutRedirect(logoutRequest);
            } else {
                await this.msalInstance.logoutPopup(logoutRequest);
            }
            this.currentUser = null;
            
            console.log('Logout successful');
            this.showSuccess(CONFIG.messages.success.logoutSuccess);
            
            return true;
        } catch (error) {
            console.error('Logout failed:', error);
            this.showError('Feil ved utlogging');
            throw error;
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Helper methods for notifications
    showSuccess(message) {
        const successElement = document.getElementById('successMessage');
        if (successElement) {
            successElement.textContent = message;
            successElement.classList.remove('hidden');
            setTimeout(() => {
                successElement.classList.add('hidden');
            }, 3000);
        }
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }
}

// Create global instance
const authManager = new AuthManager();
window.authManager = authManager;

// DOM Elements
const loginCard = document.getElementById('loginCard');
const profileCard = document.getElementById('profileCard');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const logoutBtnProfile = document.getElementById('logoutBtnProfile');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// User profile elements
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const displayName = document.getElementById('displayName');
const userEmail = document.getElementById('userEmail');
const userId = document.getElementById('userId');
const tenantId = document.getElementById('tenantId');

// Initialize application
async function initializeApp() {
    try {
        console.log('Initializing application...');
        console.log('AuthManager instance:', authManager);
        console.log('window.authManager:', window.authManager);
        
        const success = await authManager.initialize();
        
        if (success) {
            console.log('AuthManager initialized successfully');
            console.log('AuthManager state:', {
                isAuthenticated: authManager.isAuthenticated(),
                currentUser: authManager.getCurrentUser() ? authManager.getCurrentUser().username : null
            });
            
            if (authManager.isAuthenticated()) {
                console.log('User is authenticated, showing profile');
                showDebugInfo('User is authenticated, showing profile');
                
                // Check if this is a redirect login by looking for URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const isRedirectLogin = urlParams.has('code') || urlParams.has('state') || 
                                      window.location.hash.includes('access_token') ||
                                      window.location.hash.includes('id_token');
                
                const debugData = {
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
                    authManagerState: {
                        isInitialized: authManager.isInitialized,
                        isAuthenticated: authManager.isAuthenticated(),
                        currentUser: authManager.getCurrentUser()?.username || 'No user'
                    },
                    urlAnalysis: {
                        search: window.location.search,
                        hash: window.location.hash,
                        hasCode: urlParams.has('code'),
                        hasState: urlParams.has('state'),
                        hasAccessToken: window.location.hash.includes('access_token'),
                        hasIdToken: window.location.hash.includes('id_token'),
                        isRedirectLogin: isRedirectLogin
                    },
                    uiState: {
                        loginCardHidden: document.getElementById('loginCard')?.classList.contains('hidden'),
                        tenderContainerHidden: document.getElementById('tenderContainer')?.classList.contains('hidden')
                    }
                };
                
                console.log('URL analysis:', debugData.urlAnalysis);
                
                // Debug popup removed - no longer needed
                
                if (isRedirectLogin) {
                    console.log('Redirect login detected, showing tender table directly');
                    // For redirect login, show tender table immediately
                    showUserProfile(authManager.getCurrentUser());
                } else {
                    console.log('Existing session detected, showing tender table');
                    // For existing sessions, show tender table
                    showUserProfile(authManager.getCurrentUser());
                }
            } else {
                console.log('User not authenticated, showing login');
                showDebugInfo('User not authenticated, showing login');
                showLoginCard();
            }
        } else {
            console.error('Failed to initialize auth manager');
            showDebugInfo('Failed to initialize auth manager');
            showLoginCard();
        }
    } catch (error) {
        console.error('App initialization failed:', error);
        showError('Feil ved initialisering av applikasjon: ' + error.message);
        showLoginCard();
    }
}

// Show login card
function showLoginCard() {
    loginCard.classList.remove('hidden');
    profileCard.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    
    
    // Hide tender container on logout
    const tenderContainer = document.getElementById('tenderContainer');
    if (tenderContainer) {
        tenderContainer.classList.add('hidden');
    }
    
    hideMessages();
}

// Show user profile
function showUserProfile(account) {
    console.log('showUserProfile called with account:', account);
    console.log('AuthManager state:', {
        authManager: !!window.authManager,
        msalInstance: !!window.authManager?.msalInstance,
        isInitialized: window.authManager?.isInitialized
    });
    
    loginCard.classList.add('hidden');
    profileCard.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    
    
    // Show tender container instead of profile card
    const tenderContainer = document.getElementById('tenderContainer');
    if (tenderContainer) {
        tenderContainer.classList.remove('hidden');
        
        // Check if this is a redirect login
        const urlParams = new URLSearchParams(window.location.search);
        const isRedirectLogin = urlParams.has('code') || urlParams.has('state') || 
                              window.location.hash.includes('access_token') ||
                              window.location.hash.includes('id_token');
        
        console.log('showUserProfile - redirect detection:', {
            isRedirectLogin: isRedirectLogin,
            search: window.location.search,
            hash: window.location.hash
        });
        
        // For redirect login, wait a bit longer to ensure everything is ready
        const delay = isRedirectLogin ? 1500 : 1000;
        console.log(`Setting delay for tender table initialization: ${delay}ms`);
        
        setTimeout(() => {
            console.log('About to initialize tender table...');
            initializeTenderTable();
        }, delay);
        
        // Clean up URL after redirect login
        if (isRedirectLogin) {
            setTimeout(() => {
                // Clean up URL parameters after successful login
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
                console.log('URL cleaned up after redirect login');
            }, 2000);
        }
    }
    
    // Populate user information (keep for reference)
    userName.textContent = account.name || 'Bruker';
    displayName.textContent = account.name || 'Ikke tilgjengelig';
    userEmail.textContent = account.username || 'Ikke tilgjengelig';
    userId.textContent = account.localAccountId || 'Ikke tilgjengelig';
    tenantId.textContent = account.tenantId || 'Ikke tilgjengelig';
    
    // Set avatar (using Gravatar or default)
    const emailHash = account.username ? 
        btoa(account.username.toLowerCase().trim()) : 
        'default';
    userAvatar.src = `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=100`;
    
    hideMessages();
}

// Debug popup function removed - no longer needed

// Email functionality - using mailto approach


// Send tender email
async function sendTenderEmail(tenderId) {
    // Stop event propagation to prevent row click
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    let emailButton = null;
    let originalContent = '';
    
    try {
        // Find the tender
        const tender = window.tenderManager.tenders.find(t => t.pai_doffinhitsid === tenderId);
        if (!tender) {
            showError('Anbud ikke funnet');
            return;
        }

        // Get current user email
        const currentUser = window.authManager?.getCurrentUser();
        if (!currentUser?.username) {
            showError('Brukerinformasjon ikke tilgjengelig');
            return;
        }

        // Show loading state
        emailButton = event.target.closest('.btn-email');
        if (emailButton) {
            originalContent = emailButton.innerHTML;
            emailButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            emailButton.disabled = true;
        }


        // Use mailto approach - simple and works everywhere
        const subject = encodeURIComponent(`Anbud: ${tender.pai_overskrift || 'Ingen tittel'}`);
        const plainTextContent = createPlainTextEmail(tender);
        const body = encodeURIComponent(plainTextContent);
        const mailtoLink = `mailto:${currentUser.username}?subject=${subject}&body=${body}`;
        
        window.location.href = mailtoLink;
        showSuccess('E-post-klient åpnet!');

    } catch (error) {
        console.error('Error sending email:', error);
        showError('Feil ved sending av e-post: ' + (error.message || error));
    } finally {
        // Restore button state
        if (emailButton && originalContent) {
            emailButton.innerHTML = originalContent;
            emailButton.disabled = false;
        }
    }
}


// Create plain text email content
function createPlainTextEmail(tender) {
    const deadline = window.tenderManager.formatDate(tender.pai_deadline);
    const category = window.tenderManager.formatKategori(tender.pai_kategori);
    const status = window.tenderManager.formatDoffinStatus(tender.pai_doffinstatus);
    const aktuell = window.tenderManager.formatAktuell(tender.pai_aktuell);
    
    let emailContent = `Doffin360° - Anbudsdetaljer
${'='.repeat(50)}

TITTEL: ${tender.pai_overskrift || 'Ingen tittel'}

DETALJER:
- Frist: ${deadline}
- Kategori: ${category}
- Status: ${status}
- Aktuell: ${aktuell}`;

    if (tender.pai_sammendrag) {
        emailContent += `\n\nSAMMENDRAG:\n${tender.pai_sammendrag}`;
    }
    
    if (tender.pai_url) {
        emailContent += `\n\nURL: ${tender.pai_url}`;
    }
    
    if (tender.pai_merknad) {
        emailContent += `\n\nMERKNAD:\n${tender.pai_merknad}`;
    }
    
    emailContent += `\n\n${'='.repeat(50)}
Denne e-posten ble sendt fra Doffin360° - Full Oversikt over Offentlige Anbud
Sendt: ${new Date().toLocaleString('nb-NO')}`;
    
    return emailContent;
}

// Login function
async function login() {
    try {
        showLoading(true);
        hideMessages();
        
        const user = await authManager.login();
        
        if (user) {
            showUserProfile(user);
        }
        
    } catch (error) {
        console.error('Login failed:', error);
        // Error handling is done in AuthManager
    } finally {
        showLoading(false);
    }
}

// Logout function
async function logout() {
    try {
        await authManager.logout();
        
        // Clear tender data
        clearTenderData();
        
        
        showLoginCard();
    } catch (error) {
        console.error('Logout failed:', error);
        // Error handling is done in AuthManager
    }
}

// Show loading spinner
function showLoading(show) {
    if (show) {
        loadingSpinner.style.display = 'block';
        loginBtn.disabled = true;
    } else {
        loadingSpinner.style.display = 'none';
        loginBtn.disabled = false;
    }
}

// Show error message
function showError(message) {
    if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
        if (successMessage) {
    successMessage.classList.add('hidden');
        }
    }
}

// Show success message
function showSuccess(message) {
    if (successMessage) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');
        if (errorMessage) {
    errorMessage.classList.add('hidden');
        }
    
    // Hide success message after 3 seconds
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 3000);
    }
}

// Hide all messages
function hideMessages() {
    if (errorMessage) {
    errorMessage.classList.add('hidden');
    }
    if (successMessage) {
    successMessage.classList.add('hidden');
    }
}

// Event Listeners
loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', logout);
logoutBtnProfile.addEventListener('click', logout);

// Splash screen management
function showSplashScreen() {
    const splashScreen = document.getElementById('splashScreen');
    const mainContent = document.querySelector('.main-content');
    
    if (splashScreen) {
        splashScreen.classList.remove('hidden');
    }
    if (mainContent) {
        mainContent.classList.remove('visible');
    }
}

function hideSplashScreen() {
    const splashScreen = document.getElementById('splashScreen');
    const mainContent = document.querySelector('.main-content');
    
    if (splashScreen) {
        splashScreen.classList.add('hidden');
    }
    if (mainContent) {
        mainContent.classList.add('visible');
    }
}

// Initialize the application when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Show splash screen initially
    showSplashScreen();
    
    // Wait a bit to ensure MSAL is loaded, then initialize app
    setTimeout(async () => {
        try {
            await initializeApp();
            
            // Hide splash screen after app is initialized
            setTimeout(hideSplashScreen, 3000); // Show splash for 3 seconds
        } catch (error) {
            console.error('Failed to initialize app:', error);
            // Hide splash screen even if initialization fails
            setTimeout(hideSplashScreen, 3000);
        }
    }, 200);
});

// Handle page visibility change (for popup handling)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && authManager.isInitialized) {
        // Page became visible, check if user is logged in
        if (authManager.isAuthenticated()) {
            console.log('Page became visible, user is authenticated, showing tender table');
            showUserProfile(authManager.getCurrentUser());
        }
    }
});

// Additional fallback for redirect login - check after page load
window.addEventListener('load', () => {
    // Small delay to ensure everything is initialized
    setTimeout(() => {
        console.log('Fallback check - AuthManager state:', {
            authManager: !!window.authManager,
            isInitialized: window.authManager?.isInitialized,
            isAuthenticated: window.authManager?.isAuthenticated(),
            currentUser: window.authManager?.getCurrentUser()?.username
        });
        
        if (window.authManager && window.authManager.isInitialized && window.authManager.isAuthenticated()) {
            // Check if we're still showing login card when we should show tender table
            const loginCard = document.getElementById('loginCard');
            const tenderContainer = document.getElementById('tenderContainer');
            
            console.log('Fallback check - UI state:', {
                loginCardHidden: loginCard?.classList.contains('hidden'),
                tenderContainerHidden: tenderContainer?.classList.contains('hidden')
            });
            
            if (loginCard && !loginCard.classList.contains('hidden') && 
                tenderContainer && tenderContainer.classList.contains('hidden')) {
                console.log('Fallback: User is authenticated but still showing login card, fixing...');
                
                // Debug popup removed - no longer needed
                
                showUserProfile(window.authManager.getCurrentUser());
            }
        }
    }, 3000); // Wait 3 seconds after page load
});

// Additional check for URL-based redirect detection
window.addEventListener('load', () => {
    setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const hasRedirectParams = urlParams.has('code') || urlParams.has('state') || 
                                window.location.hash.includes('access_token') ||
                                window.location.hash.includes('id_token');
        
        console.log('URL-based redirect check:', {
            hasRedirectParams: hasRedirectParams,
            search: window.location.search,
            hash: window.location.hash
        });
        
        if (hasRedirectParams && window.authManager && window.authManager.isInitialized) {
            console.log('URL redirect params detected, checking authentication...');
            if (window.authManager.isAuthenticated()) {
                console.log('User is authenticated with redirect params, showing tender table');
                
                // Debug popup removed - no longer needed
                
                showUserProfile(window.authManager.getCurrentUser());
            }
        }
    }, 2000);
});

// Tender Table Management
let currentTender = null;
let searchTimeout = null;

// Initialize tender table
async function initializeTenderTable() {
    try {
        console.log('Initializing tender table...');
        console.log('AuthManager state at start:', {
            authManager: !!window.authManager,
            msalInstance: !!window.authManager?.msalInstance,
            isInitialized: window.authManager?.isInitialized
        });
        
        // Check if AuthManager is ready
        if (!window.authManager || !window.authManager.isInitialized) {
            console.log('AuthManager not ready, waiting longer...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time
        }
        
        // Additional check for redirect login scenarios
        const urlParams = new URLSearchParams(window.location.search);
        const isRedirectLogin = urlParams.has('code') || urlParams.has('state') || 
                              window.location.hash.includes('access_token') ||
                              window.location.hash.includes('id_token');
        
        if (isRedirectLogin) {
            console.log('Redirect login detected, waiting additional time for stability...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('AuthManager state after wait:', {
            authManager: !!window.authManager,
            msalInstance: !!window.authManager?.msalInstance,
            isInitialized: window.authManager?.isInitialized
        });
        
        // Set up event listeners
        setupTenderEventListeners();
        
        // Load initial data
        await loadTenders();
        
    } catch (error) {
        console.error('Failed to initialize tender table:', error);
        showTenderError('Feil ved initialisering av anbudstabell: ' + error.message);
    }
}

// Setup event listeners for tender table
function setupTenderEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                window.tenderManager.setSearchTerm(e.target.value);
                loadTenders();
            }, 300);
        });
    }
    
    // Show inactive button
    const showInactiveBtn = document.getElementById('showInactiveBtn');
    if (showInactiveBtn) {
        showInactiveBtn.addEventListener('click', () => {
            window.tenderManager.toggleShowInactive();
            updateTenderHeader();
            updateButtonStates();
            loadTenders();
        });
    }

    // Nye Anbud knapp
    const newTendersBtn = document.getElementById('newTendersBtn');
    if (newTendersBtn) {
        newTendersBtn.addEventListener('click', () => {
            window.tenderManager.toggleShowNewTenders();
            updateTenderHeader();
            updateButtonStates();
            loadTenders();
        });
    }
    
    // Save tender button
    const saveTenderBtn = document.getElementById('saveTenderBtn');
    if (saveTenderBtn) {
        saveTenderBtn.addEventListener('click', saveTenderDetails);
    }
    
    // State change confirmation
    const confirmStateChangeBtn = document.getElementById('confirmStateChangeBtn');
    if (confirmStateChangeBtn) {
        confirmStateChangeBtn.addEventListener('click', confirmStateChange);
    }

    // Sortable headers
    const sortableHeaders = document.querySelectorAll('.tender-table th.sortable');
    console.log('Setting up sortable headers:', sortableHeaders.length);
    sortableHeaders.forEach(header => {
        const sortField = header.getAttribute('data-sort');
        console.log('Setting up sort listener for field:', sortField);
        
        header.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Sort header clicked:', sortField);
            if (sortField) {
                window.tenderManager.setSorting(sortField);
                updateSortIndicators();
                loadTenders();
            }
        });
    });
    
    // Handle modal close events to prevent focus issues
    const tenderDetailsModal = document.getElementById('tenderDetailsModal');
    if (tenderDetailsModal) {
        tenderDetailsModal.addEventListener('hidden.bs.modal', () => {
            // Remove focus from any focused element in the modal
            const focusedElement = document.activeElement;
            if (focusedElement && tenderDetailsModal.contains(focusedElement)) {
                focusedElement.blur();
            }
        });
    }
    
    const stateChangeModal = document.getElementById('stateChangeModal');
    if (stateChangeModal) {
        stateChangeModal.addEventListener('hidden.bs.modal', () => {
            // Remove focus from any focused element in the modal
            const focusedElement = document.activeElement;
            if (focusedElement && stateChangeModal.contains(focusedElement)) {
                focusedElement.blur();
            }
        });
    }
}

// Load tenders from Dataverse
async function loadTenders() {
    try {
        showTenderLoading(true);
        hideTenderError();
        
        await window.tenderManager.fetchTenders();
        renderTenderTable();
        
    } catch (error) {
        console.error('Failed to load tenders:', error);
        showTenderError('Feil ved henting av anbudsdata: ' + error.message);
    } finally {
        showTenderLoading(false);
    }
}

// Render tender table
function renderTenderTable() {
    const tbody = document.getElementById('tenderTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (window.tenderManager.tenders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--neutral-color);">
                    Ingen anbud funnet
                </td>
            </tr>
        `;
        return;
    }
    
    window.tenderManager.tenders.forEach(tender => {
        const row = createTenderRow(tender);
        tbody.appendChild(row);
    });
    
    // Update sort indicators after rendering
    updateSortIndicators();
    
    // Check for truncated text and add tooltips
    setTimeout(() => {
        checkForTruncatedText();
        // Log unique status values for debugging
        window.tenderManager.getUniqueStatusValues();
        // Populate kategori dropdown
        populateKategoriDropdown();
    }, 100);
}

// Create tender row
function createTenderRow(tender) {
    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    
    const title = tender.pai_overskrift || 'Ingen tittel';
    const summary = tender.pai_sammendrag || 'Ingen beskrivelse';
    
    row.innerHTML = `
        <td data-label="Anbud">
            <div class="tender-title" title="${title.replace(/"/g, '&quot;')}">${title}</div>
            <div class="tender-summary" title="${summary.replace(/"/g, '&quot;')}">${summary}</div>
        </td>
        <td data-label="Frist">
            <div class="tender-deadline">${window.tenderManager.formatDate(tender.pai_deadline)}</div>
        </td>
        <td data-label="Kategori">
            <span class="tender-category">${window.tenderManager.formatKategori(tender.pai_kategori)}</span>
        </td>
        <td data-label="Status">
            <span class="tender-status">${window.tenderManager.formatDoffinStatus(tender.pai_doffinstatus)}</span>
        </td>
        <td data-label="Aktuell">
            <div class="tender-aktuell ${tender.pai_aktuell === true || tender.pai_aktuell === 1 ? 'yes' : 'no'}">
                <i class="fas fa-${tender.pai_aktuell === true || tender.pai_aktuell === 1 ? 'check' : 'times'}"></i>
                ${window.tenderManager.formatAktuell(tender.pai_aktuell)}
            </div>
        </td>
        <td data-label="Handlinger">
            <div class="action-buttons">
                <button class="btn-action btn-edit" onclick="editTender('${tender.pai_doffinhitsid}')" title="Rediger anbud">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-email" onclick="sendTenderEmail('${tender.pai_doffinhitsid}')" title="Send anbud via e-post">
                    <i class="fas fa-envelope"></i>
                </button>
                <button class="btn-action btn-delete" onclick="changeTenderState('${tender.pai_doffinhitsid}')" title="${window.tenderManager.showInactive ? 'Sett som aktiv' : 'Sett som inaktiv'}">
                    <i class="fas fa-${window.tenderManager.showInactive ? 'undo' : 'archive'}"></i>
                </button>
            </div>
        </td>
    `;
    
    // Add click handler for row
    row.addEventListener('click', (e) => {
        if (!e.target.closest('.action-buttons')) {
            showTenderDetails(tender);
        }
    });
    
    return row;
}

// Show tender details modal
function showTenderDetails(tender) {
    currentTender = tender;
    
    console.log('Showing tender details:', {
        pai_aktuell: tender.pai_aktuell,
        pai_aktuell_type: typeof tender.pai_aktuell,
        pai_merknad: tender.pai_merknad
    });
    
    document.getElementById('modalTenderTitle').textContent = tender.pai_overskrift || 'Ingen tittel';
    document.getElementById('modalTenderSummary').textContent = tender.pai_sammendrag || 'Ingen beskrivelse';
    
    const urlElement = document.getElementById('modalTenderUrl');
    if (tender.pai_url) {
        urlElement.innerHTML = `<a href="${tender.pai_url}" target="_blank" rel="noopener">${tender.pai_url}</a>`;
    } else {
        urlElement.textContent = 'Ingen URL';
    }
    
    // Set kategori dropdown
    const kategoriSelect = document.getElementById('modalTenderKategori');
    if (kategoriSelect) {
        // Handle category 0 specifically (0 is falsy in JavaScript)
        const categoryValue = tender.pai_kategori !== null && tender.pai_kategori !== undefined ? String(tender.pai_kategori) : '';
        kategoriSelect.value = categoryValue;
        console.log('Setting kategori dropdown value:', {
            original: tender.pai_kategori,
            type: typeof tender.pai_kategori,
            stringValue: categoryValue,
            dropdownValue: kategoriSelect.value
        });
    }
    
    document.getElementById('modalTenderAktuell').checked = window.tenderManager.normalizeBoolean(tender.pai_aktuell);
    document.getElementById('modalTenderMerknad').value = tender.pai_merknad || '';
    
    const modal = new bootstrap.Modal(document.getElementById('tenderDetailsModal'));
    modal.show();
}

// Save tender details
async function saveTenderDetails() {
    if (!currentTender) return;
    
    try {
        const aktuell = document.getElementById('modalTenderAktuell').checked;
        const merknad = document.getElementById('modalTenderMerknad').value;
        const kategori = document.getElementById('modalTenderKategori').value;
        
        // Prepare update data - only include fields that have changed
        const updateData = {};
        
        // Only update if value has changed (use normalizeBoolean for consistent comparison)
        const currentAktuell = window.tenderManager.normalizeBoolean(currentTender.pai_aktuell);
        if (currentAktuell !== aktuell) {
            updateData.pai_aktuell = aktuell;
        }
        
        if (currentTender.pai_merknad !== merknad) {
            updateData.pai_merknad = merknad || null; // Use null for empty strings
        }
        
        // Handle category comparison properly (0 is falsy in JavaScript)
        const currentCategory = currentTender.pai_kategori !== null && currentTender.pai_kategori !== undefined ? String(currentTender.pai_kategori) : '';
        const newCategory = kategori || '';
        
        if (currentCategory !== newCategory) {
            updateData.pai_kategori = newCategory || null; // Use null for empty strings
        }
        
        console.log('Saving tender details:', {
            tenderId: currentTender.pai_doffinhitsid,
            original: {
                pai_aktuell: currentTender.pai_aktuell,
                pai_aktuell_boolean: currentAktuell,
                pai_merknad: currentTender.pai_merknad,
                pai_kategori: currentTender.pai_kategori,
                pai_kategori_string: currentCategory
            },
            new: {
                pai_aktuell: aktuell,
                pai_merknad: merknad,
                pai_kategori: kategori,
                pai_kategori_string: newCategory
            },
            aktuellComparison: {
                current: currentAktuell,
                new: aktuell,
                changed: currentAktuell !== aktuell
            },
            categoryComparison: {
                current: currentCategory,
                new: newCategory,
                changed: currentCategory !== newCategory
            },
            updateData: updateData
        });
        
        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
            console.log('Updating tender with data:', updateData);
            const result = await window.tenderManager.updateTender(currentTender.pai_doffinhitsid, updateData);
            console.log('Update result:', result);
        } else {
            console.log('No changes to save');
        }
        
        // Close modal first to avoid aria-hidden focus issues
        const modal = bootstrap.Modal.getInstance(document.getElementById('tenderDetailsModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reload data after modal is closed
        setTimeout(async () => {
            console.log('Reloading tenders after update...');
            await loadTenders();
            console.log('Tenders reloaded, showing success message');
            showSuccess('Anbud oppdatert!');
        }, 300); // Wait for modal close animation
        
    } catch (error) {
        console.error('Failed to save tender:', error);
        showTenderError('Feil ved lagring: ' + error.message);
    }
}

// Change tender state
function changeTenderState(tenderId) {
    const tender = window.tenderManager.tenders.find(t => t.pai_doffinhitsid === tenderId);
    if (!tender) return;
    
    currentTender = tender;
    
    const message = window.tenderManager.showInactive 
        ? `Er du sikker på at du vil sette anbudet "${tender.pai_overskrift}" som aktiv?`
        : `Er du sikker på at du vil sette anbudet "${tender.pai_overskrift}" som inaktiv?`;
    
    document.getElementById('stateChangeMessage').textContent = message;
    
    const modal = new bootstrap.Modal(document.getElementById('stateChangeModal'));
    modal.show();
}

// Confirm state change
async function confirmStateChange() {
    if (!currentTender) return;
    
    try {
        const newState = window.tenderManager.showInactive ? 0 : 1; // Toggle state
        
        console.log('Changing tender state:', {
            tenderId: currentTender.pai_doffinhitsid,
            currentState: currentTender.statecode,
            newState: newState,
            showInactive: window.tenderManager.showInactive
        });
        
        await window.tenderManager.updateTender(currentTender.pai_doffinhitsid, {
            statecode: newState
        });
        
        // Close modal first to avoid aria-hidden focus issues
        const modal = bootstrap.Modal.getInstance(document.getElementById('stateChangeModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reload data after modal is closed
        setTimeout(async () => {
            await loadTenders();
            showSuccess('Anbud status endret!');
        }, 300); // Wait for modal close animation
        
    } catch (error) {
        console.error('Failed to change tender state:', error);
        showTenderError('Feil ved endring av status: ' + error.message);
    }
}

// Update tender header
function updateTenderHeader() {
    const title = document.getElementById('tenderHeaderTitle');
    const subtitle = document.getElementById('tenderHeaderSubtitle');
    
    if (window.tenderManager.showNewTenders) {
        title.textContent = 'Nye Anbud';
        subtitle.textContent = 'Viser nye anbud som ikke er markert som aktuelle (aktuell = false)';
    } else if (window.tenderManager.showInactive) {
        title.textContent = 'Inaktive Anbud';
        subtitle.textContent = 'Viser inaktive anbud fra Doffin';
    } else {
        title.textContent = 'Aktuelle Anbud';
        subtitle.textContent = 'Viser kun aktive anbud fra Doffin';
    }
}

// Update button states
function updateButtonStates() {
    const newTendersBtn = document.getElementById('newTendersBtn');
    const showInactiveBtn = document.getElementById('showInactiveBtn');
    
    // Reset all buttons to outline style
    if (newTendersBtn) {
        newTendersBtn.classList.remove('btn-primary');
        newTendersBtn.classList.add('btn-outline-primary');
    }
    
    if (showInactiveBtn) {
        showInactiveBtn.classList.remove('btn-secondary');
        showInactiveBtn.classList.add('btn-outline-secondary');
    }
    
    // Set active button based on current state
    if (window.tenderManager.showNewTenders && newTendersBtn) {
        newTendersBtn.classList.remove('btn-outline-primary');
        newTendersBtn.classList.add('btn-primary');
    } else if (window.tenderManager.showInactive && showInactiveBtn) {
        showInactiveBtn.classList.remove('btn-outline-secondary');
        showInactiveBtn.classList.add('btn-secondary');
    }
}

// Show tender loading
function showTenderLoading(show) {
    const loading = document.getElementById('tenderLoading');
    const tableContainer = document.getElementById('tenderTableContainer');
    
    if (loading) {
        loading.classList.toggle('hidden', !show);
    }
    if (tableContainer) {
        tableContainer.style.display = show ? 'none' : 'block';
    }
}

// Show tender error
function showTenderError(message) {
    const errorElement = document.getElementById('tenderError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

// Hide tender error
function hideTenderError() {
    const errorElement = document.getElementById('tenderError');
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

// Global functions for onclick handlers
window.editTender = (tenderId) => {
    // Stop event propagation to prevent row click
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const tender = window.tenderManager.tenders.find(t => t.pai_doffinhitsid === tenderId);
    if (tender) {
        showTenderDetails(tender);
    }
};

window.changeTenderState = (tenderId) => {
    // Stop event propagation to prevent row click
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    // Call the actual function directly to avoid recursion
    const tender = window.tenderManager.tenders.find(t => t.pai_doffinhitsid === tenderId);
    if (!tender) return;
    
    currentTender = tender;
    
    const message = window.tenderManager.showInactive 
        ? `Er du sikker på at du vil sette anbudet "${tender.pai_overskrift}" som aktiv?`
        : `Er du sikker på at du vil sette anbudet "${tender.pai_overskrift}" som inaktiv?`;
    
    document.getElementById('stateChangeMessage').textContent = message;
    
    const modal = new bootstrap.Modal(document.getElementById('stateChangeModal'));
    modal.show();
};

// Update sort indicators
function updateSortIndicators() {
    const sortableHeaders = document.querySelectorAll('.tender-table th.sortable');
    console.log('Updating sort indicators for', sortableHeaders.length, 'headers');
    console.log('Current sort field:', window.tenderManager.sortField, 'direction:', window.tenderManager.sortDirection);
    
    sortableHeaders.forEach(header => {
        const sortField = header.getAttribute('data-sort');
        const indicator = header.querySelector('.sort-indicator i');
        const indicatorContainer = header.querySelector('.sort-indicator');
        
        if (indicator) {
            const newIconClass = window.tenderManager.getSortIcon(sortField);
            const isActive = window.tenderManager.sortField === sortField;
            
            // Update icon class
            indicator.className = newIconClass;
            
            // Add/remove active class on both indicator and icon
            if (isActive) {
                indicatorContainer.classList.add('active');
                indicator.classList.add('active');
            } else {
                indicatorContainer.classList.remove('active');
                indicator.classList.remove('active');
            }
            
            console.log(`Updated sort indicator for ${sortField}:`, {
                iconClass: newIconClass,
                isActive: isActive,
                sortField: window.tenderManager.sortField,
                sortDirection: window.tenderManager.sortDirection,
                element: indicator
            });
        } else {
            console.warn('No indicator found for sort field:', sortField);
        }
    });
}

// Check for truncated text and manage tooltips
function checkForTruncatedText() {
    const titleElements = document.querySelectorAll('.tender-title');
    const summaryElements = document.querySelectorAll('.tender-summary');
    
    // Check titles
    titleElements.forEach(element => {
        const isTruncated = element.scrollHeight > element.clientHeight;
        if (!isTruncated) {
            element.removeAttribute('title');
        }
    });
    
    // Check summaries
    summaryElements.forEach(element => {
        const isTruncated = element.scrollHeight > element.clientHeight;
        if (!isTruncated) {
            element.removeAttribute('title');
        }
    });
}

// Populate kategori dropdown with available values
function populateKategoriDropdown() {
    const kategoriSelect = document.getElementById('modalTenderKategori');
    if (!kategoriSelect) return;
    
    // Get unique kategori values
    const uniqueKategorier = window.tenderManager.getUniqueKategoriValues();
    
    // Clear existing options except the first one
    kategoriSelect.innerHTML = '<option value="">Velg kategori...</option>';
    
    // Sort kategori values logically (0, 1, 2, 3, 4, 5, 6, 7)
    const sortedKategorier = uniqueKategorier.sort((a, b) => {
        const numA = parseInt(a) || 0;
        const numB = parseInt(b) || 0;
        return numA - numB;
    });

    // Add unique kategori values as options
    sortedKategorier.forEach(kategori => {
        // Ensure kategori is a string and not empty
        if (kategori && typeof kategori === 'string' && kategori.trim() !== '') {
            const option = document.createElement('option');
            option.value = kategori;
            option.textContent = window.tenderManager.formatKategori(kategori);
            kategoriSelect.appendChild(option);
        } else if (kategori && typeof kategori !== 'string') {
            // Handle non-string values (numbers, objects, etc.)
            const stringValue = String(kategori);
            if (stringValue.trim() !== '') {
                const option = document.createElement('option');
                option.value = stringValue;
                option.textContent = window.tenderManager.formatKategori(stringValue);
                kategoriSelect.appendChild(option);
            }
        }
    });
    
    console.log('Populated kategori dropdown with values:', uniqueKategorier);
    console.log('Kategori types:', uniqueKategorier.map(k => ({ value: k, type: typeof k })));
}

// Clear tender data on logout
function clearTenderData() {
    // Clear tender table
    const tbody = document.getElementById('tenderTableBody');
    if (tbody) {
        tbody.innerHTML = '';
    }
    
    // Clear search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Reset button states
    updateButtonStates();
    
    // Clear tender manager data
    if (window.tenderManager) {
        window.tenderManager.tenders = [];
        window.tenderManager.searchTerm = '';
        window.tenderManager.showInactive = false;
        window.tenderManager.showNewTenders = false;
        window.tenderManager.error = null;
        // Reset sorting to default
        window.tenderManager.sortField = 'pai_deadline';
        window.tenderManager.sortDirection = 'asc';
    }
    
    // Hide error messages
    hideTenderError();
    
    console.log('Tender data cleared on logout');
}
