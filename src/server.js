const express = require('express');
const Docker = require('dockerode');
const path = require('path');
const cors = require('cors');

const app = express();
const docker = new Docker({ socketPath: '//./pipe/docker_engine' });

// Enable CORS for all routes with more permissive settings
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Logging middleware for debugging API requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Get all containers with their details
app.get('/api/containers', async (req, res) => {
    try {
        console.log('Fetching all containers...');
        const containers = await docker.listContainers({ all: true });
        const containersWithDetails = await Promise.all(
            containers.map(async (container) => {
                const containerInfo = await docker.getContainer(container.Id).inspect();
                return {
                    id: container.Id,
                    name: container.Names[0].replace('/', ''),
                    image: container.Image,
                    state: container.State,
                    status: container.Status,
                    networks: containerInfo.NetworkSettings.Networks,
                    ports: container.Ports,
                    created: container.Created
                };
            })
        );
        console.log(`Returning ${containersWithDetails.length} containers`);
        res.json(containersWithDetails);
    } catch (error) {
        console.error('Error fetching containers:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get detailed info for a specific container
app.get('/api/containers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Fetching details for container ${id}`);
        const container = docker.getContainer(id);
        const info = await container.inspect();
        console.log(`Successfully fetched details for container ${id}`);
        res.json(info);
    } catch (error) {
        console.error(`Error fetching container ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Perform actions on containers
app.post('/api/containers/:id/:action', async (req, res) => {
    const { id, action } = req.params;
    
    try {
        console.log(`Executing action "${action}" on container ${id}`);
        const container = docker.getContainer(id);
        
        switch(action) {
            case 'start':
                console.log(`Starting container ${id}`);
                await container.start();
                break;
            case 'stop':
                console.log(`Stopping container ${id}`);
                await container.stop();
                break;
            case 'restart':
                console.log(`Restarting container ${id}`);
                await container.restart();
                break;
            case 'pause':
                console.log(`Pausing container ${id}`);
                await container.pause();
                break;
            case 'resume':
                console.log(`Resuming container ${id}`);
                await container.unpause();
                break;
            case 'remove':
                console.log(`Removing container ${id}`);
                await container.remove({ force: true });
                break;
            default:
                console.log(`Invalid action "${action}" requested for ${id}`);
                return res.status(400).json({ error: 'Invalid action' });
        }
        
        console.log(`Successfully executed "${action}" on container ${id}`);
        res.json({ success: true, action, id });
    } catch (error) {
        console.error(`Error executing ${action} on container ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Server status endpoint
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Handle 404s
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});