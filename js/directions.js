let directionsMap;
let directionsMarkers = [];
let currentRoute = null;

// Common fetch options for TomTom API
const tomtomFetchOptions = {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Origin': window.location.origin
    },
    mode: 'cors'
};

// Initialize directions when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const directionsTab = document.getElementById('directions-tab');
    if (directionsTab) {
        directionsTab.addEventListener('shown.bs.tab', () => {
            console.log('Directions tab shown, initializing...');
            initializeDirections();
        });
    }
});

// Initialize directions functionality
function initializeDirections() {
    console.log('Initializing directions tab...');
    
    const fromAddress = document.getElementById('fromAddress');
    const toAddress = document.getElementById('toAddress');
    const directionsPanel = document.getElementById('directionsPanel');
    
    if (!fromAddress || !toAddress || !directionsPanel) {
        console.error('Directions map container not found');
        return;
    }

    // Initialize the map first
    initializeDirectionsMap();
    
    // Get user's location when the tab loads
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            console.log('Got user location:', latitude, longitude);
            reverseGeocode(latitude, longitude);
        }, error => {
            console.error('Geolocation error:', error);
            if (fromAddress) {
                fromAddress.placeholder = 'Enter your location...';
            }
        });
    } else {
        console.log('Geolocation not supported');
        if (fromAddress) {
            fromAddress.placeholder = 'Enter your location...';
        }
    }

    // Load nearby hospitals
    loadNearbyHospitals();
}

// Reverse geocode coordinates to address
async function reverseGeocode(lat, lon) {
    console.log('Reverse geocoding:', lat, lon);
    try {
        const response = await fetch(
            `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${window.tomtomApiKey}`,
            tomtomFetchOptions
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Reverse geocoding response:', data);
        
        if (data.addresses && data.addresses[0]) {
            document.getElementById('fromAddress').value = data.addresses[0].address.freeformAddress;
        }
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        document.getElementById('fromAddress').placeholder = 'Enter your location...';
    }
}

// Load nearby hospitals
async function loadNearbyHospitals() {
    console.log('Loading nearby hospitals...');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async position => {
            const { latitude, longitude } = position.coords;
            console.log('Searching hospitals near:', latitude, longitude);
            
            try {
                const response = await fetch(
                    `https://api.tomtom.com/search/2/poiSearch/hospital.json?key=${window.tomtomApiKey}&lat=${latitude}&lon=${longitude}&radius=5000&limit=10`,
                    tomtomFetchOptions
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Hospital search response:', data);
                
                // Update hospital list in directions panel
                const hospitalList = document.querySelector('#directions-tab .hospital-list');
                if (hospitalList && data.results && data.results.length > 0) {
                    hospitalList.innerHTML = data.results.map(hospital => `
                        <div class="hospital-card" onclick="setHospitalAddress('${hospital.address.freeformAddress}')">
                            <div class="hospital-info">
                                <h3>${hospital.poi.name}</h3>
                                <p>${hospital.address.freeformAddress}</p>
                            </div>
                        </div>
                    `).join('');
                } else {
                    hospitalList.innerHTML = '<div class="alert alert-info">No hospitals found nearby.</div>';
                }
            } catch (error) {
                console.error('Error loading nearby hospitals:', error);
                const hospitalList = document.querySelector('#directions-tab .hospital-list');
                if (hospitalList) {
                    hospitalList.innerHTML = `
                        <div class="alert alert-danger">
                            <h4 class="alert-heading">Error loading hospitals</h4>
                            <p>${error.message}</p>
                            <hr>
                            <p class="mb-0">Please make sure you're using HTTPS or try again later.</p>
                        </div>
                    `;
                }
            }
        }, error => {
            console.error('Geolocation error:', error);
            const hospitalList = document.querySelector('#directions-tab .hospital-list');
            if (hospitalList) {
                hospitalList.innerHTML = `
                    <div class="alert alert-warning">
                        <h4 class="alert-heading">Location Access Required</h4>
                        <p>Please enable location access to find nearby hospitals.</p>
                    </div>
                `;
            }
        });
    }
}

// Set hospital address in the input field
function setHospitalAddress(address) {
    document.getElementById('toAddress').value = address;
}

