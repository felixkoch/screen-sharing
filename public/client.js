// Generate random room name if needed
if (!location.hash) {
  location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
}
const room = location.hash.substring(1);

var socket = io();
socket.emit('JOIN', room);

let clientId = null;
 socket.on('connect', () => {
    clientId = socket.id; // an alphanumeric id...
 });

// Room name needs to be prefixed with 'observable-'
const configuration = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};

let pc;


function onSuccess() {};
function onError(error) {
  console.error(error);
};


socket.on('MEMBERS', (members) => {
  console.log(`MEMBERS:`);
  console.log(members);
  const isOfferer = members.length === 2;
  startWebRTC(isOfferer);
});


socket.emit('SEND_MESSAGE', 'test');

socket.on('RECEIVE_MESSAGE', (message) => {
    // Message was sent by us
    if (clientId === message.clientId) {
      return;
    }

    if (message.sdp) {
      // This is called after receiving an offer or answer from another peer
      pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
        // When receiving an offer lets answer it
        if (pc.remoteDescription.type === 'offer') {
          pc.createAnswer().then(localDescCreated).catch(onError);
        }
      }, onError);
    } else if (message.candidate) {
      // Add the new ICE candidate to our connections remote description
      pc.addIceCandidate(
        new RTCIceCandidate(message.candidate), onSuccess, onError
      );
    }

});

// Send signaling data via Scaledrone
function sendMessage(message) {
  message.room = room;
  message.clientId = clientId;
  socket.emit('SEND_MESSAGE', message);
}

function startWebRTC(isOfferer) {
  console.log("startWebRtc("+isOfferer+")");
  pc = new RTCPeerConnection(configuration);

  // 'onicecandidate' notifies us whenever an ICE agent needs to deliver a
  // message to the other peer through the signaling server
  pc.onicecandidate = event => {
    if (event.candidate) {
      sendMessage({'candidate': event.candidate});
    }
  };

  // If user is offerer let the 'negotiationneeded' event create the offer
  if (isOfferer) {
    pc.onnegotiationneeded = () => {
      pc.createOffer().then(localDescCreated).catch(onError);
    }
  }

  // When a remote stream arrives display it in the #remoteVideo element
  pc.onaddstream = event => {
    remoteVideo.srcObject = event.stream;
  };

    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    }).then(stream => {
      // Display your local video in #localVideo element
      localVideo.srcObject = stream;
      // Add your stream to be sent to the conneting peer
      pc.addStream(stream);
    }, onError);
  
}

function localDescCreated(desc) {
  pc.setLocalDescription(
    desc,
    () => sendMessage({'sdp': pc.localDescription}),
    onError
  );
}
