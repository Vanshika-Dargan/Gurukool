

let localStream;
let remoteStream;
let peerConnection;
let offer;
let socket;


const getUserMediaStream = async() => {

    localStream=await navigator.mediaDevices.getUserMedia({
        video:true,
       //audio:true
    })
  
    document.getElementById('user1').srcObject=localStream;

}


const createPeerConnection = async() =>{
peerConnection = new RTCPeerConnection();

remoteStream = new MediaStream();
remoteStream=document.getElementById('user2').srcObject;
}


const createOffer= async()=>{
    offer= await peerConnection.createOffer();
    console.log('Offer:')
    console.log(offer);

    peerConnection.setLocalDescription(offer);
    
}

const sendOffertoSignalingServer =()=>{
    
    socket= io.connect('https://localhost:3000');
    console.log(socket);
    socket.emit('newOffer',offer);
}

getUserMediaStream();
createPeerConnection();
createOffer();
sendOffertoSignalingServer();
