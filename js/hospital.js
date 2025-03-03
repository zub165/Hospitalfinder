// TomTom API Key
const TOMTOM_API_KEY = 'e5b5bd7e-a971-42f4-8b74-1b2355defe39';
let map;
let markers = [];

// Initialize map
function initializeMap() {
    if (!window.tt) {
        console.log('TomTom SDK not loaded yet');
        return;
    }

    // Check if map container exists
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.log('Map container not found');
        return;
    }

    // Initialize map only if it hasn't been initialized yet
    if (!map) {
        map = tt.map({
            key: window.tomtomApiKey,
            container: 'map',
            center: [-73.935242, 40.730610], // Default to New York
            zoom: 13
        });

        // Add controls
        map.addControl(new tt.NavigationControl());
        map.addControl(new tt.FullscreenControl());

        // Get user location and update map
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                map.setCenter([longitude, latitude]);
                findNearbyHospitals(latitude, longitude);
            }, error => {
                console.error('Error getting location:', error);
                // Show error message to user
                const hospitalList = document.getElementById('hospitalList');
                if (hospitalList) {
                    hospitalList.innerHTML = `
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            Unable to get your location. Please allow location access or enter your location manually.
                        </div>
                    `;
                }
            });
        }
    }
}

async function findNearbyHospitals(lat, lon) {
    try {
        const response = await fetch(
            `https://api.tomtom.com/search/2/poiSearch/hospital.json?key=${window.tomtomApiKey}&lat=${lat}&lon=${lon}&radius=5000&limit=10`
        );
        const data = await response.json();
        
        if (data.results) {
            updateHospitalList(data.results);
            addMarkersToMap(data.results);
        }
    } catch (error) {
        console.error('Error finding hospitals:', error);
        const hospitalList = document.getElementById('hospitalList');
        if (hospitalList) {
            hospitalList.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    Error finding nearby hospitals. Please try again later.
                </div>
            `;
        }
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
                    `https://api.tomtom.com/routing/1/calculateRoute/${startLat},${startLon}:${destLat},${destLon}/json?key=${TOMTOM_API_KEY}`
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