const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db'); // Assuming this is your MongoDB connection setup
const authRoutes = require('./routes/authRoutes');
const energyRoutes = require('./routes/energyRoutes');
const anomalyRoutes = require('./routes/anomalyRoutes');
const personRoutes = require('./routes/personRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const robotRoutes = require('./routes/robotRoutes'); // Your existing robot API routes
const path = require('path');
const http = require('http');
const { Server } = require('socket.io'); // For communication with frontend clients
const httpProxy = require('http-proxy');
const mongoose = require('mongoose');
const WebSocket = require('ws'); // Standard WebSocket client for connecting to Python server

// --- FIX: STEP 1 of 3 ---
// This variable will act as our server's "long-term memory" for the map data.
let cachedMapData = null;
global.cachedMapData = cachedMapData;

// Load env vars
dotenv.config();

// Set node environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Define allowed origins for CORS
let allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5000').split(',').map(o => o.replace(/\/$/, ''));
// Always allow localhost:3000 and localhost:5000 for development
['http://localhost:3000', 'http://localhost:5000'].forEach(origin => {
    if (!allowedOrigins.includes(origin)) {
        allowedOrigins.push(origin);
    }
});

// Helper to normalize origins (protocol + host + port, no trailing slash)
function normalizeOrigin(origin) {
    try {
        if (!origin) return '';
        const url = new URL(origin);
        return url.origin; // protocol + host + port
    } catch (e) {
        return origin ? origin.replace(/\/$/, '') : '';
    }
}

const normalizedAllowedOrigins = allowedOrigins.map(normalizeOrigin);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        const normalizedOrigin = normalizeOrigin(origin);
        const match = normalizedAllowedOrigins.includes(normalizedOrigin);
        console.log(`[CORS] Incoming: ${origin} | Normalized: ${normalizedOrigin} | Allowed: ${match}`);
        if (!match) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            console.warn(msg);
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/people', personRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/robot', robotRoutes); // Keep your existing API routes for robot if any

// Basic route
app.get('/', (req, res) => {
    res.send('SolBot API is running...');
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);

// Socket.IO server for communication with frontend clients
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});
app.set('io', io); // Make io accessible in routes if needed

// --- WebSocket Connection to Python VM Server ---
const vmWsUrl = process.env.VM_WEBSOCKET_URL || 'ws://192.168.137.27:8766';
let vmSocket;
const reconnectInterval = 5000;
let reconnectTimer = null;
let robotIsConnected = false;
global.robotIsConnected = robotIsConnected;

function setRobotConnectionStatus(connected) {
    robotIsConnected = connected;
    global.robotIsConnected = robotIsConnected;
    io.emit('robot_connection_status', { connected });
}

function connectToVmWebSocket() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    console.log(`Attempting to connect to VM WebSocket server: ${vmWsUrl}`);
    vmSocket = new WebSocket(vmWsUrl);

    vmSocket.on('open', () => {
        console.log('Successfully connected to VM WebSocket server.');
        setRobotConnectionStatus(true);
    });

    vmSocket.on('message', (messageBuffer) => {
        try {
            const messageString = messageBuffer.toString();
            const dataFromVm = JSON.parse(messageString);

            if (dataFromVm.type === 'robot_update') {
                io.emit('robot_update', dataFromVm);
            } else if (dataFromVm.type === 'dynamic_map_update' || dataFromVm.type === 'static_map_data') {
                // --- FIX: STEP 2 of 3 ---
                // When we receive a map, we store it in our cache variable.
                console.log(`VM Message (${dataFromVm.type}): Caching and forwarding map data.`);
                cachedMapData = dataFromVm;
                global.cachedMapData = cachedMapData;
                // We also forward it to all currently connected clients.
                io.emit('dynamic_map_update', dataFromVm);
            } else if (dataFromVm.type === 'system_message') {
                console.log('VM System Message:', dataFromVm.data);
                io.emit('vm_system_message', dataFromVm);
            } else if (dataFromVm.type === 'mission_status') {
                console.log('Mission status update from VM:', dataFromVm);
                io.emit('mission_status', dataFromVm);
            } else {
                console.warn('Received unknown message type from VM:', dataFromVm.type);
            }
        } catch (error) {
            console.error('Error processing message from VM:', error.message);
            console.error('Raw message buffer from VM:', messageBuffer.toString());
        }
    });

    vmSocket.on('close', (code, reason) => {
        const reasonString = reason ? reason.toString() : 'No reason given';
        console.log(`Disconnected from VM WebSocket. Code: ${code}, Reason: "${reasonString}". Attempting to reconnect in ${reconnectInterval / 1000}s...`);
        setRobotConnectionStatus(false);
        vmSocket = null;
        if (!reconnectTimer) {
            reconnectTimer = setTimeout(connectToVmWebSocket, reconnectInterval);
        }
    });

    vmSocket.on('error', (error) => {
        console.error(`VM WebSocket connection error: ${error.message}`);
        if (vmSocket && vmSocket.readyState !== WebSocket.CLOSED && vmSocket.readyState !== WebSocket.CLOSING) {
            vmSocket.terminate();
        }
    });


}

