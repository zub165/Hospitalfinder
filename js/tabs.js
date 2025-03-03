// Tab components mapping
const tabComponents = {
    'chat-tab': './components/chat.html',
    'registration-tab': './components/registration.html',
    'records-tab': './components/records.html',
    'hospital-tab': './components/hospital.html',
    'directions-tab': './components/directions.html'
};

// Global variable to track if TomTom is loaded
let isTomTomLoaded = false;

// Function to get the correct path for components
function getComponentPath(path) {
    const baseUrl = window.baseUrl || '';
    return `${baseUrl}${path}`;
}

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

// Load component content
async function loadComponent(tabId) {
    const componentPath = getComponentPath(tabComponents[tabId]);
    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const content = await response.text();
        document.getElementById(tabId).innerHTML = content;
    } catch (error) {
        console.error('Error loading component:', error);
        document.getElementById(tabId).innerHTML = `<div class="alert alert-danger">Error loading content. Please try again.</div>`;
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
    
    // Load initial active tab
    const activeTab = document.querySelector('.tab-pane.active');
    if (activeTab) {
        loadComponent(activeTab.id);
    }

    // Setup tab change listeners
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetId = event.target.getAttribute('data-bs-target').substring(1);
            loadComponent(targetId);
        });
    });
});

// Helper function to navigate to specific tab
function navigateToTab(tabId) {
    const tab = new bootstrap.Tab(document.querySelector(`button[data-bs-target="#${tabId}"]`));
    tab.show();
} 