const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    // Join a specific room (the "Join Code")
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    // Relay signaling data (offer, answer, or ice candidate)
    socket.on('signal', (data) => {
        // data should be: { roomId: '...', signalData: {...} }
        // Broadcast to everyone in the room EXCEPT the sender
        socket.to(data.roomId).emit('signal', {
            senderId: socket.id,
            signalData: data.signalData
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});
