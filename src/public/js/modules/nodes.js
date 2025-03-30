// Nodes Module - Handles node creation and styling
import { setupContainerActions } from './actions.js';

// Generate HTML for container node
function generateContainerHTML(container) {
    const state = container.state.toLowerCase();
    
    return `
        <div class="node-container ${state}">
            <div class="node-name">${container.name}</div>
            <div class="node-status">
                <span class="status-badge ${state}"></span>
                ${container.status}
            </div>
            <div class="node-image">${container.image}</div>
        </div>
    `;
}

// Get color based on container state
export function getStateColor(state) {
    const colorMap = {
        running: '#00C39A',  // Green
        exited: '#E74856',   // Red
        created: '#60CDFF',  // Blue
        paused: '#FFB900'    // Yellow
    };
    return colorMap[state.toLowerCase()] || '#CCCCCC';
}

// Create a container node
export function createNode(container, position) {
    const state = container.state.toLowerCase();
    
    return {
        data: {
            id: container.id,
            containerData: container,
            bgColor: '#2A2A42',
            borderColor: getStateColor(state),
            state: state,
            html: generateContainerHTML(container)
        },
        classes: 'container',
        position: position || undefined
    };
}

// Generate HTML for details node
function generateDetailsHTML(container) {
    const state = container.state.toLowerCase();
    
    // Generate networks
    const networks = Object.entries(container.networks || {}).map(([name, details]) => `
        <div class="network-item">
            <div class="network-name">${name}</div>
            <div class="network-details">IP: ${details.IPAddress}</div>
            ${details.Gateway ? `<div class="network-details">Gateway: ${details.Gateway}</div>` : ''}
        </div>
    `).join('');
    
    // Generate ports
    const ports = (container.ports || []).map(port => `
        <div class="port-item">
            <div class="port-mapping">${port.PublicPort ? `${port.PublicPort}:` : ''}${port.PrivatePort}/${port.Type}</div>
        </div>
    `).join('');
    
    return `
        <div class="node-details">
            <div class="node-details-header">
                <div class="node-details-title">
                    <i class="fas fa-cube"></i> Container Details
                </div>
            </div>
            <div class="node-details-content">
                <div class="detail-section">
                    <div class="detail-section-title"><i class="fas fa-info-circle"></i> Basic Info</div>
                    <div class="detail-row">
                        <div class="detail-label">ID</div>
                        <div class="detail-value">${container.id}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Name</div>
                        <div class="detail-value">${container.name}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Image</div>
                        <div class="detail-value">${container.image}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Status</div>
                        <div class="detail-value">${container.status}</div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <div class="detail-section-title"><i class="fas fa-network-wired"></i> Networks</div>
                    ${networks || '<div class="no-data">No networks attached</div>'}
                </div>
                
                <div class="detail-section">
                    <div class="detail-section-title"><i class="fas fa-plug"></i> Ports</div>
                    ${ports || '<div class="no-data">No ports exposed</div>'}
                </div>
            </div>
        </div>
    `;
}

// Create a details node
export function createDetailsNode(cy, container, sourceNode) {
    // Calculate position
    const position = {
        x: sourceNode.position('x') + 350,
        y: sourceNode.position('y')
    };
    
    // Calculate dynamic height based on content
    const networkCount = Object.keys(container.networks || {}).length;
    const portCount = (container.ports || []).length;
    // Base height + networks + ports + actions
    const height = 400 + (Math.max(networkCount, 1) * 50) + (Math.max(portCount, 1) * 50);
    
    // Create the node
    const detailsNode = cy.add([
        {
            group: 'nodes',
            data: {
                id: 'details',
                html: generateDetailsHTML(container),
                bgColor: '#242438',
                borderColor: '#0078D7',
                height: height,
                containerId: container.id
            },
            classes: 'details',
            position: position
        },
        {
            group: 'edges',
            data: {
                id: 'details-edge',
                source: sourceNode.id(),
                target: 'details',
                color: '#0078D7'
            },
            classes: 'details-edge'
        }
    ]);
    
    // Create actual DOM buttons outside of Cytoscape for the actions
    createActionButtons(container);
    
    // Return the created node
    return detailsNode;
}

