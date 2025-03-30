const express = require('express');
const Docker = require('dockerode');
const path = require('path');
const cors = require('cors');

const app = express();
const docker = new Docker({ socketPath: '//./pipe/docker_engine' });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Get all containers with their details
app.get('/api/containers', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: true });
        const containersWithDetails = await Promise.all(
            containers.map(async (container) => {
                const containerInfo = await docker.getContainer(container.Id).inspect();
                return {
                    id: container.Id.substring(0, 12),
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
        res.json(containersWithDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Add this after your other routes
app.get('/api/test', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: true });
        console.log('Found containers:', containers.length);
        res.json({ count: containers.length });
    } catch (error) {
        console.error('Docker error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});