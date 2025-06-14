import React, { useEffect, useState, useRef } from 'react';
import { socket } from '../../socket';
import axios from 'axios';

function MapDisplay() {
    const [mapData, setMapData] = useState<any>(null);
    const [robotPose, setRobotPose] = useState<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Fetch map data on mount
        const fetchMapData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/robot/map-data');
                if (response.data && response.data.mapData) {
                    setMapData(response.data.mapData.data);
                }
            } catch (error) {
                console.error('Error fetching map data:', error);
            }
        };
        fetchMapData();

        function handleDynamicMapUpdate(dataFromNodeJs: any) {
            console.log('React received dynamic_map_update:', dataFromNodeJs);
            setMapData(dataFromNodeJs.data);
        }

        function handleRobotUpdate(dataFromNodeJs: any) {
            console.log('React received robot_update:', dataFromNodeJs);
            setRobotPose(dataFromNodeJs.data);
        }

        socket.on('dynamic_map_update', handleDynamicMapUpdate);
        socket.on('robot_update', handleRobotUpdate);

        return () => {
            socket.off('dynamic_map_update', handleDynamicMapUpdate);
            socket.off('robot_update', handleRobotUpdate);
        };
    }, []);

    useEffect(() => {
        if (mapData && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            const { metadata, occupancy_data } = mapData;
            const { resolution, width, height, origin } = metadata;
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = x + (height - 1 - y) * width;
                    const occupancyValue = occupancy_data[index];
                    
                    // Correctly map occupancy values to colors based on the ROS standard
                    let color;
                    if (occupancyValue === 100) {
                        color = 'black';  // Obstacle
                    } else if (occupancyValue === 0) {
                        color = 'white';  // Free space
                    } else { // This handles -1 for "unknown"
                        color = 'grey';   // Unknown
                    }
                    
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            
            if (robotPose && robotPose.position) {
                const robotDisplayX = (robotPose.position.x - origin.position.x) / resolution;
                const robotDisplayY = height - 1 - ((robotPose.position.y - origin.position.y) / resolution);
                
                if (robotDisplayX >= 0 && robotDisplayX < width && robotDisplayY >= 0 && robotDisplayY < height) {
                    ctx.fillStyle = 'red';
                    ctx.beginPath();
                    ctx.arc(robotDisplayX, robotDisplayY, 5, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
    }, [mapData, robotPose]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <canvas ref={canvasRef} style={{ border: '1px solid #ccc', width: '100%', height: '100%', display: 'block', background: '#fff' }}></canvas>
        </div>
    );
}

export default MapDisplay; 