const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const energyRoutes = require('./routes/energyRoutes');
const anomalyRoutes = require('./routes/anomalyRoutes');
const personRoutes = require('./routes/personRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const robotRoutes = require('./routes/robotRoutes');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const httpProxy = require('http-proxy');

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

// Enable CORS with specific options
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
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
app.use('/api/robot', robotRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('SolBot API is running...');
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
        credentials: true
    }
});
app.set('io', io);

const videoProxy = httpProxy.createProxyServer({});

// Proxy MJPEG video stream from Python server
app.get('/api/video_feed', (req, res) => {
    videoProxy.web(req, res, { target: 'http://localhost:8082/video_feed', changeOrigin: true });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log('API endpoints:');
    console.log(`- Authentication: http://localhost:${PORT}/api/auth`);
});