// Create actual DOM buttons outside of Cytoscape
function createActionButtons(container) {
    // First, remove any existing action panel
    removeActionButtons();
    
    // Create the action panel
    const actionPanel = document.createElement('div');
    actionPanel.id = 'action-panel';
    actionPanel.className = 'action-panel';
    
    // Get container state
    const state = container.state.toLowerCase();
    const isRunning = state === 'running';
    const isPaused = state === 'paused';
    const isStopped = state === 'exited';
    
    // Create the title
    const title = document.createElement('div');
    title.className = 'action-panel-title';
    title.innerHTML = `<i class="fas fa-sliders-h"></i> Quick Actions`;
    actionPanel.appendChild(title);
    
    // Create the buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'action-panel-buttons';
    
    // Primary actions depending on state
    if (isRunning) {
        addButton(buttonsContainer, 'stop', container.id, '<i class="fas fa-stop"></i> Stop');
        addButton(buttonsContainer, 'pause', container.id, '<i class="fas fa-pause"></i> Pause');
    } else if (isPaused) {
        addButton(buttonsContainer, 'resume', container.id, '<i class="fas fa-play"></i> Resume');
        addButton(buttonsContainer, 'stop', container.id, '<i class="fas fa-stop"></i> Stop');
    } else if (isStopped) {
        addButton(buttonsContainer, 'start', container.id, '<i class="fas fa-play"></i> Start');
        addButton(buttonsContainer, 'remove', container.id, '<i class="fas fa-trash-alt"></i> Remove');
    }
    
    // Always add restart (but put it at the end if we have state-specific actions)
    addButton(buttonsContainer, 'restart', container.id, '<i class="fas fa-sync-alt"></i> Restart');
    
    // Add the buttons container to the panel
    actionPanel.appendChild(buttonsContainer);
    
    // Add the panel to the document
    document.body.appendChild(actionPanel);
    
    // Position the panel
    positionActionPanel();
}

// Helper to add a button to the container
function addButton(container, action, containerId, html) {
    const button = document.createElement('button');
    button.className = `real-action-button ${action}`;
    button.setAttribute('data-action', action);
    button.setAttribute('data-id', containerId);
    button.innerHTML = html;
    
    // Add click event listener directly to this DOM element
    button.addEventListener('click', async function() {
        try {
            // Visual feedback
            button.disabled = true;
            button.style.opacity = '0.5';
            
            // Show status
            showStatusMessage(`Executing ${action} on container...`, 'info');
            
            // Make the API call
            const response = await fetch(`/api/containers/${containerId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Handle the response
            if (!response.ok) {
                throw new Error(`Failed to ${action} container: ${response.status}`);
            }
            
            // Success
            showStatusMessage(`Successfully executed ${action}`, 'success');
            
            // Refresh the graph after a delay
            setTimeout(() => updateGraph(), 1000);
        } catch (error) {
            console.error(`Error executing ${action}:`, error);
            showStatusMessage(`Error: ${error.message}`, 'error');
        } finally {
            // Re-enable the button
            button.disabled = false;
            button.style.opacity = '1';
        }
    });
    
    container.appendChild(button);
}

// Remove action buttons
export function removeActionButtons() {
    const existingPanel = document.getElementById('action-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
}

// Position the action panel
export function positionActionPanel() {
    const panel = document.getElementById('action-panel');
    const cy = getGraph();
    
    if (panel && cy) {
        const detailsNode = cy.getElementById('details');
        if (detailsNode.length) {
            const position = detailsNode.renderedPosition();
            const height = detailsNode.height();
            const width = detailsNode.width();
            const zoom = cy.zoom();
            
            // Position it below the details node
            panel.style.position = 'absolute';
            panel.style.left = `${position.x - (panel.offsetWidth / 2) + (width / 2 * zoom)}px`;
            panel.style.top = `${position.y + (height / 2 * zoom) + 20}px`;
            panel.style.zIndex = '1000';
            
            // Make sure it doesn't go offscreen
            const rect = panel.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                panel.style.left = `${window.innerWidth - panel.offsetWidth - 20}px`;
            }
            if (rect.bottom > window.innerHeight) {
                // If it would go off the bottom, put it in the bottom right corner instead
                panel.style.left = `${window.innerWidth - panel.offsetWidth - 20}px`;
                panel.style.top = `${window.innerHeight - panel.offsetHeight - 20}px`;
            }
            if (rect.left < 0) {
                panel.style.left = '20px';
            }
        }
    }
}

// Import missing functions
import { getGraph } from './graph.js';
import { updateGraph } from './graph.js';
import { showStatusMessage } from './ui.js'; 