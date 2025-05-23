const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const http = require('http');

const wss = new WebSocket.Server({ port: 9090 }); // WebSocket server

console.log('Mock ROSBridge & Command server started on ws://localhost:9090');

const app = express();
const server = http.createServer(app);

// Serve the mock video file (place a file named mock_field.mp4 in the mocks directory)
app.get('/mock_camera_stream', (req, res) => {
    const videoPath = path.join(__dirname, 'mock_field.mp4');
    console.log('Serving video from:', videoPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    require('fs').createReadStream(videoPath).pipe(res);
});

server.listen(9091, () => {
    console.log('Mock HTTP server for camera stream started on http://localhost:9091');
});

// --- Mock Data Definitions & State ---
let mapSeq = 0;
let autoDirection = 1;
let robotHeading = 0;
let wanderState = { x: 2, y: 6, dir: 1, row: 0 };
let manualMode = false;
let manualTarget = { dx: 0, dy: 0 };
let mockRobotSpeedLinear = 1.2; // m/s
let mockRobotControlState = {
    isEmergencyStopped: false,
    isRobotActive: false,
    statusMessage: "Robot is idle (mock).",
};
// Auto-activate the robot for testing
mockRobotControlState.isRobotActive = true;
let robotPos = { x: 2, y: 6 };
let robotMode = 'auto'; // 'auto' or 'manual'
let manualControl = { x: 0, y: 0 };
let lastManualMoveTime = 0;
let robotStatus = {
    battery: 80, // Static battery level
    connection: '4G',
    speed: 1.2,
    status: 'online',
    mode: 'Autonomous'
};

function getPanelBlocks() {
    const numRows = 6;
    const panelsPerRow = 1;
    const panelWidth = 24;
    const panelHeight = 2;
    const rowSpacing = 4;
    const colSpacing = 5;
    const panelBlocks = [];
    for (let row = 0; row < numRows; row++) {
        const yStart = 3 + row * rowSpacing;
        for (let col = 0; col < panelsPerRow; col++) {
            const xStart = 3 + col * colSpacing;
            panelBlocks.push({ xStart, xEnd: xStart + panelWidth, yStart, yEnd: yStart + panelHeight });
        }
    }
    return panelBlocks;
}

function isInPanel(x, y, panelBlocks) {
    for (const block of panelBlocks) {
        if (x >= block.xStart && x < block.xEnd && y >= block.yStart && y < block.yEnd) return true;
    }
    return false;
}

function generateMockMapData(robotX, robotY, robotHeading) {
    mapSeq++;
    const panelBlocks = getPanelBlocks();
    // Generate LIDAR scan points (simulate 360-degree scan)
    const lidarPoints = [];
    for (let i = 0; i < 36; i++) {
        const angle = (i / 36) * 2 * Math.PI + robotHeading;
        let distance = 10 + Math.sin(angle * 3 + mapSeq / 10) * 2 + Math.random();
        // Simulate a hit if close to a panel block
        for (const block of panelBlocks) {
            for (let x = block.xStart; x < block.xEnd; x++) {
                for (let y = block.yStart; y < block.yEnd; y++) {
                    const dx = x - robotX;
                    const dy = y - robotY;
                    const obsDist = Math.sqrt(dx * dx + dy * dy);
                    const obsAngle = Math.atan2(dy, dx);
                    if (Math.abs(((angle - obsAngle + Math.PI) % (2 * Math.PI)) - Math.PI) < 0.1 && obsDist < distance) {
                        distance = obsDist;
                    }
                }
            }
        }
        lidarPoints.push({ angle, distance });
    }
    return {
        header: {
            seq: mapSeq,
            stamp: { sec: Math.floor(Date.now() / 1000), nanosec: (Date.now() % 1000) * 1e6 },
            frame_id: 'map'
        },
        info: {
            map_load_time: { sec: Math.floor(Date.now() / 1000) - 10, nanosec: 0 },
            resolution: 0.1,
            width: 30,
            height: 30,
            origin: {
                position: { x: -1.5, y: -1.5, z: 0.0 },
                orientation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }
            }
        },
        data: Array(30 * 30).fill(0).map((_, i) => {
            const x = i % 30;
            const y = Math.floor(i / 30);
            // Border
            if (x === 0 || x === 29 || y === 0 || y === 29) return 100;
            // Panel blocks
            for (const block of panelBlocks) {
                if (x >= block.xStart && x < block.xEnd && y >= block.yStart && y < block.yEnd) return 100;
            }
            return 0;
        }),
        robot: { x: robotX, y: robotY, heading: robotHeading },
        lidar: lidarPoints
    };
}

function getRobotPose(robotX, robotY, robotHeading) {
    return {
        header: { seq: mapSeq, stamp: { sec: Math.floor(Date.now() / 1000), nanosec: (Date.now() % 1000) * 1e6 }, frame_id: 'map' },
        pose: {
            position: { x: robotX, y: robotY, z: 0 },
            orientation: { x: 0, y: 0, z: Math.sin(robotHeading / 2), w: Math.cos(robotHeading / 2) }
        }
    };
}

