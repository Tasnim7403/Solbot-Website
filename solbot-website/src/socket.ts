import { io } from 'socket.io-client';

// Replace with the URL of YOUR Node.js backend server
const NODE_JS_BACKEND_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const socket = io(NODE_JS_BACKEND_URL, {
    transports: ['websocket'], // Optional: force websocket transport
    // You might need other options depending on your setup, e.g., withCredentials
});

socket.on('connect', () => {
    console.log('Successfully connected to Node.js backend via Socket.IO! Socket ID:', socket.id);
});

socket.on('connect_error', (err) => {
    // Only log properties that exist on Error
    console.error('Socket.IO connection error:', err.message, err);
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected from Node.js backend via Socket.IO:', reason);
});

// Example: Listen for system messages from the backend
socket.on('vm_system_message', (data) => {
    console.log('FROM NODE.JS (originated from VM): System Message:', data);
}); 