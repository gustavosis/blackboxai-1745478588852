let map = null;
let userMarker = null;
let watchId = null;

function initMap() {
    // Create map centered on Talca
    map = L.map('map').setView([-35.4264, -71.6553], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add user marker with custom icon
    userMarker = L.marker([-35.4264, -71.6553], {
        icon: L.divIcon({
            className: 'user-marker',
            html: '<div class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><i class="fas fa-user text-white"></i></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        })
    }).addTo(map);

    // Show map container
    document.getElementById('mapContainer').classList.remove('hidden');
}

function showLocationPrompt() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const { latitude, longitude } = position.coords;
            
            // Update map and marker
            map.setView([latitude, longitude], 15);
            userMarker.setLatLng([latitude, longitude]);
            
            // Start watching position
            watchId = navigator.geolocation.watchPosition(
                function(position) {
                    const { latitude, longitude } = position.coords;
                    userMarker.setLatLng([latitude, longitude]);
                },
                function(error) {
                    console.error("Error watching position:", error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 30000,
                    timeout: 27000
                }
            );
            
            // Save location to localStorage
            localStorage.setItem('lastLocation', JSON.stringify({
                lat: latitude,
                lng: longitude,
                timestamp: Date.now()
            }));
            
        }, function(error) {
            console.error("Error getting location:", error);
            showNotification('Error al obtener la ubicación. Por favor, habilita el acceso a tu ubicación.', 'error');
        });
    } else {
        showNotification('Tu navegador no soporta geolocalización', 'error');
    }
}

// Clean up on page unload
window.addEventListener('unload', function() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }
});
