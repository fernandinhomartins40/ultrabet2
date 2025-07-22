const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const crypto = require('crypto');
const Docker = require('dockerode');

const app = express();
const docker = new Docker();
const PORT = process.env.PORT || 5000;
const VPS_IP = process.env.VPS_IP || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());

// Data storage path - usar variáveis de ambiente em produção
const DATA_FILE = process.env.DATA_PATH 
  ? path.join(process.env.DATA_PATH, 'instances.json')
  : path.join(__dirname, '../data/instances.json');

const DOCKER_PATH = process.env.DOCKER_PATH || path.join(__dirname, '../../docker');

// Ensure data directory exists
const dataDir = process.env.DATA_PATH || path.join(__dirname, '../data');
fs.ensureDirSync(dataDir);

// Initialize data file if not exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeJsonSync(DATA_FILE, { instances: [] });
}

// Port management
const MIN_PORT = 3000;
const MAX_PORT = 9999;

// Get all instances
async function getInstances() {
  const data = await fs.readJson(DATA_FILE);
  return data.instances || [];
}

// Save instances
async function saveInstances(instances) {
  await fs.writeJson(DATA_FILE, { instances }, { spaces: 2 });
}

// Get next available port
async function getNextAvailablePort() {
  const instances = await getInstances();
  const usedPorts = instances.map(i => i.port);
  
  for (let port = MIN_PORT; port <= MAX_PORT; port++) {
    if (!usedPorts.includes(port)) {
      return port;
    }
  }
  throw new Error('No available ports');
}

// Generate JWT secret
function generateJWTSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// Execute generate.bash script
function executeGenerateBash(projectName, port, jwtSecret, hostIp) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      INSTANCE_ID: projectName,
      JWT_SECRET: jwtSecret,
      KONG_HTTP_PORT: port,
      API_EXTERNAL_URL: `http://${hostIp}:${port}`,
      SITE_URL: `http://${hostIp}:3000`,
      SUPABASE_PUBLIC_URL: `http://${hostIp}:${port}`,
      DASHBOARD_USERNAME: 'admin',
      DASHBOARD_PASSWORD: 'admin',
      // Generate unique ports for other services
      POSTGRES_PORT_EXT: `54${Math.floor(Math.random() * 90) + 10}`,
      KONG_HTTPS_PORT: `84${Math.floor(Math.random() * 90) + 10}`,
      ANALYTICS_PORT: `40${Math.floor(Math.random() * 90) + 10}`
    };

    const generateProcess = spawn('bash', ['generate.bash'], {
      cwd: DOCKER_PATH,
      env
    });

    let output = '';
    let error = '';

    generateProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`[generate.bash]: ${data}`);
    });

    generateProcess.stderr.on('data', (data) => {
      error += data.toString();
      console.error(`[generate.bash error]: ${data}`);
    });

    generateProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`generate.bash exited with code ${code}: ${error}`));
      } else {
        resolve({ output, error });
      }
    });
  });
}

// Get container status
async function getContainerStatus(instanceId) {
  try {
    const containers = await docker.listContainers({ all: true });
    const instanceContainers = containers.filter(c => 
      c.Names.some(name => name.includes(instanceId))
    );
    
    if (instanceContainers.length === 0) return 'stopped';
    
    const allRunning = instanceContainers.every(c => c.State === 'running');
    const someRunning = instanceContainers.some(c => c.State === 'running');
    
    if (allRunning) return 'running';
    if (someRunning) return 'partial';
    return 'stopped';
  } catch (error) {
    console.error('Error checking container status:', error);
    return 'unknown';
  }
}

// Routes

