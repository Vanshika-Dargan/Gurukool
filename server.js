
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
io.on('connection',(socket)=>{
    console.log('New User joined',socket.id);
    
    // send him all the offers of the connected clients..;
    if(allOffers.length > 0){
        socket.emit('offersToAccept',allOffers);
    }

    // it is going to send its own offer to the server, which will save in offers array
    // and then send it to all clients expect this new one.
    socket.on('offer',offer=>{
        console.log('Recieved offer from',socket.id);
    allOffers.push({
        offer: offer,
        iceCandidatesOffer:[],
        answer:null,
        iceCandidatesAnswer:[]
    })
    socket.broadcast.emit('newOfferToAccept',allOffers.slice(-1));
    })







    socket.on('disconnect', () => {
        console.log('User left',socket.id);
      });
})








