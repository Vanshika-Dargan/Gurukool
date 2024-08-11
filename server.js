
const express = require('express');
const https = require('https');
const { Server } = require('socket.io');
const fs = require('fs');


const app=express();

app.use(express.static(__dirname));

let options;

let key = fs.readFileSync('cert.key');
let cert = fs.readFileSync('cert.crt');
options={
   key,
   cert
}



const PORT=3000;
const httpsServer=https.createServer(options,app).listen(PORT,()=>{
    console.log(`HTTPS Server started....listening on PORT: ${PORT}`)
});

 const io= new Server(httpsServer,{
    cors:{
        origin: `https://localhost`,
        methods: ['GET','POST']
    }
});

// an array to store all offers
const allOffers=[];

// an array to store all connected sockets
const connectedSockets=[];


io.on('connection',(socket)=>{

    userId=socket.handshake.auth.userId;
    console.log(`user: ${userId} joined`);
     
    connectedSockets.push({
        socketId: socket.id,
        userId: userId
    })
    
    // send him all the offers of the connected clients..;
    if(allOffers.length > 0){
        socket.emit('offersToAccept',allOffers);
    }

    // it is going to send its own offer to the server, which will save in offers array
    // and then send it to all clients expect this new one.
    socket.on('offer',offer=>{
        console.log(`Recieved offer from user: ${userId}`);
    allOffers.push({
        offer: offer,
        offerUserId:userId,
        offerSocketId:socket.id,
        offererId: socket.id,
        iceCandidatesOffer:[],
        answer:null,
        answerUserId:null,
        answerSocketId:null,
        answerId:null,
        iceCandidatesAnswer:[]
    })
    socket.broadcast.emit('newOfferToAccept',allOffers.slice(-1));
    })

    socket.on('iceCandidate',iceCandidate=>{

    
        // if ice candidate is from the offerer we need to send it to the answerer
        if(iceCandidate.isFromOfferer){
        console.log(`Recieved ice candidate from the offerer: ${userId}`);
        const offerUnderDesc=allOffers.find(offer=>offer.offerUserId==iceCandidate.iceUserId);
        if(offerUnderDesc){
            console.log(`Offerer found with id: ${iceCandidate.iceUserId}`);
            offerUnderDesc.iceCandidatesOffer.push(iceCandidate)
            if(offerUnderDesc.answerId){
               const answerToSendTo= connectedSockets.find(connectedSocket=>connectedSocket.sockedId==offerUnderDesc.offererId);
                if(answerToSendTo){
                    socket.to(answerToSendTo.sockedId).emit('iceCandidateFromServer',iceCandidate.iceCandidate);
                }
                else{
                    console.log("No answerer exists to recieve ice candidates of offerer")
                }
            }
            console.log('Offer updated with ice candidates',offerUnderDesc);
        }

    }

        else{
        const offerUnderDesc=allOffers.find(offer=>offer.answerId==iceCandidate.userId);
        if(offerUnderDesc){
        const offerToSendTo=connectedSockets.find(socket=>socket.sockedId==offerUnderDesc.offererId);
        socket.to(offerToSendTo.sockedId).emit('iceCandidateFromServer',iceCandidate.iceCandidate);
        }
        }

    })


    socket.on('answer',(offerObj,ackFn)=>{
        console.log('Recived answer from ',socket.id);
        
        const updateOffer=allOffers.find(offer=>offer.offererId==offerObj.offererId);
        
        if(!updateOffer){
            console.log('No offer to update');
            return;
        }

        updateOffer.answer=offerObj.answer;
        ackFn(updateOffer.iceCandidatesOffer);
        const connectedSocket=connectedSockets.find(socket=>socket.socketId==offerObj.offererId);
        socket.to(connectedSocket).emit('answerFromServer',updateOffer)
    })


    socket.on('disconnect', () => {
        console.log('User left',{
            userId: userId,
            socketId: socket.id,
        });
      });
})








