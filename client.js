

let localStream;
let remoteStream;
let peerConnection;
let offer;
let answer;
let isFromOfferer=false;
let userId=null;

let stunServers={
    iceServers:[
        {
            urls:[
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302' ,
              'stun:stun3.l.google.com:19302',
              'stun:stun4.l.google.com:19302'
            ]
        }
    ]
}

const generateRandomUserId=()=>{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){
        const random = (Math.random()*16) | 0;
        const v= c=='x'? random : (random & 0x3) | 0x8;
        return v.toString(16);
    })
}
userId=generateRandomUserId();
console.log(`new user joins,user id: ${userId}`);
console.log(`user: ${userId} connected to the signaling server`);
const socket= io.connect('https://localhost:3000',{
auth:{
    userId
}
});



// if the new user intiates the call
const connect = async()=>{
    isFromOfferer=true;
    console.log(`user: ${userId} intiates a call`)
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
    console.log(`user: ${userId} local stream`,localStream);
}


const createPeerConnection = async(offererOffer) =>{
peerConnection = await new RTCPeerConnection(stunServers);

console.log(`Peer Connection for ${userId}`,peerConnection);
remoteStream = new MediaStream();
remoteStream=document.getElementById('others-media').srcObject;

console.log('other user remote stream',remoteStream);

addLocalTrackToPeerConnection();
listenAndsendIceCandidatesToSignalingServer();
if(offererOffer){
    listenForOffererTrackAndAddToPeerConnection();
    await peerConnection.setRemoteDescription(offererOffer.offer);
    console.log(`Peer Connection remote description changed`);
}
}

const addLocalTrackToPeerConnection =()=>{
 
    localStream.getTracks().forEach(track => {
    console.log(`New track added to peer connection local stream for user: ${userId}`,track);
    peerConnection.addTrack(track,localStream);
    });
}

const listenAndsendIceCandidatesToSignalingServer =()=>{

    peerConnection.addEventListener('icecandidate',event=>{
    
        console.log(`Ice candidate for user: ${userId}`,event.candidate);
        if(event.candidate){
            socket.emit('iceCandidate',{
                iceCandidate: event.candidate,
                userId: socket.id,
                iceUserId:userId,
                isFromOfferer
            })
        }
    })
}


const setAnswerToPeerConnection = async(offererObj)=>{
    await peerConnection.setRemoteDescription(offererObj.answer);
}



const createOffer= async()=>{
    offer= await peerConnection.createOffer();
    console.log(`Offer: for user: ${userId}`,offer);
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
    offererObj.answerUserId=userId;
    console.log(`Offer updated with answer`,offererObj)
    const offererIceCandidate=await socket.emitWithAck('answer',offererObj);
    console.log(`offer ice candidates recieved`,offererIceCandidate);
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

const addIceCandidateToPeerConnection=(iceCandidate)=>{
    peerConnection.addIceCandidate(iceCandidate);
    console.log('Ice Candidate Added to Peer Connection...')
}

const answerOffer =async(offererOffer)=>{
    isFromOfferer=false;
    console.log('I have accepted the offer',offererOffer);
    await getUserMediaStream();
    await createPeerConnection(offererOffer);
    await createAnswer();
    await sendAnswerToSignalingServer(offererOffer);
}

document.getElementById('call').addEventListener('click',connect);



