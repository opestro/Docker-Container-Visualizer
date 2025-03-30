// Graph visualization module
import { getStateColor, createNode, createDetailsNode } from './nodes.js';
import { removeDetailsNode } from './details.js';
import { setupContainerActions } from './actions.js';

// Cytoscape instance
let cy = null;
let lastZoom = undefined;
let lastPan = undefined;

// Initialize the graph
export function initGraph() {
    return new Promise((resolve, reject) => {
        try {
            cy = cytoscape({
                container: document.getElementById('network'),
                style: [
                    {
                        selector: 'node.container',
                        style: {
                            'width': 250,
                            'height': 80,
                            'shape': 'round-rectangle',
                            'ghost': 'yes',
                            'ghost-opacity': 0.2,
                            'ghost-offset-x': 5,
                            'ghost-offset-y': 5
                        }
                    },
                    {
                        selector: 'node.details',
                        style: {
                            'width': 380,
                            'height': 'data(height)',
                            'shape': 'round-rectangle',
                            'ghost': 'yes',
                            'ghost-opacity': 0.2,
                            'ghost-offset-x': 5,
                            'ghost-offset-y': 5
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'line-color': 'data(color)',
                            'target-arrow-color': 'data(color)',
                            'source-arrow-color': 'data(color)',
                            'width': 2,
                            'curve-style': 'bezier',
                            'target-arrow-shape': 'triangle',
                            'source-arrow-shape': 'none',
                            'line-style': 'dashed',
                            'label': 'data(networkName)',
                            'font-size': '12px',
                            'color': '#FFFFFF',
                            'text-background-color': 'var(--primary-dark)',
                            'text-background-opacity': 1,
                            'text-background-padding': 4,
                            'text-background-shape': 'round-rectangle',
                            'text-margin-y': -10,
                            'text-halign': 'center',
                            'text-valign': 'center',
                            'text-wrap': 'wrap',
                            'text-max-width': 80
                        }
                    },
                    {
                        selector: 'edge.details-edge',
                        style: {
                            'line-style': 'dashed',
                            'target-arrow-shape': 'none'
                        }
                    }
                ],
                layout: {
                    name: 'grid',
                    padding: 30
                },
                minZoom: 0.2,
                maxZoom: 3,
                wheelSensitivity: 0.2,
                autoungrabify: false,
                handleNodeTapEvents: false
            });

            // Initialize HTML labels - use the global variable directly
            cy.nodeHtmlLabel([
                {
                    query: 'node.container',
                    halign: 'center',
                    valign: 'center',
                    halignBox: 'center',
                    valignBox: 'center',
                    tpl: function(data) {
                        return data.html;
                    },
                    cssClass: 'cy-node-html-label-interact'
                },
                {
                    query: 'node.details',
                    halign: 'center',
                    valign: 'center',
                    halignBox: 'center',
                    valignBox: 'center',
                    tpl: function(data) {
                        return data.html;
                    },
                    cssClass: 'cy-node-html-label-interact'
                }
            ]);

            // Set up action buttons
            setupContainerActions();

            // Save zoom/pan on changes
            cy.on('zoom pan', () => {
                lastZoom = cy.zoom();
                lastPan = cy.pan();
            });

            // Click on background to remove details node
            cy.on('tap', (event) => {
                if (event.target === cy) {
                    removeDetailsNode(cy);
                }
            });

            updateGraph().then(() => resolve()).catch(reject);
        } catch (error) {
            reject(error);
        }
    });
}

// Update the graph with latest container data
export async function updateGraph() {
    try {
        // Save current positions
        const positions = {};
        if (cy) {
            cy.nodes().forEach(node => {
                positions[node.id()] = node.position();
            });
        }

        // Fetch containers
        const response = await fetch('/api/containers');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const containers = await response.json();

        // Create elements
        const elements = {
            nodes: containers.map(container => 
                createNode(container, positions[container.id])
            ),
            edges: []
        };

        // Create edges for shared networks
        containers.forEach(container => {
            Object.keys(container.networks || {}).forEach(networkName => {
                containers.forEach(otherContainer => {
                    if (container.id !== otherContainer.id && 
                        otherContainer.networks && 
                        otherContainer.networks[networkName]) {
                        elements.edges.push({
                            data: {
                                id: `${container.id}-${otherContainer.id}-${networkName}`,
                                source: container.id,
                                target: otherContainer.id,
                                networkName: networkName.split('_').pop(),
                                color: 'var(--primary)'
                            }
                        });
                    }
                });
            });
        });

        // Update the graph
        if (cy) {
            // Get any open details node ID before removing elements
            const detailsNode = cy.nodes('.details')[0];
            const sourceNodeId = detailsNode ? 
                cy.edges(`[target = "${detailsNode.id()}"]`).source().id() : null;

            // Remove existing elements
            cy.elements().remove();
            
            // Add new elements
            cy.add(elements);
            
            // Restore zoom and pan
            if (lastZoom !== undefined && lastPan !== undefined) {
                cy.viewport({
                    zoom: lastZoom,
                    pan: lastPan
                });
            }
            
            // Only run layout if no positions exist
            if (Object.keys(positions).length === 0) {
                cy.layout({
                    name: 'cose',
                    animate: true,
                    animationDuration: 500,
                    nodeSpacing: 150,
                    padding: 50,
                    componentSpacing: 150,
                    nodeRepulsion: 8000
                }).run();
            }
            
            // If there was a details node, recreate it
            if (sourceNodeId) {
                const sourceNode = cy.getElementById(sourceNodeId);
                const containerData = sourceNode.data('containerData');
                if (containerData) {
                    createDetailsNode(cy, containerData, sourceNode);
                }
            }
        }

        return containers;
    } catch (error) {
        console.error('Error updating graph:', error);
        throw error;
    }
}

// Get the Cytoscape instance
export function getGraph() {
    return cy;
} 