const express = require('express');
const https = require('https');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();

app.use(express.static(__dirname));

const key = fs.readFileSync('cert.key');
const cert = fs.readFileSync('cert.crt');
const options = { key, cert };

const PORT = 3000;
const httpsServer = https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server started....listening on PORT: ${PORT}`);
});

const io = new Server(httpsServer, {
    cors: {
        origin: 'https://localhost',
        methods: ['GET', 'POST']
    }
});

// An array to store all offers
const allOffers = [];

// An array to store all connected sockets
const connectedSockets = [];

io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    console.log(`User: ${userId} joined`);

    // Add socket to connected sockets
    connectedSockets.push({
        socketId: socket.id,
        userId
    });

    // Send existing offers to the newly connected user
    if (allOffers.length > 0) {
        socket.emit('offersToAccept', allOffers);
    }

    // Handle receiving an offer from a client
    socket.on('offer', (offer) => {
        console.log(`Received offer from user: ${userId}`);
        allOffers.push({
            offer,
            offerUserId: userId,
            offerSocketId: socket.id,
            offererId: socket.id,
            iceCandidatesOffer: [],
            answer: null,
            answerUserId: null,
            answerSocketId: null,
            answerId: null,
            iceCandidatesAnswer: []
        });
        socket.broadcast.emit('newOfferToAccept', allOffers.slice(-1));
    });

    // Handle receiving an answer from a client
    socket.on('answer', (offerObj, ackFn) => {
        const updateOffer = allOffers.find(offer => offer.offerUserId === offerObj.offerUserId);
        if (!updateOffer) {
            console.log('No offer to update');
            return;
        }

        ackFn(updateOffer.iceCandidatesOffer);
        updateOffer.answer = offerObj.answer;
        updateOffer.answerUserId = userId;

        const connectedSocket = connectedSockets.find(socket => socket.userId === offerObj.offerUserId);
        if (connectedSocket) {
            socket.to(connectedSocket.socketId).emit('answerFromServer', updateOffer);
        } else {
            console.log(`No connected socket found for user: ${offerObj.offerUserId}`);
        }
    });

    // Handle receiving ICE candidates
    socket.on('iceCandidate', (iceCandidate) => {
        if (iceCandidate.isFromOfferer) {
            const offerUnderDesc = allOffers.find(offer => offer.offerUserId === iceCandidate.iceUserId);
            if (offerUnderDesc) {
                offerUnderDesc.iceCandidatesOffer.push(iceCandidate.iceCandidate);
                if (offerUnderDesc.answerUserId) {
                    const answerToSendTo = connectedSockets.find(socket => socket.userId === offerUnderDesc.answerUserId);
                    if (answerToSendTo) {
                        socket.to(answerToSendTo.socketId).emit('iceCandidateFromServer', iceCandidate.iceCandidate);
                    } else {
                        console.log('No answerer exists to receive ICE candidates of the offerer');
                    }
                }
            }
        } else {
            const offerUnderDesc = allOffers.find(offer => offer.answerUserId === iceCandidate.userId);
            if (offerUnderDesc) {
                const offerToSendTo = connectedSockets.find(socket => socket.userId === offerUnderDesc.offererId);
                if (offerToSendTo) {
                    socket.to(offerToSendTo.socketId).emit('iceCandidateFromServer', iceCandidate.iceCandidate);
                }
            }
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User left', {
            userId,
            socketId: socket.id,
        });

        // Remove socket from connectedSockets
        const index = connectedSockets.findIndex(socket => socket.socketId === socket.id);
        if (index !== -1) {
            connectedSockets.splice(index, 1);
        }
    });
});