// Get all instances
app.get('/api/instances', async (req, res) => {
  try {
    const instances = await getInstances();
    
    // Update status for each instance
    const instancesWithStatus = await Promise.all(
      instances.map(async (instance) => {
        const status = await getContainerStatus(instance.id);
        return { ...instance, status };
      })
    );
    
    res.json(instancesWithStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new instance
app.post('/api/instances', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    // Check if name already exists
    const instances = await getInstances();
    if (instances.some(i => i.name === name)) {
      return res.status(400).json({ error: 'Project name already exists' });
    }
    
    // Generate unique values
    const port = await getNextAvailablePort();
    const jwtSecret = generateJWTSecret();
    const instanceId = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const hostIp = req.body.hostIp || VPS_IP; // Get from frontend or use VPS IP
    
    // Execute generate.bash
    console.log('Executing generate.bash for instance:', instanceId);
    await executeGenerateBash(instanceId, port, jwtSecret, hostIp);
    
    // Create instance record
    const newInstance = {
      id: instanceId,
      name,
      port,
      jwt_secret: jwtSecret,
      created_at: new Date().toISOString(),
      studio_url: `http://${hostIp}:${port}`,
      status: 'running'
    };
    
    // Save to instances
    instances.push(newInstance);
    await saveInstances(instances);
    
    res.json(newInstance);
  } catch (error) {
    console.error('Error creating instance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start instance
app.post('/api/instances/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const instances = await getInstances();
    const instance = instances.find(i => i.id === id);
    
    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }
    
    // Start containers using docker-compose
    const composeFile = path.join(DOCKER_PATH, `docker-compose-${id}.yml`);
    const envFile = path.join(DOCKER_PATH, `.env-${id}`);
    
    if (!fs.existsSync(composeFile)) {
      return res.status(404).json({ error: 'Instance configuration not found' });
    }
    
    const startProcess = spawn('docker', ['compose', '-f', composeFile, '--env-file', envFile, 'up', '-d'], {
      cwd: DOCKER_PATH
    });
    
    startProcess.on('close', (code) => {
      if (code === 0) {
        res.json({ message: 'Instance started successfully' });
      } else {
        res.status(500).json({ error: 'Failed to start instance' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop instance
app.post('/api/instances/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const instances = await getInstances();
    const instance = instances.find(i => i.id === id);
    
    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }
    
    // Stop containers using docker-compose
    const composeFile = path.join(DOCKER_PATH, `docker-compose-${id}.yml`);
    const envFile = path.join(DOCKER_PATH, `.env-${id}`);
    
    if (!fs.existsSync(composeFile)) {
      return res.status(404).json({ error: 'Instance configuration not found' });
    }
    
    const stopProcess = spawn('docker', ['compose', '-f', composeFile, '--env-file', envFile, 'down'], {
      cwd: DOCKER_PATH
    });
    
    stopProcess.on('close', (code) => {
      if (code === 0) {
        res.json({ message: 'Instance stopped successfully' });
      } else {
        res.status(500).json({ error: 'Failed to stop instance' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete instance
app.delete('/api/instances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const instances = await getInstances();
    const instanceIndex = instances.findIndex(i => i.id === id);
    
    if (instanceIndex === -1) {
      return res.status(404).json({ error: 'Instance not found' });
    }
    
    // Stop and remove containers
    const composeFile = path.join(DOCKER_PATH, `docker-compose-${id}.yml`);
    const envFile = path.join(DOCKER_PATH, `.env-${id}`);
    
    if (fs.existsSync(composeFile)) {
      await new Promise((resolve, reject) => {
        const removeProcess = spawn('docker', ['compose', '-f', composeFile, '--env-file', envFile, 'down', '-v'], {
          cwd: DOCKER_PATH
        });
        
        removeProcess.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error('Failed to remove containers'));
        });
      });
    }
    
    // Remove files
    try {
      await fs.remove(composeFile);
      await fs.remove(envFile);
      await fs.remove(path.join(DOCKER_PATH, `volumes-${id}`));
    } catch (error) {
      console.error('Error removing files:', error);
    }
    
    // Remove from instances
    instances.splice(instanceIndex, 1);
    await saveInstances(instances);
    
    res.json({ message: 'Instance deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get server info
app.get('/api/info', (req, res) => {
  res.json({
    version: '1.0.0',
    dockerPath: DOCKER_PATH,
    platform: process.platform
  });
});

app.listen(PORT, () => {
  console.log(`Supabase Panel Backend running on port ${PORT}`);
}); 