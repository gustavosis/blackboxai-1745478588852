async function loadUserData() {
    try {
        const response = await fetch('/user-profile');
        if (!response.ok) throw new Error('Failed to fetch user data');
        const data = await response.json();
        const userData = data.user;

        // Update profile in menu
        document.getElementById('userMenuName').textContent = userData.name + (userData.lastname ? ' ' + userData.lastname : '');
        document.getElementById('userMenuService').textContent = userData.service || '';

        // Update profile in dropdown
        document.getElementById('userProfileName').textContent = userData.name + (userData.lastname ? ' ' + userData.lastname : '');
        document.getElementById('userProfileRole').textContent = userData.service || '';

        // Update profile images
        const profileImages = ['userProfileImage', 'userMenuImage'];
        profileImages.forEach(id => {
            const img = document.getElementById(id);
            if (img) {
                if (userData.profileImage) {
                    img.src = userData.profileImage;
                } else {
                    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name + ' ' + userData.lastname)}&background=0D8ABC&color=fff`;
                }
            }
        });

        // Update stats
        document.getElementById('completedServices').textContent = userData.stats?.completedServices || '0';
        document.getElementById('averageRating').textContent = userData.stats?.averageRating > 0 ? 
            userData.stats.averageRating.toFixed(1) : '--';
        document.getElementById('monthlyEarnings').textContent = `$${userData.stats?.monthlyEarnings || '0'}`;
        document.getElementById('pendingRequests').textContent = userData.stats?.pendingRequests || '0';

        // Update rating stars
        const rating = parseFloat(userData.stats?.averageRating) || 0;
        const starsContainer = document.getElementById('ratingStars');
        if (starsContainer) {
            const stars = starsContainer.getElementsByTagName('i');
            for (let i = 0; i < stars.length; i++) {
                stars[i].className = 'fas fa-star text-gray-300'; // Default gray stars
                if (rating > 0) {
                    if (i < Math.floor(rating)) {
                        stars[i].className = 'fas fa-star text-yellow-500';
                    } else if (i === Math.floor(rating) && rating % 1 > 0) {
                        stars[i].className = 'fas fa-star-half-alt text-yellow-500';
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function saveUserProfileChanges() {
    const nameInput = document.getElementById('nameInput');
    const lastnameInput = document.getElementById('lastnameInput');
    const serviceInput = document.getElementById('serviceInput');
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.getElementById('phoneInput');

    if (!nameInput.value.trim() || !lastnameInput.value.trim() || !serviceInput.value.trim() || !emailInput.value.trim() || !phoneInput.value.trim()) {
        showNotification('Por favor, completa todos los campos obligatorios', 'error');
        return;
    }

    const updatedUserData = {
        name: nameInput.value.trim(),
        lastname: lastnameInput.value.trim(),
        service: serviceInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim()
    };

    try {
        const response = await fetch('/user-profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUserData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar el perfil');
        }

        // Refresh user data in UI
        await loadUserData();

        showNotification('Perfil actualizado correctamente');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Service requests management
function renderServiceRequests() {
    const container = document.getElementById('serviceRequestsContainer');
    
    // Show empty state for service requests
    container.innerHTML = `
        <div class="text-center py-12">
            <div class="bg-gray-50 rounded-lg p-8 inline-block">
                <i class="fas fa-clipboard-list text-gray-400 text-4xl mb-4"></i>
                <p class="text-gray-600">No hay solicitudes pendientes</p>
                <p class="text-gray-500 text-sm mt-2">Las solicitudes de servicio aparecerán aquí</p>
            </div>
        </div>
    `;
}

// Document management
let uploadedDocuments = [];

function initDocuments() {
    // Check for existing documents in localStorage
    const savedDocs = localStorage.getItem('providerDocuments');
    if (savedDocs) {
        uploadedDocuments = JSON.parse(savedDocs);
        renderDocuments();
    }
    updateEmptyState();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const newDoc = {
            id: Date.now(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result,
            uploadDate: new Date().toISOString()
        };

        uploadedDocuments.push(newDoc);
        localStorage.setItem('providerDocuments', JSON.stringify(uploadedDocuments));
        renderDocuments();
        updateEmptyState();
        showNotification('Documento subido correctamente', 'success');
    };

    reader.readAsDataURL(file);
}

function deleteDocument(id) {
    if (confirm('¿Estás seguro que deseas eliminar este documento?')) {
        uploadedDocuments = uploadedDocuments.filter(doc => doc.id !== id);
        localStorage.setItem('providerDocuments', JSON.stringify(uploadedDocuments));
        renderDocuments();
        updateEmptyState();
        showNotification('Documento eliminado correctamente', 'success');
    }
}

function renderDocuments() {
    const grid = document.getElementById('documentsGrid');
    grid.innerHTML = '';

    uploadedDocuments.forEach(doc => {
        const docElement = document.createElement('div');
        docElement.className = 'bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow';
        
        const icon = getDocumentIcon(doc.type);
        
        docElement.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex items-center space-x-3">
                    <div class="text-gray-400 text-2xl">
                        <i class="${icon}"></i>
                    </div>
                    <div>
                        <h3 class="font-medium text-gray-900 truncate" style="max-width: 200px;">${doc.name}</h3>
                        <p class="text-sm text-gray-500">${formatFileSize(doc.size)}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="window.open('${doc.data}', '_blank')" 
                            class="text-blue-600 hover:text-blue-700">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="deleteDocument(${doc.id})" 
                            class="text-red-600 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        grid.appendChild(docElement);
    });
}

function updateEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const grid = document.getElementById('documentsGrid');
    
    if (uploadedDocuments.length === 0) {
        emptyState.classList.remove('hidden');
        grid.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        grid.classList.remove('hidden');
    }
}

function getDocumentIcon(mimeType) {
    if (mimeType.includes('pdf')) {
        return 'fas fa-file-pdf';
    } else if (mimeType.includes('image')) {
        return 'fas fa-file-image';
    } else {
        return 'fas fa-file';
    }
}

// Handle logout
function handleLogout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    notification.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500 flex items-center space-x-2`;
    
    const icon = document.createElement('i');
    icon.className = `fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`;
    notification.appendChild(icon);
    
    const text = document.createElement('span');
    text.textContent = message;
    notification.appendChild(text);
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    renderServiceRequests();
});
