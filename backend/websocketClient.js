const { Server } = require('socket.io');
const http = require('http');
const RobotBridge = require('./robotBridge');

// Create a minimal HTTP server for Socket.IO
const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Initialize RobotBridge with the Socket.IO instance
const robotBridge = new RobotBridge(io);

// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log('Client connected to WebSocket client');

    // Send initial state to the client
    socket.emit('robot_data', robotBridge.getAllRobotData());

    // Handle topic subscriptions
    socket.on('subscribe_topic', (topic) => {
        console.log('Subscribing to topic:', topic);
        robotBridge.subscribe(topic);
    });

    socket.on('unsubscribe_topic', (topic) => {
        console.log('Unsubscribing from topic:', topic);
        robotBridge.unsubscribe(topic);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected from WebSocket client');
    });
});

// Error handling for the server
server.on('error', (error) => {
    console.error('WebSocket client server error:', error);
});

// Start the server on a different port than the main backend
const PORT = process.env.WS_CLIENT_PORT || 5001;
server.listen(PORT, () => {
    console.log(`WebSocket client running on port ${PORT}`);
    console.log(`Connecting to ROS Bridge at ${process.env.ROS_BRIDGE_URL || 'ws://192.168.137.22:8766'}`);
    console.log('Ready to handle robot commands and forward data to the main backend');
}); 