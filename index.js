
const express = require('express');
const { createCA, createCert } = require('mkcert');
const https = require('https');
const { Server } = require('socket.io');



const app=express();

app.use(express.static(__dirname));


(async()=>{const ca = await createCA({
    organization: 'Development',
    countryCode:'IN',
    state:'New Delhi',
    locality:'Chandini Chowk',
    validity: 365
});

const cert = await createCert({
    ca:{key:ca.key,cert:ca.cert},
    domains:['localhost'],
    validity: 365
})

const options={
    key: cert.key,
    cert: cert.cert
}
console.log(options);
const PORT=443;
const httpsServer=https.createServer(options,app).listen(PORT,()=>{
    console.log(`HTTPS Server started....listening on PORT: ${PORT}`)
});

const io= new Server(httpsServer,{
    cors:{
        origin: `https://localhost`,
        methods: ['GET','POST']
    }
});
})();


