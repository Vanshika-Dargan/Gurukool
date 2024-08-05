
const express = require('express');
const { createCA, createCert } = require('mkcert');
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

io.on('connection',(socket)=>{
    console.log('User 2 joined');
    socket.on('disconnect', () => {
        console.log('User 2 left');
      });
})








