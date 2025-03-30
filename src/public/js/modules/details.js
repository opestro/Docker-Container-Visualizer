// Container details module
import { createDetailsNode } from './nodes.js';
import { removeActionButtons } from './nodes.js';

// Show container details
export function showContainerDetails(cy, container, sourceNode) {
    // First remove any existing details node
    removeDetailsNode(cy);
    
    // Create the details node
    createDetailsNode(cy, container, sourceNode);
    
    // Fit view to include both nodes
    cy.fit(cy.collection([sourceNode, cy.getElementById('details')]), 50);
}

// Remove details node if it exists
export function removeDetailsNode(cy) {
    if (cy && cy.getElementById('details').length > 0) {
        // Remove Cytoscape elements
        cy.remove('#details');
        cy.remove('#details-edge');
        
        // Also remove the action panel from DOM
        removeActionButtons();
    }
}

// Get the source node connected to a details node
export function getSourceNode(cy, detailsNode) {
    if (cy && detailsNode) {
        const connectedEdges = cy.getElementById(detailsNode.id()).connectedEdges();
        if (connectedEdges.length > 0) {
            return connectedEdges[0].source();
        }
    }
    return null;
} 