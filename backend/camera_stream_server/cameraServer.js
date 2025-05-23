const express = require('express');
const cors = require('cors');
const NodeWebcam = require('node-webcam');
const fs = require('fs');
const path = require('path');

const app = express();
const HTTP_PORT = 4000;
const FPS = 4;

// --- Middleware ---
app.use(cors());

// --- Webcam Setup ---
const opts = {
    width: 320,
    height: 240,
    quality: 80,
    frames: 60,
    delay: 0,
    saveShots: false,
    output: "jpeg",
    device: 1,
    callbackReturn: "buffer",
    verbose: false
};

const Webcam = NodeWebcam.create(opts);

// --- MJPEG Streaming HTTP Endpoint ---
app.get('/video_feed', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=--frame',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });

    const sendFrameInterval = setInterval(() => {
        if (res.socket.destroyed) {
            clearInterval(sendFrameInterval);
            return;
        }

        Webcam.capture('frame', (err, data) => {
            if (err) {
                console.error('Error capturing frame:', err);
                return;
            }

            res.write(`--frame\r\n`);
            res.write('Content-Type: image/jpeg\r\n');
            res.write(`Content-Length: ${data.length}\r\n`);
            res.write('\r\n');
            res.write(data);
            res.write('\r\n');
        });
    }, 1000 / FPS);

    req.on('close', () => {
        console.log('Client disconnected from camera server');
        clearInterval(sendFrameInterval);
    });
});

// --- Start the server ---
app.listen(HTTP_PORT, () => {
    console.log(`Camera Stream Server running on http://localhost:${HTTP_PORT}`);
    console.log(`MJPEG video stream available at http://localhost:${HTTP_PORT}/video_feed`);
});

process.on('SIGINT', () => {
    console.log("Shutting down camera server...");
    process.exit(0);
});
