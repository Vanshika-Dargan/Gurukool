
socket.on('offersToAccept',offers=>{
    console.log('Hey new user, these are all the offers you can join to',offers);
    acceptOffer(offers);
})

socket.on('newOfferToAccept',offers=>{
 console.log('Existing user, new user joined ',offers);
 acceptOffer(offers);
})


socket.on('iceCandidateFromServer',iceCandidate=>{
    addIceCandidateToPeerConnection(iceCandidate);
})


socket.on('answerFromServer',offererObj=>{
    setAnswerToPeerConnection(offererObj);
})


const acceptOffer=(offers)=>{

   const parentDiv= document.getElementById('answer');

offers.forEach(offer=>{
console.log('I am currently in the process of accepting offer',offer);
const answerBtn=document.createElement('div');
answerBtn.innerHTML=`<button class=btn btn-success col-1>Answer</button>`;
answerBtn.addEventListener('click',()=>answerOffer(offer));

parentDiv.appendChild(answerBtn);

})
}