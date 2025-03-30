// UI Module - Handles general UI elements and notifications

// Show status message in the status indicator
export function showStatusMessage(message, type = 'info', duration = 5000) {
    const statusElement = document.getElementById('status-text');
    const statusDot = document.querySelector('.status-dot');
    
    if (statusElement) {
        // Set message text
        statusElement.textContent = message;
        
        // Set color based on type
        if (statusDot) {
            switch (type) {
                case 'success':
                    statusDot.style.backgroundColor = 'var(--running)';
                    break;
                case 'error':
                    statusDot.style.backgroundColor = 'var(--stopped)';
                    break;
                case 'warning':
                    statusDot.style.backgroundColor = 'var(--paused)';
                    break;
                default:
                    statusDot.style.backgroundColor = 'var(--secondary)';
            }
        }
        
        // Reset after duration
        if (duration > 0 && type !== 'error') {
            setTimeout(() => {
                if (statusElement.textContent === message) {
                    statusElement.textContent = 'Connected to Docker';
                    if (statusDot) {
                        statusDot.style.backgroundColor = 'var(--secondary)';
                    }
                }
            }, duration);
        }
    }
}

// Show tooltip at specific position
export function setupTooltip(content, x, y) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;
    
    // Set content
    tooltip.innerHTML = content;
    
    // Position tooltip
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    
    // Show tooltip
    tooltip.classList.add('visible');
}

// Hide tooltip
export function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

// Show loading indicator
export function showLoading() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

// Hide loading indicator
export function hideLoading() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// Format a date
export function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

// Format container status for display
export function formatStatus(status) {
    if (!status) return 'Unknown';
    
    // Handle common Docker status formats
    if (status.includes('Up')) {
        return status.replace('Up', '<span class="status-label running">Up</span>');
    } else if (status.includes('Exited')) {
        return status.replace('Exited', '<span class="status-label stopped">Exited</span>');
    } else if (status.includes('Created')) {
        return status.replace('Created', '<span class="status-label created">Created</span>');
    } else if (status.includes('Paused')) {
        return status.replace('Paused', '<span class="status-label paused">Paused</span>');
    }
    
    return status;
} 