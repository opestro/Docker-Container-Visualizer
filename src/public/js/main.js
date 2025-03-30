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
                            `📦 ${data.name}`,
                            `🚦 ${data.state}`,
                            `🏷️ ${data.image.split(':')[0]}`
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
                    'text-background-opacity': 0,
                    'font-family': 'Consolas',
                    'padding': '10px',
                    'text-margin-y': 0
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
                    'text-halign': 'center',
                    'text-background-opacity': 0,
                    'padding': '25px',
                    'text-margin-x': 0,
                    'text-margin-y': 0,
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

    // Determine which actions are available based on container state
    const isRunning = container.state.toLowerCase() === 'running';
    const isPaused = container.state.toLowerCase() === 'paused';
    const isStopped = container.state.toLowerCase() === 'exited';
    
    // Create action buttons section
    const actionButtons = [
        `🎮 Actions:`,
        isRunning ? `  • ⏸️ [Pause]` : ``,
        isPaused ? `  • ▶️ [Resume]` : ``,
        isRunning || isPaused ? `  • ⏹️ [Stop]` : ``,
        isStopped ? `  • ▶️ [Start]` : ``,
        `  • 🔄 [Restart]`,
        `  • 🗑️ [Remove]`
    ].filter(btn => btn !== ``).join('\n');

    // Format the details content with emojis
    const detailsContent = [
        `🔍 Container Details`,
        `━━━━━━━━━━━━━━━━━━━`,
        `🆔 ID: ${container.id}`,
        `📝 Name: ${container.name}`,
        `🖼️ Image: ${container.image}`,
        `⚡ Status: ${container.status}`,
        ``,
        `${actionButtons}`,
        ``,
        `🌐 Networks:`,
        ...Object.entries(container.networks || {}).map(([name, details]) => 
            `  • ${name} (IP: ${details.IPAddress})`
        ),
        ``,
        `🔌 Ports:`,
        ...(container.ports || []).map(port => 
            `  • ${port.PublicPort ? `${port.PublicPort}:` : ''}${port.PrivatePort}/${port.Type}`
        )
    ].join('\n');

    // Add details node with positioning
    const position = {
        x: sourceNode.position('x') + 350,
        y: sourceNode.position('y')
    };

    // Add the node
    detailsNode = cy.add([
        {
            group: 'nodes',
            data: { 
                id: 'details',
                label: detailsContent,
                containerData: container
            },
            classes: 'details',
            position: position
        },
        {
            group: 'edges',
            data: {
                id: 'details-edge',
                source: sourceNode.id(),
                target: 'details'
            }
        }
    ]);

    // Add styling for details node
    cy.style()
        .selector('node.details')
        .style({
            'text-wrap': 'wrap',
            'text-max-width': 300,
            'text-valign': 'center',
            'text-halign': 'center',
            'height': 450,  // Increased height to fit action buttons
            'width': 350,
            'shape': 'round-rectangle',
            'background-color': '#1A2942',
            'border-color': '#5C7AEA',
            'border-width': 2,
            'padding': 20,
            'font-size': 14,
            'text-margin-y': 0,
            'font-family': 'Consolas, monospace',
            'color': '#ffffff',
            'text-outline-width': 0,
            'text-outline-opacity': 0
        })
        .update();

    // Add click handler for details node to handle button clicks
    cy.on('tap', 'node.details', function(evt) {
        const node = evt.target;
        const containerData = node.data('containerData');
        
        // Get click position relative to node content
        const evtPos = evt.position;
        const nodePos = node.position();
        const relY = evtPos.y - nodePos.y + 225; // Approximate center offset
        
        // Calculate which line was clicked (rough estimate)
        const lineHeight = 18; // Approximate line height
        const clickedLine = Math.floor(relY / lineHeight);
        
        // Check if click is in the actions section (lines 8-14 approximately)
        if (clickedLine >= 8 && clickedLine <= 14) {
            handleActionButtonClick(containerData, clickedLine - 8);
        }
    });

    // Fit to show both nodes
    cy.fit(cy.collection([sourceNode, detailsNode]), 50);
}

// Handle container action button clicks
function handleActionButtonClick(container, buttonIndex) {
    // Get container ID
    const containerId = container.id;
    
    // Determine which button was clicked
    const actionMap = {
        1: 'pause',
        2: 'resume',
        3: 'stop',
        4: 'start',
        5: 'restart',
        6: 'remove'
    };
    
    const action = actionMap[buttonIndex];
    if (!action) return;
    
    console.log(`Executing ${action} on container ${container.name}`);
    
    // Make API call to perform the action
    fetch(`/api/containers/${containerId}/${action}`, {
        method: 'POST'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to ${action} container`);
        }
        return response.json();
    })
    .then(data => {
        console.log(`Container ${action} successful:`, data);
        // Refresh the graph after a short delay
        setTimeout(updateGraph, 1000);
    })
    .catch(error => {
        console.error(`Error ${action} container:`, error);
        alert(`Failed to ${action} container: ${error.message}`);
    });
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
