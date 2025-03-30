// Events module - handles all user interactions
import { getGraph, updateGraph } from './graph.js';
import { showContainerDetails } from './details.js';
import { setupTooltip, hideTooltip, showStatusMessage } from './ui.js';
import { positionActionPanel } from './nodes.js';

// Set up event handlers
export function setupEventHandlers() {
    // Set up container node click event
    setupContainerClickEvent();
    
    // Set up tooltip hover events
    setupTooltipEvents();
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Set up window resize event
    setupResizeEvent();
    
    // Test API connectivity
    testApiConnectivity();
}

// Setup container node click event
function setupContainerClickEvent() {
    const cy = getGraph();
    if (!cy) return;
    
    // Node click event for container nodes
    cy.on('tap', 'node.container', function(event) {
        const node = event.target;
        const containerData = node.data('containerData');
        if (containerData) {
            showContainerDetails(cy, containerData, node);
        }
    });
}

// Setup tooltip hover events
function setupTooltipEvents() {
    const cy = getGraph();
    if (!cy) return;
    
    // Show tooltip on node hover
    cy.on('mouseover', 'node.container', function(event) {
        const node = event.target;
        const containerData = node.data('containerData');
        
        if (containerData) {
            const content = `
                <strong>${containerData.name}</strong><br>
                <small>${containerData.image}</small><br>
                Status: ${containerData.status}
            `;
            
            const renderedPosition = node.renderedPosition();
            const nodeWidth = node.renderedWidth();
            
            setupTooltip(
                content, 
                renderedPosition.x + (nodeWidth / 2) + 10, 
                renderedPosition.y
            );
        }
    });
    
    // Show tooltip on edge hover
    cy.on('mouseover', 'edge', function(event) {
        const edge = event.target;
        const networkName = edge.data('networkName');
        
        if (networkName) {
            const content = `Network: ${networkName}`;
            const renderedMidpoint = edge.renderedMidpoint();
            
            setupTooltip(content, renderedMidpoint.x, renderedMidpoint.y);
        }
    });
    
    // Hide tooltip on mouseout
    cy.on('mouseout', 'node, edge', function() {
        hideTooltip();
    });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // ESC key to close details
        if (event.key === 'Escape') {
            const cy = getGraph();
            if (cy && cy.getElementById('details').length > 0) {
                cy.remove('#details');
                cy.remove('#details-edge');
            }
        }
        
        // F key to fit all elements
        if (event.key === 'f' || event.key === 'F') {
            const cy = getGraph();
            if (cy) {
                cy.fit(cy.elements(), 50);
            }
        }
        
        // R to refresh
        if (event.key === 'r' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            updateGraph();
            showStatusMessage('Refreshing containers...', 'info');
        }
    });
}

// Setup window resize event
function setupResizeEvent() {
    window.addEventListener('resize', function() {
        // Reposition action panel if it exists
        if (document.getElementById('action-panel')) {
            positionActionPanel();
        }
    });
}

// Test API connectivity
async function testApiConnectivity() {
    try {
        console.log('Testing API connectivity...');
        const response = await fetch('/api/status');
        if (response.ok) {
            const data = await response.json();
            console.log('API connectivity test successful:', data);
            showStatusMessage(`API connected - Server version: ${data.version}`, 'success');
        } else {
            console.error('API status check failed:', response.status, response.statusText);
            showStatusMessage('API connection failed - Check console for details', 'error');
        }
    } catch (error) {
        console.error('API connectivity test error:', error);
        showStatusMessage('API connection error - Check console for details', 'error');
    }
} 