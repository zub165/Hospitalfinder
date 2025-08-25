// Hospital component configuration
const config = {
    apiBaseUrl: 'http://localhost:3001/tomtom',
    mapOptions: {
        zoom: window.tomtomConfig?.defaultZoom || 13,
        defaultCenter: window.tomtomConfig?.defaultCenter || [-73.935242, 40.730610], // Default to New York
        key: window.tomtomConfig?.apiKey,
        language: window.tomtomConfig?.language || 'en-GB'
    }
};

let map;
let markers = [];
let currentSearchRequest = null;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

// Initialize map
document.addEventListener('DOMContentLoaded', () => {
    const hospitalTab = document.getElementById('hospital-tab');
    if (hospitalTab) {
        hospitalTab.addEventListener('shown.bs.tab', () => {
            console.log('Hospital tab shown, initializing map...');
            if (!map) {
                initializeMap();
            }
        });
    }
});

async function initializeMap() {
    try {
        console.log('Initializing map with config:', config);
        if (!window.tomtomConfig?.apiKey) {
            throw new Error('TomTom API key is not configured');
        }

        const mapElement = document.getElementById('map');
        if (!mapElement) {
            throw new Error('Map container element not found');
        }

        map = tt.map({
            key: window.tomtomConfig.apiKey,
            container: 'map',
            center: config.mapOptions.defaultCenter,
            zoom: config.mapOptions.zoom,
            language: config.mapOptions.language,
            style: `https://api.tomtom.com/maps-sdk-for-web/cdn/${window.tomtomConfig.apiVersion || '6.x'}/styles/basic-main.json`
        });

        map.addControl(new tt.FullscreenControl());
        map.addControl(new tt.NavigationControl());

        console.log('Map initialized successfully');
        getUserLocation();
    } catch (error) {
        console.error('Error initializing map:', error);
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = `<div class="alert alert-danger">Error loading map: ${error.message}</div>`;
        }
    }
}

// Get user location and update map
async function getUserLocation() {
    try {
        console.log('Requesting user location...');
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        console.log('User location obtained:', { latitude, longitude });
        
        // Center the map on user's location
        map.setCenter([longitude, latitude]);
        map.setZoom(13);

        // Add a marker for user's location
        new tt.Marker({
            color: '#FF0000'
        })
        .setLngLat([longitude, latitude])
        .setPopup(new tt.Popup({ offset: 30 }).setHTML('Your Location'))
        .addTo(map);

        // Find nearby hospitals
        await findNearbyHospitals(latitude, longitude);
    } catch (error) {
        console.error('Error getting user location:', error);
        showLocationError();
        
        // If location access is denied, center on default location
        map.setCenter(config.mapOptions.defaultCenter);
        map.setZoom(config.mapOptions.zoom);
        
        // Try to find hospitals at the default location
        const [defaultLon, defaultLat] = config.mapOptions.defaultCenter;
        await findNearbyHospitals(defaultLat, defaultLon);
    }
}

// Get current position as a promise
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,        // Increased timeout to 10 seconds
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('Geolocation success:', position);
                resolve(position);
            },
            (error) => {
                console.error('Geolocation error:', error);
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        reject(new Error('Location access denied. Please enable location services in your browser.'));
                        break;
                    case error.POSITION_UNAVAILABLE:
                        reject(new Error('Location information unavailable.'));
                        break;
                    case error.TIMEOUT:
                        reject(new Error('Location request timed out.'));
                        break;
                    default:
                        reject(new Error('An unknown error occurred while requesting location.'));
                }
            },
            options
        );
    });
}

async function findNearbyHospitals(lat, lon) {
    try {
        // Cancel any ongoing search request
        if (currentSearchRequest) {
            currentSearchRequest.abort();
        }

        // Create AbortController for this request
        const controller = new AbortController();
        currentSearchRequest = controller;

        const response = await fetch(
            `${config.apiBaseUrl}/search/2/poiSearch/hospital.json?lat=${lat}&lon=${lon}&radius=5000&limit=10`,
            { signal: controller.signal }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.results) {
            updateHospitalList(data.results);
            addMarkersToMap(data.results);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Search request cancelled');
            return;
        }
        console.error('Error finding hospitals:', error);
        showHospitalSearchError();
    } finally {
        currentSearchRequest = null;
    }
}

