const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const rooms = {}; // Object to keep track of active rooms

wss.on('connection', (ws) => {
    console.log('A user connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // Join a specific room
            if (data.type === 'join-room') {
                ws.roomId = data.roomId;
                if (!rooms[data.roomId]) {
                    rooms[data.roomId] = new Set();
                }
                rooms[data.roomId].add(ws);
                console.log(`User joined room: ${data.roomId}`);
            }
            
            // Relay signaling data (offer, answer, ice candidates)
            else if (data.type === 'signal') {
                if (ws.roomId && rooms[ws.roomId]) {
                    // Broadcast to everyone in the room EXCEPT the sender
                    for (let client of rooms[ws.roomId]) {
                        if (client !== ws && client.readyState === 1) { // 1 = OPEN
                            client.send(JSON.stringify({
                                type: 'signal',
                                signalData: data.signalData
                            }));
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to parse message:", error);
        }
    });

    ws.on('close', () => {
        console.log('User disconnected');
        // Clean up the room when someone leaves
        if (ws.roomId && rooms[ws.roomId]) {
            rooms[ws.roomId].delete(ws);
            if (rooms[ws.roomId].size === 0) {
                delete rooms[ws.roomId]; 
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Raw WebSocket Signaling server running on port ${PORT}`);
});