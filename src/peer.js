const { servers } = require('../config');
const { uuid, errorHandler } = require('./utils');

const inits = {
  stream: null,
  selfId: null,
  removeVideoEl: null,
  localVideoEl: null,
  serverConnection: null,
  peerConnection: null,
  peerConnectionConfig: servers,
};

const RTC = module.exports = inits;

RTC.pageReady = (stream) => {
  // Set stream
  RTC.stream = stream;
  RTC.selfId = uuid();

  RTC.remoteVideoEl = document.getElementById('localVideo');
  RTC.localVideoEl = document.getElementById('remoteVideo');
  RTC.localVideoEl.srcObject = stream;

  RTC.serverConnection = new WebSocket(`wss://${window.location.hostname}:8443`);
  RTC.serverConnection.onmessage = RTC.gotMessageFromServer;
};

RTC.start = (isCaller) => {
  RTC.peerConnection = new webkitRTCPeerConnection(RTC.peerConnectionConfig);
  RTC.peerConnection.onicecandidate = RTC.otIceCandidate;
  RTC.peerConnection.onaddstream = (event) => {
    RTC.remoteVideoEl.srcObject = event.stream;
  };
  RTC.peerConnection.addStream(RTC.stream);

  if (isCaller) {
    RTC.peerConnection
      .createOffer()
      .then(RTC.createdDescription)
      .catch(err => errorHandler(err, 'start, isCaller'));
  }
};

// Websocket message received.
RTC.gotMessageFromServer = (payload) => {
  if (!RTC.peerConnection) RTC.start(false);
  const message = JSON.parse(payload.data);
  if (message.uuid === RTC.selfId) return;

  if (message.sdp) {
    RTC.peerConnection
      .setRemoteDescription(new RTCSessionDescription(message.sdp))
      .then(() => {
        // Only create answers in response to offers
        if (message.sdp.type === 'offer') {
          RTC.peerConnection
            .createAnswer()
            .then(RTC.createdDescription)
            .catch(err => errorHandler(err, 'gotMessage, sdp, offer'));
        }
      }).catch(err => errorHandler(err, 'gotMessage, sdp'));
  } else if (message.ice) {
    RTC.peerConnection
      .addIceCandidate(new RTCIceCandidate(message.ice))
      .catch(err => errorHandler(err, 'gotMessage, ice'));
  }
};

// When an ICE candidate is acquired it should be added
// to the possible ICE candidates of the peer connection
// for the browser to attempt a connection through.
RTC.gotIceCandidate = (event) => {
  if (event.candidate != null) {
    // Send the ice candidate to the server for broadcasting
    RTC.serverConnection.send(JSON.stringify({
      ice: event.candidate,
      uuid: RTC.selfId,
    }));
  }
};

// When a description of oneself is created it should
// be set to the local peer connection and then forwarded
// on to the signalling server for distribution.
RTC.createdDescription = (description) => {
  RTC.peerConnection
    .setLocalDescription(description)
    .then(() => {
      RTC.serverConnection
        .send(JSON.stringify({
          sdp: RTC.peerConnection.localDescription,
          uuid: RTC.selfId,
        }));
    })
    .catch(err => errorHandler(err, 'createdDescription'));
};
