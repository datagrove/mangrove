interface PeerConnectionConfig {
  iceServers: RTCIceServer[];
}

interface SignalingMessage {
  type: string;
  data?: any;
}

class WebRTCApp {
  socket: WebSocket;
  pc: RTCPeerConnection;
  channel?: RTCDataChannel;

  constructor(signalingUrl: string, config: PeerConnectionConfig) {
    this.socket = new WebSocket(signalingUrl);
    this.pc = new RTCPeerConnection(config);

    this.pc.onicecandidate = (candidate) => {
      this.socket.send(JSON.stringify({ type: 'icecandidate', data: candidate }));
    };

    this.pc.ondatachannel = (channel) => {
      this.channel = channel.channel;
      this.channel.onmessage = (message) => {
        console.log('Received message:', message.data);
      }
    };

    this.socket.onmessage = async (message) => {
      switch (message.type) {
        case 'offer':
          await this.pc.setRemoteDescription(message.data);
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          this.socket.send(JSON.stringify({ type: 'answer', data: answer }));
          break;
        case 'answer':
          await this.pc.setRemoteDescription(message.data);
          break;
        case 'icecandidate':
          await this.pc.addIceCandidate(message.data);
          break;
      }
    };
  }

  async start() {
    this.channel = this.pc.createDataChannel('test');
    this.channel.onmessage = (message) => {
      for (let i=0; i<10; i++) {
        this.channel?.send(`Hello, world! ${i}`);
      }
    }
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.socket.send(JSON.stringify({ type: 'offer', data: offer }));
  }
  async listen() {

  }
}

const app1 = new WebRTCApp('ws://localhost:8080', {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
});

app1.start();

const app2 = new WebRTCApp('ws://localhost:8080', {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
});

app2.listen()