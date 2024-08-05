

let localStream;
let remoteStream;


const getUserMediaStream = async() => {

    localStream=await navigator.mediaDevices.getUserMedia({
        video:true,
       //audio:true
    })
  
    document.getElementById('user1').srcObject=localStream;

}

getUserMediaStream();
