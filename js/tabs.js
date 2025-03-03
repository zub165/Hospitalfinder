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

// Function to load TomTom SDK
async function loadTomTomSDK() {
    if (isTomTomLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
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
            resolve();
        };

        servicesScript.onerror = mapsScript.onerror = () => {
            reject(new Error('Failed to load TomTom SDK'));
        };

        document.head.appendChild(mapsScript);
    });
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
                initializeMap();
            }
        } catch (error) {
            console.error('Failed to load TomTom SDK:', error);
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger';
            errorMessage.textContent = 'Failed to load map. Please try again later.';
            document.querySelector(targetTab).prepend(errorMessage);
        }
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