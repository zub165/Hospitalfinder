// API Configuration
const config = {
    // API Keys
    tomtomApiKey: window.tomtomApiKey || '',
    weatherApiKey: '6114ad970bf187b7ea8f8bb5bb6c1049',
    
    // API Endpoints
    weatherApi: {
        base: 'https://api.openweathermap.org/data/2.5',
        current: '/weather',
        forecast: '/forecast'
    },
    
    // Cache settings
    cache: {
        duration: 5 * 60 * 1000, // 5 minutes
        weatherDuration: 30 * 60 * 1000 // 30 minutes
    }
};

// Secure the config object
Object.freeze(config);

// Export configuration
window.AppConfig = config; 