function getLidarScan(robotX, robotY, robotHeading) {
    const map = generateMockMapData(robotX, robotY, robotHeading);
    return {
        header: map.header,
        points: map.lidar // array of {angle, distance}
    };
}

wss.on('connection', ws => {
    console.log('Client connected to mock server');
    const subscriptions = new Set();
    let clientRequestIdCounter = 0;

    // Robot state for manual mode
    let manualRobotState = { x: wanderState.x, y: wanderState.y, heading: robotHeading };

    // Send initial control state
    ws.send(JSON.stringify({
        op: 'robot_control_status_update',
        status: mockRobotControlState
    }));

    // Main interval for publishing data and moving robot
    const dataPublishIntervalId = setInterval(() => {
        // Simulate speed changes
        mockRobotSpeedLinear = 0.8 + Math.random() * 0.8; // 0.8 to 1.6 m/s
        // Robot movement logic
        const panelBlocks = getPanelBlocks();
        const now = Date.now();
        // If in manual mode but no manual_move in last 1s, switch back to auto
        if (manualMode && now - lastManualMoveTime > 1000) {
            manualMode = false;
            manualTarget = { dx: 0, dy: 0 };
        }
        if (!mockRobotControlState.isEmergencyStopped && mockRobotControlState.isRobotActive) {
            if (manualMode) {
                // Manual mode: move according to manualTarget (joystick)
                let newX = robotPos.x + manualTarget.dx;
                let newY = robotPos.y + manualTarget.dy;
                // Clamp to map bounds
                newX = Math.max(1, Math.min(28, newX));
                newY = Math.max(1, Math.min(28, newY));
                // Don't enter panels
                if (!isInPanel(newX, newY, panelBlocks)) {
                    robotPos.x = newX;
                    robotPos.y = newY;
                }
                // Heading based on movement
                if (manualTarget.dx !== 0 || manualTarget.dy !== 0) {
                    robotHeading = Math.atan2(manualTarget.dy, manualTarget.dx);
                }
            } else {
                // Auto wander in aisles
                let { x, y, dir, row } = wanderState;
                const minX = 1;
                const maxX = 28;
                const aisleYs = [
                    { yMin: 1, yMax: 4 },
                    { yMin: 7, yMax: 10 },
                    { yMin: 13, yMax: 16 },
                    { yMin: 19, yMax: 22 },
                    { yMin: 25, yMax: 28 }
                ];
                x += dir;
                if (x < minX) {
                    x = minX;
                    dir = 1;
                    row = (row + 1) % aisleYs.length;
                    y = aisleYs[row].yMin + Math.floor((aisleYs[row].yMax - aisleYs[row].yMin) / 2);
                } else if (x > maxX) {
                    x = maxX;
                    dir = -1;
                    row = (row + 1) % aisleYs.length;
                    y = aisleYs[row].yMin + Math.floor((aisleYs[row].yMax - aisleYs[row].yMin) / 2);
                }
                wanderState = { x, y, dir, row };
                robotPos.x = x;
                robotPos.y = y;
                robotHeading = dir === 1 ? 0 : Math.PI;
            }
            // Always update manualRobotState to match the real robot position
            manualRobotState.x = robotPos.x;
            manualRobotState.y = robotPos.y;
            manualRobotState.heading = robotHeading;
            console.log('robotPos', robotPos, 'manualMode', manualMode, 'isRobotActive', mockRobotControlState.isRobotActive);
        }

        // Publish topics
        if (ws.readyState === WebSocket.OPEN) {
            if (subscriptions.has('/movement_speed')) {
                ws.send(JSON.stringify({
                    op: 'publish',
                    topic: '/movement_speed',
                    msg: { data: mockRobotSpeedLinear }
                }));
            }
            if (subscriptions.has('/map')) {
                // Use manualRobotState for robot position
                const mapMsg = generateMockMapData(manualRobotState.x, manualRobotState.y, manualRobotState.heading);
                mapMsg.robot.x = manualRobotState.x;
                mapMsg.robot.y = manualRobotState.y;
                mapMsg.robot.heading = manualRobotState.heading;
                ws.send(JSON.stringify({
                    op: 'publish',
                    topic: '/map',
                    msg: mapMsg
                }));
            }
            if (subscriptions.has('/robot_pose')) {
                console.log('Publishing /robot_pose', manualRobotState);
                ws.send(JSON.stringify({
                    op: 'publish',
                    topic: '/robot_pose',
                    msg: {
                        header: { seq: 0, stamp: { sec: 0, nanosec: 0 }, frame_id: 'map' },
                        pose: {
                            position: { x: manualRobotState.x, y: manualRobotState.y, z: 0 },
                            orientation: { x: 0, y: 0, z: Math.sin(manualRobotState.heading / 2), w: Math.cos(manualRobotState.heading / 2) }
                        }
                    }
                }));
            }
            if (subscriptions.has('/lidar_scan')) {
                // Use manualRobotState for robot position
                const mapMsg = generateMockMapData(manualRobotState.x, manualRobotState.y, manualRobotState.heading);
                mapMsg.robot.x = manualRobotState.x;
                mapMsg.robot.y = manualRobotState.y;
                mapMsg.robot.heading = manualRobotState.heading;
                ws.send(JSON.stringify({
                    op: 'publish',
                    topic: '/lidar_scan',
                    msg: { header: mapMsg.header, points: mapMsg.lidar }
                }));
            }
            if (subscriptions.has('/robot_control_status')) {
                ws.send(JSON.stringify({
                    op: 'publish',
                    topic: '/robot_control_status',
                    msg: mockRobotControlState
                }));
            }
            if (subscriptions.has('/robot_status')) {
                // Remove battery simulation, keep other status updates
                robotStatus.speed = mockRobotSpeedLinear;
                robotStatus.mode = manualMode ? 'Manual' : 'Autonomous';
                ws.send(JSON.stringify({
                    op: 'publish',
                    topic: '/robot_status',
                    msg: robotStatus
                }));
            }
        }
    }, 1000);

    ws.on('message', messageString => {
        try {
            const message = JSON.parse(messageString);
            console.log('Mock server received:', JSON.stringify(message, null, 2));

            if (message.op === 'subscribe') {
                console.log(`Client subscribed to: ${message.topic}, type: ${message.type}`);
                subscriptions.add(message.topic);
                if (message.topic === '/robot_status') {
                    ws.send(JSON.stringify({
                        op: 'publish',
                        topic: '/robot_status',
                        msg: robotStatus
                    }));
                }
            } else if (message.op === 'unsubscribe') {
                console.log(`Client unsubscribed from: ${message.topic}`);
                subscriptions.delete(message.topic);
            } else if (message.op === 'manual_move') {
                console.log('Received manual_move', message.data);
                // Switch to manual mode if joystick is moved
                if (message.data && (message.data.x !== 0 || message.data.y !== 0)) {
                    manualMode = true;
                    manualTarget = { dx: message.data.x, dy: message.data.y };
                    lastManualMoveTime = Date.now();
                }
            } else if (message.op === 'send_command') {
                const command = message.command;
                const requestId = message.id || `req_${clientRequestIdCounter++}`;
                if (command === 'emergency_stop') {
                    mockRobotControlState.isEmergencyStopped = true;
                    mockRobotControlState.isRobotActive = false;
                    mockRobotControlState.statusMessage = "Robot is in EMERGENCY STOP mode (mock).";
                    manualMode = false;
                    ws.send(JSON.stringify({
                        op: 'command_response',
                        id: requestId,
                        success: true,
                        message: 'Emergency stop command processed by mock server.',
                        updatedStatus: mockRobotControlState
                    }));
                } else if (command === 'activate_robot') {
                    if (mockRobotControlState.isEmergencyStopped) {
                        mockRobotControlState.statusMessage = "Cannot activate: Robot is in EMERGENCY STOP. Please reset first (mock).";
                        ws.send(JSON.stringify({
                            op: 'command_response',
                            id: requestId,
                            success: false,
                            message: 'Mock: Robot is emergency stopped. Cannot activate directly.',
                            updatedStatus: mockRobotControlState
                        }));
                    } else {
                        mockRobotControlState.isEmergencyStopped = false;
                        mockRobotControlState.isRobotActive = true;
                        mockRobotControlState.statusMessage = "Robot is ACTIVE and ready (mock).";
                        ws.send(JSON.stringify({
                            op: 'command_response',
                            id: requestId,
                            success: true,
                            message: 'Activate robot command processed by mock server.',
                            updatedStatus: mockRobotControlState
                        }));
                    }
                } else if (command === 'reset_robot') {
                    mockRobotControlState.isEmergencyStopped = false;
                    mockRobotControlState.isRobotActive = false;
                    mockRobotControlState.statusMessage = "Robot has been reset to idle (mock).";
                    manualMode = false;
                    ws.send(JSON.stringify({
                        op: 'command_response',
                        id: requestId,
                        success: true,
                        message: 'Mock robot state reset.',
                        updatedStatus: mockRobotControlState
                    }));
                } else if (command === 'auto_mode') {
                    manualMode = false;
                    ws.send(JSON.stringify({
                        op: 'command_response',
                        id: requestId,
                        success: true,
                        message: 'Switched to auto mode.',
                        updatedStatus: mockRobotControlState
                    }));
                } else if (command === 'manual_mode') {
                    manualMode = true;
                    ws.send(JSON.stringify({
                        op: 'command_response',
                        id: requestId,
                        success: true,
                        message: 'Switched to manual mode.',
                        updatedStatus: mockRobotControlState
                    }));
                } else {
                    ws.send(JSON.stringify({
                        op: 'command_response',
                        id: requestId,
                        success: false,
                        message: `Unknown command: ${command}`
                    }));
                }
            }
        } catch (e) {
            console.error("Failed to parse message or error in handler:", e, messageString);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected from mock server');
        clearInterval(dataPublishIntervalId);
        subscriptions.clear();
    });

    ws.on('error', (error) => {
        console.error('Mock server WebSocket error:', error);
        clearInterval(dataPublishIntervalId);
    });
});
