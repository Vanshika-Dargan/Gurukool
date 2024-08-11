

let localStream;
let remoteStream;
let peerConnection;
let offer;
let answer;


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
    await sendOffertoSignalingServer();
    
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


const createPeerConnection = async(offererOffer) =>{
peerConnection = await new RTCPeerConnection(stunServers);

console.log('Peer Connection',peerConnection);
remoteStream = new MediaStream();
remoteStream=document.getElementById('others-media').srcObject;

console.log('Other User Remote stream',remoteStream);
addLocalTrackToPeerConnection();
listenAndsendIceCandidatesToSignalingServer();
if(offererOffer){
    listenForOffererTrackAndAddToPeerConnection();
    await peerConnection.setRemoteDescription(offererOffer.offer);
}
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
            socket.emit('iceCandidate',{
                iceCandidate: event.candidate,
                userId: socket.id
            })
        }
    })
}


const setAnswerToPeerConnection = async(offererObj)=>{
    await peerConnection.setRemoteDescription(offererObj.answer);
}



const createOffer= async()=>{
    offer= await peerConnection.createOffer();
    console.log('Offer:',offer);
    await peerConnection.setLocalDescription(offer);
    
}
const createAnswer = async()=>{
    answer=await peerConnection.createAnswer({});
    console.log('Answer',answer);
    await peerConnection.setLocalDescription(answer);
}
const sendOffertoSignalingServer =async()=>{
    console.log('Sending offer to the signaling server..')
   await socket.emit('offer',offer);
}

const sendAnswerToSignalingServer =async(offererObj)=>{

    offererObj.answer=answer;
    const offererIceCandidate=await socket.emitWithAck('answer',offererObj);

    offererIceCandidate.forEach(iceCandidate=>{
    peerConnection.addIceCandidate(iceCandidate);
    })

}

const listenForOffererTrackAndAddToPeerConnection=()=>{

    peerConnection.addEventListener('track',event=>{
        event.streams[0].getTracks().forEach(track=>{
            remoteStream.addTrack(track,remoteStream);
            console.log('Connected Successfully...')
        })
    })
}

const answerOffer =async(offererOffer)=>{

    await getUserMediaStream();
    await createPeerConnection(offererOffer);
    await createAnswer();
    await sendAnswerToSignalingServer(offererOffer);
}

call();



