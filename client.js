

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
    await sendOfferToSignalingServer();
    
    }
   


const getUserMediaStream = async () => {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('my-media').srcObject = localStream;
        console.log(`User: ${userId} local stream`, localStream);
    } catch (error) {
        console.error('Error getting user media:', error);
    }
};

const createPeerConnection = async (offererOffer) => {
    try {
        peerConnection = new RTCPeerConnection(stunServers);

        console.log(`Peer Connection for ${userId}`, peerConnection);

        remoteStream = new MediaStream();
        document.getElementById('others-media').srcObject = remoteStream;

        addLocalTrackToPeerConnection();
        listenAndSendIceCandidatesToSignalingServer();
        listenForOffererTrackAndAddToPeerConnection();
        if (offererOffer) {
          
            await peerConnection.setRemoteDescription(offererOffer.offer);
            console.log(`Peer Connection remote description changed`);
        }
    } catch (error) {
        console.error('Error creating peer connection:', error);
    }
};

const addLocalTrackToPeerConnection = () => {
    localStream.getTracks().forEach(track => {
    console.log(`New track added to peer connection local stream for user: ${userId}`,track);
    peerConnection.addTrack(track,localStream);
    });
};

const listenAndSendIceCandidatesToSignalingServer = () => {
    peerConnection.addEventListener('icecandidate', event => {
        console.log(`ICE candidate for user: ${userId}`, event.candidate);
        if (event.candidate) {
            socket.emit('iceCandidate', {
                iceCandidate: event.candidate,
                userId: socket.id,
                iceUserId: userId,
                isFromOfferer
            });
        }
    });
};


const setAnswerToPeerConnection = async(offererObj)=>{
    await peerConnection.setRemoteDescription(offererObj.answer);
}



const createOffer = async () => {
    try {
        offer = await peerConnection.createOffer();
        console.log(`Offer for user: ${userId}`, offer);
        await peerConnection.setLocalDescription(offer);
    } catch (error) {
        console.error('Error creating offer:', error);
    }
};

const createAnswer = async () => {
    try {
        answer = await peerConnection.createAnswer();
        console.log('Answer', answer);
        await peerConnection.setLocalDescription(answer);
    } catch (error) {
        console.error('Error creating answer:', error);
    }
};

const sendOfferToSignalingServer = async () => {
    console.log('Sending offer to the signaling server..');
    try {
        await socket.emit('offer', offer);
    } catch (error) {
        console.error('Error sending offer to signaling server:', error);
    }
};

const sendAnswerToSignalingServer = async (offererObj) => {
    try {
        offererObj.answer = answer;
        offererObj.answerUserId = userId;
        console.log(`Offer updated with answer`, offererObj);
        const offererIceCandidate = await new Promise((resolve) => {
            socket.emit('answer', offererObj, (iceCandidates) => resolve(iceCandidates));
        });
        console.log(`Offer ICE candidates received`, offererIceCandidate);
        offererIceCandidate.forEach(iceCandidate => {
            peerConnection.addIceCandidate(iceCandidate);
        });
    } catch (error) {
        console.error('Error sending answer to signaling server:', error);
    }
};

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



