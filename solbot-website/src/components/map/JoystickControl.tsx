import React, { useState, useRef, useEffect } from 'react';

const JoystickControl: React.FC = () => {
    const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const joystickRef = useRef<HTMLDivElement>(null);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:9090');
        ws.current.onopen = () => console.log('Joystick WebSocket connected');
        ws.current.onclose = () => console.log('Joystick WebSocket disconnected');
        ws.current.onerror = (e) => console.error('Joystick WebSocket error', e);
        return () => {
            if (ws.current) ws.current.close();
        };
    }, []);

    const handleJoystickMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDragging(true);
        updateJoystickPosition(e);
    };

    const handleJoystickMouseMove = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        if (isDragging) {
            if ('preventDefault' in e) e.preventDefault();
            updateJoystickPosition(e);
        }
    };

    const handleJoystickMouseUp = () => {
        setIsDragging(false);
        setJoystickPosition({ x: 0, y: 0 });
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                op: 'manual_move',
                data: { x: 0, y: 0 }
            }));
        }
    };

    const updateJoystickPosition = (e: any) => {
        if (!joystickRef.current) return;
        const rect = joystickRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        let x = clientX - rect.left - centerX;
        let y = clientY - rect.top - centerY;
        const distance = Math.sqrt(x * x + y * y);
        const maxDistance = centerX * 0.8;
        if (distance > maxDistance) {
            const angle = Math.atan2(y, x);
            x = Math.cos(angle) * maxDistance;
            y = Math.sin(angle) * maxDistance;
        }
        const normalizedX = x / maxDistance;
        const normalizedY = y / maxDistance;
        setJoystickPosition({ x: normalizedX, y: normalizedY });
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                op: 'manual_move',
                data: { x: normalizedX, y: normalizedY }
            }));
        }
    };

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent | TouchEvent) => {
            if (isDragging) handleJoystickMouseMove(e);
        };
        const handleGlobalMouseUp = () => {
            if (isDragging) handleJoystickMouseUp();
        };
        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('touchmove', handleGlobalMouseMove);
        document.addEventListener('touchend', handleGlobalMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('touchmove', handleGlobalMouseMove);
            document.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, [isDragging]);

    return (
        <div>
            <div
                ref={joystickRef}
                style={{
                    position: 'relative',
                    width: 128,
                    height: 128,
                    margin: '0 auto',
                    background: '#f3f4f6',
                    borderRadius: '50%',
                    border: '2px solid #d1d5db',
                    touchAction: 'none',
                    userSelect: 'none',
                    cursor: 'pointer'
                }}
                onMouseDown={handleJoystickMouseDown}
                onTouchStart={handleJoystickMouseDown}
                onTouchMove={handleJoystickMouseMove}
                onTouchEnd={handleJoystickMouseUp}
            >
                <div
                    style={{
                        position: 'absolute',
                        width: 48,
                        height: 48,
                        background: '#2563eb',
                        borderRadius: '50%',
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${joystickPosition.x * 40}px), calc(-50% + ${joystickPosition.y * 40}px))`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                />
            </div>
            <div style={{marginTop: 8, textAlign: 'center', color: '#6b7280', fontSize: 14}}>
                {isDragging ? 'Dragging...' : 'Click and drag to move'}
            </div>
        </div>
    );
};

export default JoystickControl; 