// Show location error with more detailed message
function showLocationError() {
    const hospitalList = document.getElementById('hospitalList');
    if (hospitalList) {
        hospitalList.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <h4 class="alert-heading">Location Access Required</h4>
                <p>We couldn't access your location. This might be because:</p>
                <ul>
                    <li>Location permission was denied</li>
                    <li>Your browser's location services are disabled</li>
                    <li>Your device's location services are disabled</li>
                </ul>
                <p>To fix this:</p>
                <ol>
                    <li>Click the location icon in your browser's address bar and allow access</li>
                    <li>Check if location services are enabled in your device settings</li>
                    <li>Try refreshing the page</li>
                </ol>
                <button class="btn btn-warning mt-2" onclick="getUserLocation()">
                    <i class="fas fa-location-arrow"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Show hospital search error
function showHospitalSearchError() {
    const hospitalList = document.getElementById('hospitalList');
    if (hospitalList) {
        hospitalList.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                <h4 class="alert-heading">Error Finding Hospitals</h4>
                <p>We encountered an error while searching for nearby hospitals. This might be due to:</p>
                <ul>
                    <li>Internet connection issues</li>
                    <li>Service temporarily unavailable</li>
                    <li>Invalid location data</li>
                </ul>
                <button class="btn btn-danger mt-2" onclick="findNearbyHospitals(map.getCenter().lat, map.getCenter().lng)">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            </div>
        `;
    }
}

function updateHospitalList(hospitals) {
    const hospitalList = document.getElementById('hospitalList');
    if (!hospitalList) return;

    hospitalList.innerHTML = hospitals.map(hospital => `
        <div class="hospital-item" onclick="selectHospital(${hospital.position.lat}, ${hospital.position.lon}, '${hospital.poi.name}')">
            <div class="hospital-name">${hospital.poi.name}</div>
            <div class="hospital-address">${hospital.address.freeformAddress}</div>
            <div class="hospital-info">
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>24/7</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-phone"></i>
                    <span>${hospital.poi.phone || 'N/A'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function addMarkersToMap(hospitals) {
    if (!map || !window.tt) return;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    // Add new markers
    hospitals.forEach(hospital => {
        const marker = new tt.Marker()
            .setLngLat([hospital.position.lon, hospital.position.lat])
            .addTo(map);

        const popup = new tt.Popup({ offset: 30 })
            .setHTML(`
                <strong>${hospital.poi.name}</strong><br>
                ${hospital.address.freeformAddress}
            `);

        marker.setPopup(popup);
        markers.push(marker);
    });
}

function selectHospital(lat, lon, name) {
    if (!map) return;

    map.flyTo({
        center: [lon, lat],
        zoom: 15
    });

    // Update directions tab if needed
    const toAddressInput = document.getElementById('toAddress');
    if (toAddressInput) {
        toAddressInput.value = name;
    }
}

// Initialize search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('hospitalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const hospitalItems = document.getElementsByClassName('hospital-item');
            
            Array.from(hospitalItems).forEach(item => {
                const name = item.querySelector('.hospital-name').textContent.toLowerCase();
                const address = item.querySelector('.hospital-address').textContent.toLowerCase();
                
                if (name.includes(searchTerm) || address.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
});

function calculateRoute(destLat, destLon) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async position => {
            const { latitude: startLat, longitude: startLon } = position.coords;
            
            try {
                const response = await fetch(
                    `https://api.tomtom.com/routing/1/calculateRoute/${startLat},${startLon}:${destLat},${destLon}/json?key=${window.tomtomConfig.apiKey}`
                );
                const data = await response.json();

                // Draw the route on the map
                if (data.routes && data.routes[0]) {
                    const route = data.routes[0];
                    const routeCoordinates = route.legs[0].points.map(point => [point.longitude, point.latitude]);

                    // Remove existing route layer if it exists
                    if (map.getLayer('route')) {
                        map.removeLayer('route');
                        map.removeSource('route');
                    }

                    // Add the new route
                    map.addLayer({
                        id: 'route',
                        type: 'line',
                        source: {
                            type: 'geojson',
                            data: {
                                type: 'Feature',
                                properties: {},
                                geometry: {
                                    type: 'LineString',
                                    coordinates: routeCoordinates
                                }
                            }
                        },
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#2196F3',
                            'line-width': 4
                        }
                    });

                    // Fit the map to show the entire route
                    const bounds = routeCoordinates.reduce((bounds, coord) => {
                        return bounds.extend(coord);
                    }, new tt.LngLatBounds(routeCoordinates[0], routeCoordinates[0]));

                    map.fitBounds(bounds, { padding: 50 });
                }
            } catch (error) {
                console.error('Error calculating route:', error);
            }
        });
    }
}

function navigateToDirections() {
    navigateToTab('directions-tab');
}

function showMapError() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div class="alert alert-danger">
                <h4 class="alert-heading">Map Loading Error</h4>
                <p>We encountered an error while loading the map. This might be due to:</p>
                <ul>
                    <li>Internet connection issues</li>
                    <li>TomTom SDK loading failure</li>
                    <li>Invalid API key</li>
                </ul>
                <hr>
                <p class="mb-0">Please try refreshing the page or check your internet connection.</p>
                <button class="btn btn-outline-danger mt-2" onclick="location.reload()">
                    <i class="fas fa-sync-alt"></i> Refresh Page
                </button>
            </div>
        `;
    }
} 