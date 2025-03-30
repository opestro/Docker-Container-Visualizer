// Main application entry point
import { initGraph, updateGraph } from './modules/graph.js';
import { setupEventHandlers } from './modules/events.js';
import { showStatusMessage } from './modules/ui.js';

// Initialize application
async function initApp() {
    try {
        // Show loading indicator
        document.getElementById('loader').classList.remove('hidden');
        
        // Initialize the graph visualization
        await initGraph();
        
        // Set up event handlers
        setupEventHandlers();
        
        // Update status
        showStatusMessage('Connected to Docker', 'success');
        
        // Hide loading indicator
        document.getElementById('loader').classList.add('hidden');
        
        // Set up regular updates
        setInterval(updateGraph, 10000);
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showStatusMessage('Failed to connect to Docker', 'error');
        document.getElementById('loader').classList.add('hidden');
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Expose functions for debugging
window.debug = {
    updateGraph,
    showStatusMessage
}; 