// Calculate and display route
async function calculateAndDisplayRoute() {
    const fromAddress = document.getElementById('fromAddress').value;
    const toAddress = document.getElementById('toAddress').value;

    if (!fromAddress || !toAddress) {
        alert('Please enter both addresses');
        return;
    }

    try {
        // First, geocode both addresses
        const [fromLocation, toLocation] = await Promise.all([
            geocodeAddress(fromAddress),
            geocodeAddress(toAddress)
        ]);

        if (!fromLocation || !toLocation) {
            alert('Could not find one or both addresses');
            return;
        }

        // Calculate route
        const response = await fetch(
            `https://api.tomtom.com/routing/1/calculateRoute/${fromLocation.lat},${fromLocation.lon}:${toLocation.lat},${toLocation.lon}/json?key=${window.tomtomApiKey}`,
            tomtomFetchOptions
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.routes && data.routes[0]) {
            displayRoute(data.routes[0], fromLocation, toLocation);
        }
    } catch (error) {
        console.error('Error calculating route:', error);
        const directionsPanel = document.getElementById('directionsPanel');
        if (directionsPanel) {
            directionsPanel.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Error calculating route</h4>
                    <p>${error.message}</p>
                    <hr>
                    <p class="mb-0">Please make sure you're using HTTPS or try again later.</p>
                </div>
            `;
        }
    }
}

// Geocode address to coordinates
async function geocodeAddress(address) {
    try {
        const response = await fetch(
            `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?key=${window.tomtomApiKey}`,
            tomtomFetchOptions
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.results && data.results[0]) {
            return {
                lat: data.results[0].position.lat,
                lon: data.results[0].position.lon
            };
        }
        return null;
    } catch (error) {
        console.error('Error geocoding address:', error);
        return null;
    }
}

// Display route instructions
function displayRoute(route, fromCoords, toCoords) {
    // Clear existing markers and route
    directionsMarkers.forEach(marker => marker.remove());
    directionsMarkers = [];
    if (currentRoute) {
        directionsMap.removeLayer(currentRoute);
    }

    // Add markers for start and end points
    const startMarker = new tt.Marker().setLngLat([fromCoords.lon, fromCoords.lat]).addTo(directionsMap);
    const endMarker = new tt.Marker().setLngLat([toCoords.lon, toCoords.lat]).addTo(directionsMap);
    directionsMarkers.push(startMarker, endMarker);

    // Draw route on map
    currentRoute = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: route.legs[0].points.map(point => [point.longitude, point.latitude])
            }
        }]
    };

    directionsMap.addLayer({
        id: 'route',
        type: 'line',
        source: {
            type: 'geojson',
            data: currentRoute
        },
        paint: {
            'line-color': '#4a90e2',
            'line-width': 6
        }
    });

    // Fit map to show entire route
    const bounds = new tt.LngLatBounds();
    route.legs[0].points.forEach(point => {
        bounds.extend([point.longitude, point.latitude]);
    });
    directionsMap.fitBounds(bounds, { padding: 50 });

    // Display route information
    displayRouteInfo(route);
}

function displayRouteInfo(route) {
    const directionsPanel = document.getElementById('directionsPanel');
    const summary = route.summary;
    
    const hours = Math.floor(summary.travelTimeInSeconds / 3600);
    const minutes = Math.floor((summary.travelTimeInSeconds % 3600) / 60);
    const distance = (summary.lengthInMeters / 1000).toFixed(1);

    directionsPanel.innerHTML = `
        <div class="route-summary">
            <h3>Route Summary</h3>
            <p>
                <i class="fas fa-clock"></i> ${hours > 0 ? `${hours}h ` : ''}${minutes}min
                <i class="fas fa-road ms-3"></i> ${distance}km
            </p>
        </div>
        <div class="route-instructions">
            <h3>Turn-by-turn Directions</h3>
            <ol>
                ${route.guidance.instructions.map(instruction => `
                    <li>
                        ${instruction.message}
                        ${instruction.travelTimeInSeconds > 60 
                            ? ` (${Math.round(instruction.travelTimeInSeconds / 60)} min)` 
                            : ''}
                    </li>
                `).join('')}
            </ol>
        </div>
    `;
}

function initializeDirectionsMap() {
    if (!window.tt) {
        console.error('TomTom SDK not loaded yet');
        showError('Map service is still loading. Please try again in a moment.');
        return;
    }

    if (!window.tomtomConfig?.apiKey) {
        console.error('TomTom API key not configured');
        showError('Map service is not properly configured. Please check your API key.');
        return;
    }

    // Check if map container exists
    const mapContainer = document.getElementById('directionsMap');
    if (!mapContainer) {
        console.error('Directions map container not found');
        return;
    }

    // Initialize map only if it hasn't been initialized yet
    if (!directionsMap) {
        try {
            directionsMap = tt.map({
                key: window.tomtomConfig.apiKey,
                container: 'directionsMap',
                center: window.tomtomConfig.defaultCenter || [-73.935242, 40.730610],
                zoom: window.tomtomConfig.defaultZoom || 13,
                language: window.tomtomConfig.language || 'en-GB'
            });

            // Add controls
            directionsMap.addControl(new tt.NavigationControl());
            directionsMap.addControl(new tt.FullscreenControl());

            console.log('Directions map initialized successfully');

            // Get user location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const { latitude, longitude } = position.coords;
                        directionsMap.setCenter([longitude, latitude]);
                        reverseGeocode(latitude, longitude);
                    },
                    error => {
                        console.error('Error getting location:', error);
                        showError('Unable to get your location. Please enter your address manually.');
                    }
                );
            }
        } catch (error) {
            console.error('Error initializing directions map:', error);
            showError('Failed to initialize map. Please refresh the page and try again.');
        }
    }
}

function showError(message) {
    const directionsPanel = document.getElementById('directionsPanel');
    directionsPanel.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        </div>
    `;
} 