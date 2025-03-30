// Store the Cytoscape instance
let cy = null;
let detailsNode = null;
let lastZoom = undefined;
let lastPan = undefined;

function initializeGraph() {
    cy = cytoscape({
        container: document.getElementById('network'),
        style: [
            {
                selector: 'node.container',
                style: {
                    'label': function (ele) {
                        const data = ele.data('containerData');
                        return [
                            `Name: ${data.name}`,
                            `Status: ${data.state}`,
                            `Image: ${data.image.split(':')[0]}`
                        ].join('\n');
                    },
                    'background-color': '#2B3A67',
                    'border-color': '#5C7AEA',
                    'border-width': 2,
                    'width': 250,
                    'height': 80,
                    'shape': 'round-rectangle',
                    'text-wrap': 'wrap',
                    'text-max-width': 230,
                    'font-size': 12,
                    'color': '#ffffff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-family': 'Consolas',
                    'padding': '10px',
                    'border-radius': 10,
                    'box-shadow': '0 0 10px #5C7AEA'
                }
            },
            {
                selector: 'node.details',
                style: {
                    'label': 'data(label)',
                    'background-color': '#1A2942',
                    'border-color': '#5C7AEA',
                    'border-width': 2,
                    'width': 350,
                    'height': 'auto',
                    'shape': 'round-rectangle',
                    'text-wrap': 'wrap',
                    'text-max-width': 330,
                    'font-size': 13,
                    'color': '#ffffff',
                    'text-valign': 'center',
                    'text-halign': 'left',
                    'padding': '25px',
                    'border-radius': 10,
                    'box-shadow': '0 0 15px #5C7AEA',
                    'text-margin-x': 10,
                    'text-margin-y': 10,
                    'font-family': 'Consolas, monospace'
                }
            },
            {
                selector: 'edge',
                style: {
                    'label': 'data(label)',
                    'width': 2,
                    'line-color': '#5C7AEA',
                    'target-arrow-color': '#5C7AEA',
                    'source-arrow-color': '#5C7AEA',
                    'target-arrow-shape': 'triangle',
                    'source-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'font-size': 10,
                    'color': '#5C7AEA',
                    'text-background-color': '#1E1E1E',
                    'text-background-opacity': 1,
                    'text-background-padding': 3
                }
            }
        ],
        minZoom: 0.2,
        maxZoom: 3,
        wheelSensitivity: 0.2
    });

    // Save zoom/pan on changes
    cy.on('zoom pan', (evt) => {
        lastZoom = cy.zoom();
        lastPan = cy.pan();
    });

    // Add click handler for nodes
    cy.on('tap', 'node.container', function (evt) {
        const node = evt.target;
        const containerData = node.data('containerData');
        if (containerData) {
            showContainerDetailsAsNode(containerData, node);
        }
    });

    // Click on background to remove details node
    cy.on('tap', function (evt) {
        if (evt.target === cy) {
            removeDetailsNode();
        }
    });
}

function getStateColor(state) {
    const colors = {
        running: '#2B3A67',
        exited: '#34495E',
        created: '#2C3E50',
        paused: '#283747'
    };
    return colors[state.toLowerCase()] || '#1A2942';
}

function showContainerDetailsAsNode(container, sourceNode) {
    // Remove existing details node if any
    if (detailsNode) {
        cy.remove('#details');
        cy.remove('#details-edge');
    }

    // Calculate position based on viewport
    const viewport = cy.extent();
    const sourcePos = sourceNode.position();
    let xOffset = 350;
    let yOffset = 0;

    // Check if placing to the right would go off screen
    if (sourcePos.x + xOffset > viewport.x2) {
        xOffset = -350; // Place to the left instead
    }

    // Format the details content with better spacing
    const detailsContent = [
        `🔍 Container Details`,
        `━━━━━━━━━━━━━━━━━━`,
        `📌 ID: ${container.id}`,
        `📝 Name: ${container.name}`,
        `🖼️ Image: ${container.image}`,
        `⚡ Status: ${container.status}`,
        ``,
        `🌐 Networks:`,
        ...Object.entries(container.networks || {}).map(([name, details]) =>
            `   • ${name}\n     IP: ${details.IPAddress}\n     Gateway: ${details.Gateway}`
        ),
        ``,
        `🔌 Ports:`,
        ...(container.ports || []).map(port =>
            `   • ${port.PublicPort ? `${port.PublicPort}:` : ''}${port.PrivatePort}/${port.Type}`
        )
    ].join('\n');

    // Add details node with adjusted position
    detailsNode = cy.add([
        {
            group: 'nodes',
            data: {
                id: 'details',
                label: detailsContent
            },
            classes: 'details',
            position: {
                x: sourcePos.x + xOffset,
                y: sourcePos.y + yOffset
            }
        },
        {
            group: 'edges',
            data: {
                id: 'details-edge',
                source: sourceNode.id(),
                target: 'details'
            },
            classes: 'details-edge'
        }
    ]);

    // Add specific style for details edge
    cy.style().selector('.details-edge').style({
        'curve-style': 'bezier',
        'line-style': 'dashed',
        'line-color': '#5C7AEA',
        'width': 2,
        'target-arrow-shape': 'none',
        'source-arrow-shape': 'none'
    }).update();

    // Fit to show both nodes with padding
    cy.fit(cy.collection([sourceNode, detailsNode]), 100);
}

function removeDetailsNode() {
    if (detailsNode) {
        cy.remove('#details');
        cy.remove('#details-edge');
        detailsNode = null;
    }
}

async function updateGraph() {
    try {
        const response = await fetch('http://localhost:3001/api/containers');
        const containers = await response.json();

        // Save current positions if graph exists
        const positions = {};
        if (cy) {
            cy.nodes().forEach(node => {
                positions[node.id()] = node.position();
            });
        }

        const elements = {
            nodes: containers.map(container => ({
                data: {
                    id: container.id,
                    color: getStateColor(container.state),
                    containerData: container
                },
                classes: 'container',
                position: positions[container.id] // Restore position if exists
            })),
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
                                source: container.id,
                                target: otherContainer.id,
                                label: networkName.split('_').pop()
                            }
                        });
                    }
                });
            });
        });

        if (!cy) {
            initializeGraph();
            cy.add(elements);
            cy.layout({
                name: 'cose',
                animate: true,
                animationDuration: 500,
                nodeSpacing: 150,
                padding: 50,
                componentSpacing: 150,
                nodeRepulsion: 8000
            }).run();
        } else {
            // Update existing graph
            cy.elements().remove();
            cy.add(elements);

            // Restore zoom and pan if they exist
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
        }

    } catch (error) {
        console.error('Error fetching containers:', error);
    }
}

// Initial load
updateGraph();

// Refresh every 10 seconds
setInterval(updateGraph, 10000);
