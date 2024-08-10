

let localStream;
let remoteStream;
let peerConnection;
let offer;


let stunServers={
    iceServers:[
        {
            urls:[
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302' 
            ]
        }
    ]
}



console.log('New user joins..')
console.log("New user connected to the signaling server")
const socket= io.connect('https://localhost:3000');


// if the new user intiates a call
const call = async()=>{
    
    console.log('New user intiates a call')
    await getUserMediaStream();
    await createPeerConnection();
    await createOffer();
    sendOffertoSignalingServer();
    
    }

const getUserMediaStream = async() => {
    
    // ask the new user to share his audio and video and set it to his local stream
    localStream=await navigator.mediaDevices.getUserMedia({
        video:true,
       audio:true
    })
    document.getElementById('my-media').srcObject=localStream;
    console.log('New user local stream',localStream);
}


const createPeerConnection = async() =>{
peerConnection = await new RTCPeerConnection(stunServers);

console.log('Peer Connection',peerConnection);
remoteStream = new MediaStream();
remoteStream=document.getElementById('others-media').srcObject;

console.log('Other User Remote stream',remoteStream);
addLocalTrackToPeerConnection();
listenAndsendIceCandidatesToSignalingServer();
}

const addLocalTrackToPeerConnection =()=>{
 
    localStream.getTracks().forEach(track => {
        console.log('New track added to peer connection local stream',track);
    peerConnection.addTrack(track,localStream);
    });
}

const listenAndsendIceCandidatesToSignalingServer =()=>{

    peerConnection.addEventListener('icecandidate',event=>{
    
        console.log('Ice candidate',event.candidate);
        if(event.candidate){
            socket.emit('OffererIceCandidate',{
                iceCandidate: event.candidate
            })
        }
    })
}




const createOffer= async()=>{
    offer= await peerConnection.createOffer();
    console.log('Offer:',offer);
    peerConnection.setLocalDescription(offer);
    
}

const sendOffertoSignalingServer =()=>{
    console.log('Sending offer to the signaling server..')
    socket.emit('offer',offer);
}


const answerOffer =async()=>{

    await getUserMediaStream();
}

call();



