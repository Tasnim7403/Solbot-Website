const NodeWebcam = require('node-webcam');

// List available cameras
NodeWebcam.list(function (list) {
    console.log("Available cameras:");
    list.forEach((device, index) => {
        console.log(`${index}: ${device}`);
    });
}); 