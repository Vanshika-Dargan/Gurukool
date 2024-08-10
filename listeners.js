
socket.on('offersToAccept',offers=>{
    console.log('Hey new user, these are all the offers you can join to',offers);
    acceptOffer(offers);
})

socket.on('newOfferToAccept',offers=>{
 console.log('Existing user, new user joined ',offers);
 acceptOffer(offers);
})


socket.on('answerFromServer',offererObj=>{
    setAnswerToPeerConnection(offererObj);
})


const acceptOffer=(offers)=>{

offers.forEach(offer=>{
console.log('I am currently in the process of accepting offer'+offer);
answerOffer(offer);
})
}