connectToVmWebSocket();

// --- Socket.IO connection handling for frontend clients ---
io.on('connection', (socket) => {
    console.log('Frontend client connected via Socket.IO:', socket.id);

    socket.emit('robot_connection_status', { connected: robotIsConnected });

    // --- FIX: STEP 3 of 3 ---
    // If a map exists in our cache, send it immediately to the client that just connected.
    // This solves the "disappears on refresh" problem.
    if (cachedMapData) {
        console.log(`Sending cached map to new client ${socket.id}`);
        socket.emit('dynamic_map_update', cachedMapData);
    }

    socket.on('robot_command', (commandData) => {
        if (vmSocket && vmSocket.readyState === WebSocket.OPEN) {
            try {
                const messageToSend = JSON.stringify({ type: "robot_command", payload: commandData });
                vmSocket.send(messageToSend);
                console.log('Forwarded robot_command from frontend to VM:', commandData);
            } catch (error) {
                console.error('Error sending robot_command to VM:', error);
                socket.emit('robot_error_ack', {
                    success: false,
                    error: 'Failed to send command',
                    message: 'Could not serialize or send command to robot control system.'
                });
            }
        } else {
            console.error('Cannot forward robot_command: VM WebSocket not connected or not open.');
            socket.emit('robot_error_ack', {
                success: false,
                error: 'Robot control unavailable',
                message: 'Connection to robot control system is not available at the moment.'
            });
        }
    });

    socket.on('request_static_map', () => {
        if (vmSocket && vmSocket.readyState === WebSocket.OPEN) {
            console.log(`Frontend client ${socket.id} requested static map.`);
            socket.emit('system_message', { message: "Static map is typically sent on initial connection from VM. Re-request feature not fully implemented on VM side." });
        }
    });

    socket.on('disconnect', () => {
        console.log('Frontend client disconnected from Socket.IO:', socket.id);
    });
});

app.post('/api/start-mission', (req, res) => {
    const missionDataFromFrontend = req.body;
    console.log('Received start mission command from frontend:', missionDataFromFrontend);

    if (vmSocket && vmSocket.readyState === WebSocket.OPEN) {
        vmSocket.send(JSON.stringify(missionDataFromFrontend));
        console.log('Command forwarded to Python robot server.');
        if (missionDataFromFrontend.type === 'return_to_station') {
            res.status(200).json({ message: "Return to Station command forwarded successfully." });
        } else if (missionDataFromFrontend.type === 'start_mission') {
            res.status(200).json({ message: "Mission command forwarded successfully." });
        } else {
            res.status(200).json({ message: "Command forwarded successfully." });
        }
    } else {
        console.error("Cannot forward command: WebSocket to Python server is not open.");
        res.status(500).json({ error: "Cannot communicate with the robot." });
    }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    if (vmWsUrl.includes('<YOUR_VM_IP_ADDRESS>')) {
        console.warn(`WARNING: VM_WEBSOCKET_URL is using placeholder. Set it in .env or directly in code: ${vmWsUrl}`);
    }
    console.log(`Attempting to connect to VM WebSocket at: ${vmWsUrl}`);
    console.log(`Frontend clients connect to this server via Socket.IO (typically on ws://localhost:${PORT} or similar)`);
    console.log('API endpoints are available, e.g., /api/auth');
});