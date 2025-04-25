let map = null;
let userMarker = null;

function initMap() {
    // Create map with default center (will be updated with client location)
    map = L.map('map');
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Hide map container initially
    document.getElementById('mapContainer').classList.add('hidden');
    
    // Request location immediately
    requestLocation();
}

function requestLocation() {
    if ("geolocation" in navigator) {
        showNotification('Por favor, comparte tu ubicación para ver los servicios cercanos', 'info');
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const { latitude, longitude } = position.coords;
                
                // Update map view
                map.setView([latitude, longitude], 15);
                
                // Add or update user marker with custom icon
                if (userMarker) {
                    userMarker.setLatLng([latitude, longitude]);
                } else {
                    userMarker = L.marker([latitude, longitude], {
                        icon: L.divIcon({
                            className: 'user-marker',
                            html: '<div class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><i class="fas fa-user text-white"></i></div>',
                            iconSize: [32, 32],
                            iconAnchor: [16, 16]
                        })
                    }).addTo(map);
                }

                // Show map container
                document.getElementById('mapContainer').classList.remove('hidden');
                
                // Save location to localStorage
                localStorage.setItem('userLocation', JSON.stringify({
                    lat: latitude,
                    lng: longitude,
                    timestamp: Date.now()
                }));

                showNotification('Ubicación compartida correctamente', 'success');
                
            },
            function(error) {
                console.error("Error getting location:", error);
                showNotification('Error al obtener la ubicación. Por favor, habilita el acceso a tu ubicación para ver servicios cercanos.', 'error');
            },
            {
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 27000
            }
        );
    } else {
        showNotification('Tu navegador no soporta geolocalización', 'error');
    }
}

function showClientLocation(clientLat, clientLng, clientName) {
    if (!map) {
        showNotification('Por favor, comparte tu ubicación primero', 'error');
        return;
    }

    // Add client marker
    const clientMarker = L.marker([clientLat, clientLng], {
        icon: L.divIcon({
            className: 'client-marker',
            html: '<div class="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><i class="fas fa-user text-white"></i></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        })
    }).addTo(map);

    // Add popup with client info
    clientMarker.bindPopup(`
        <div class="text-center">
            <h3 class="font-semibold">${clientName}</h3>
            <p class="text-sm text-gray-600">Cliente</p>
        </div>
    `).openPopup();

    // Calculate bounds to show both markers
    const bounds = L.latLngBounds([
        [clientLat, clientLng],
        [userMarker.getLatLng().lat, userMarker.getLatLng().lng]
    ]);

    // Fit map to show both markers with padding
    map.fitBounds(bounds.pad(0.2));
}

function showLocationPrompt() {
    if (!map) {
        initMap();
    }
    requestLocation();
}

// Initialize map when script loads
document.addEventListener('DOMContentLoaded', function() {
    initMap();
});
