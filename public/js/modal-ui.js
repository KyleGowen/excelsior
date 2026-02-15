/**
 * Modal and UI Functions
 * Starting with simple, self-contained functions
 */

/**
 * Open image modal - uses data-full-res if available for full-resolution display
 */
function openModal(imgElement) {
    const fullResPath = imgElement.dataset && imgElement.dataset.fullRes ? imgElement.dataset.fullRes : imgElement.src;
    document.getElementById('modalImage').src = fullResPath;
    document.getElementById('modalCaption').textContent = imgElement.alt;
    document.getElementById('imageModal').style.display = 'block';
}

/**
 * Close image modal
 */
function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
}

/**
 * Make all images clickable with modal behavior
 */
function makeImagesClickable() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Skip images that already have click handlers
        if (!img.onclick) {
            img.style.cursor = 'pointer';
            img.onclick = function() {
                openModal(this);
            };
        }
    });
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = '#4ecdc4';
            break;
        case 'error':
            notification.style.background = '#ff6b6b';
            break;
        case 'info':
            notification.style.background = '#74b9ff';
            break;
        default:
            notification.style.background = '#74b9ff';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
