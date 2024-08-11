
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


    socket.on('answer',(offerObj,ackFn)=>{
        // console.log('Answer recieved from ',offerObj.answerUserId);
        
        const updateOffer=allOffers.find(offer=>offer.offerUserId === offerObj.offerUserId);
        
        // console.log(`Found the offer to update with answer`);
        if(!updateOffer){
            console.log('No offer to update');
            return;
        }
       
        //console.log(`Updated offer with answer`,offerObj);
        ackFn(updateOffer.iceCandidatesOffer);
        updateOffer.answer=offerObj.answer;
        updateOffer.answerUserId=userId;
        const connectedSocket=connectedSockets.find(socket=>socket.userId==offerObj.offerUserId);
        console.log(connectedSocket);
        console.log('HI');
        console.log(connectedSocket.socketId);
        console.log(updateOffer);
        socket.to(connectedSocket.socketId).emit('answerFromServer',updateOffer)
    })

    socket.on('iceCandidate',iceCandidate=>{
        // console.log(iceCandidate.isFromOfferer);
        // if ice candidate is from the offerer we need to send it to the answerer
        if(iceCandidate.isFromOfferer){
        // console.log(`Recieved ice candidate from the offerer: ${userId}`);
        const offerUnderDesc=allOffers.find(offer=>offer.offerUserId === iceCandidate.iceUserId);
       // console.log(offerUnderDesc);
        if(offerUnderDesc){
            // console.log(`Offerer found with id: ${iceCandidate.iceUserId}`);
            offerUnderDesc.iceCandidatesOffer.push(iceCandidate.iceCandidate);

            if(offerUnderDesc.answerUserId){
                 console.log(`Answerer exists for the offer of user: ${iceCandidate.iceUserId}`);
               const answerToSendTo= connectedSockets.find(connectedSocket=>connectedSocket.sockedId==offerUnderDesc.offererId);
                if(answerToSendTo){
                    socket.to(answerToSendTo.sockedId).emit('iceCandidateFromServer',iceCandidate.iceCandidate);
                }
                else{
                    console.log("No answerer exists to recieve ice candidates of offerer")
                }
            }
            //console.log('Offer updated with ice candidates',offerUnderDesc);
        }

    }

        else{
            // console.log(`Recieved ice candidate from the answerer: ${userId}`);
        const offerUnderDesc=allOffers.find(offer=>offer.answerUserId==iceCandidate.userId);
        // console.log(`Offerer found for the answerer`,offerUnderDesc)
        if(offerUnderDesc){
        const offerToSendTo=connectedSockets.find(socket=>socket.sockedId==offerUnderDesc.offererId);
        socket.to(offerToSendTo.sockedId).emit('iceCandidateFromServer',iceCandidate.iceCandidate);
        }
        }

    })





    socket.on('disconnect', () => {
        console.log('User left',{
            userId: userId,
            socketId: socket.id,
        });
      });
})








