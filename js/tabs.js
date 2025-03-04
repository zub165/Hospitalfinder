// Tab components configuration
const tabComponents = {
    'chat-tab': 'components/chat.html',
    'hospital-tab': 'components/hospital.html',
    'registration-tab': 'components/registration.html',
    'records-tab': 'components/records.html',
    'directions-tab': 'components/directions.html'
};

// Global variable to track if TomTom is loaded
let isTomTomLoaded = false;
let isTomTomLoading = false;
let tomtomLoadPromise = null;

// Function to load TomTom SDK
async function loadTomTomSDK() {
    if (isTomTomLoaded) return Promise.resolve();
    if (isTomTomLoading) return tomtomLoadPromise;

    isTomTomLoading = true;
    tomtomLoadPromise = new Promise((resolve, reject) => {
        try {
            // Load CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.type = 'text/css';
            cssLink.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.1/maps/maps.css';
            document.head.appendChild(cssLink);

            // Load Maps SDK
            const mapsScript = document.createElement('script');
            mapsScript.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.1/maps/maps-web.min.js';
            
            // Load Services SDK
            const servicesScript = document.createElement('script');
            servicesScript.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.1/services/services-web.min.js';

            // Handle loading sequence
            mapsScript.onload = () => {
                document.head.appendChild(servicesScript);
            };

            servicesScript.onload = () => {
                isTomTomLoaded = true;
                isTomTomLoading = false;
                resolve();
            };

            servicesScript.onerror = mapsScript.onerror = (error) => {
                isTomTomLoading = false;
                console.error('Failed to load TomTom SDK:', error);
                reject(new Error('Failed to load TomTom SDK. Please check your internet connection and try again.'));
            };

            // Set loading timeout
            setTimeout(() => {
                if (!isTomTomLoaded) {
                    isTomTomLoading = false;
                    reject(new Error('TomTom SDK loading timeout. Please try again.'));
                }
            }, 20000); // 20 second timeout

            document.head.appendChild(mapsScript);
        } catch (error) {
            isTomTomLoading = false;
            reject(error);
        }
    });

    return tomtomLoadPromise;
}

// Function to load tab content
async function loadTabContent(tabId) {
    console.log('Loading content for tab:', tabId);
    try {
        const tabPane = document.getElementById(tabId);
        if (!tabPane) {
            console.error('Tab pane not found:', tabId);
            return;
        }

        // Always load content for now (remove the data-loaded check temporarily)
        const response = await fetch(tabComponents[tabId]);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        console.log('Content loaded:', content.substring(0, 100) + '...');
        
        // Insert the content
        tabPane.innerHTML = content;
        
        // Make sure the tab is visible
        tabPane.classList.add('show', 'active');
        
        // Initialize specific tab functionality
        console.log('Initializing tab functionality for:', tabId);
        switch(tabId) {
            case 'chat-tab':
                if (typeof initializeChat === 'function') {
                    initializeChat();
                }
                break;
            case 'hospital-tab':
                if (typeof initializeMap === 'function') {
                    setTimeout(initializeMap, 100);
                }
                break;
            case 'directions-tab':
                if (typeof initializeDirections === 'function') {
                    setTimeout(initializeDirections, 100);
                }
                break;
            case 'registration-tab':
                if (typeof initializeRegistration === 'function') {
                    initializeRegistration();
                }
                break;
            case 'records-tab':
                if (typeof initializeRecords === 'function') {
                    initializeRecords();
                }
                break;
        }
    } catch (error) {
        console.error('Error loading tab content:', error);
        const tabPane = document.getElementById(tabId);
        if (tabPane) {
            tabPane.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Error loading content</h4>
                    <p>${error.message}</p>
                    <hr>
                    <p class="mb-0">Please try refreshing the page or contact support if the problem persists.</p>
                </div>
            `;
        }
    }
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
}

// Update theme icon
function updateThemeIcon() {
    const icon = document.querySelector('.theme-toggle i');
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

// Handle tab changes
async function handleTabChange(event) {
    const targetTab = event.target.getAttribute('data-bs-target');
    
    // Load TomTom SDK if hospital or directions tab is selected
    if ((targetTab === '#hospital-tab' || targetTab === '#directions-tab') && !isTomTomLoaded) {
        try {
            const loadingEl = document.querySelector(`${targetTab} .loading`);
            if (loadingEl) {
                loadingEl.textContent = 'Loading map...';
            }
            
            await loadTomTomSDK();
            
            // Initialize map if needed
            if (targetTab === '#hospital-tab' && typeof initializeMap === 'function') {
                setTimeout(() => {
                    try {
                        initializeMap();
                    } catch (error) {
                        console.error('Failed to initialize map:', error);
                        showMapError(targetTab);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Failed to load TomTom SDK:', error);
            showMapError(targetTab);
        }
    }
}

// Show map error message
function showMapError(targetTab) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'alert alert-danger';
    errorMessage.innerHTML = `
        <h4 class="alert-heading">Map Loading Error</h4>
        <p>We encountered an error while loading the map. This might be due to:</p>
        <ul>
            <li>Internet connection issues</li>
            <li>Ad blockers or privacy settings</li>
            <li>Temporary service disruption</li>
        </ul>
        <hr>
        <p class="mb-0">Please try refreshing the page or check your internet connection.</p>
        <button class="btn btn-outline-danger mt-2" onclick="location.reload()">
            <i class="fas fa-sync-alt"></i> Refresh Page
        </button>
    `;
    
    const container = document.querySelector(targetTab);
    if (container) {
        container.prepend(errorMessage);
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    
    // Add tab change listener
    const tabElements = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', handleTabChange);
    });
});

// Helper function to navigate to specific tab
function navigateToTab(tabId) {
    const tab = new bootstrap.Tab(document.querySelector(`button[data-bs-target="#${tabId}"]`));
    tab.show();
} 