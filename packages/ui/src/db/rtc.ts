interface PeerConnectionConfig {
    iceServers: RTCIceServer[];
  }
  
  interface SignalingMessage {
    type: string;
    data?: any;
  }
  
  class SignalingChannel {
    private socket: WebSocket;
  
    constructor(url: string) {
      this.socket = new WebSocket(url);
    }
  
    send(message: SignalingMessage) {
      this.socket.send(JSON.stringify(message));
    }
  
    onmessage: (message: SignalingMessage) => void = () => {};
  }
  
  class PeerConnection {
     pc: RTCPeerConnection;
     channel?: RTCDataChannel;
  
    constructor(config: PeerConnectionConfig) {
      this.pc = new RTCPeerConnection(config);
    }
  
    createDataChannel(label: string) {
      this.channel = this.pc.createDataChannel(label);
      return this.channel;
    }
  
    async createOffer(): Promise<RTCSessionDescriptionInit> {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      return offer;
    }
  
    async setRemoteDescription(description: RTCSessionDescriptionInit) {
      await this.pc.setRemoteDescription(description);
    }
  
    async addIceCandidate(candidate: RTCIceCandidateInit) {
      await this.pc.addIceCandidate(candidate);
    }
  
    onicecandidate: (candidate: RTCIceCandidateInit) => void = () => {};
    ondatachannel: (channel: RTCDataChannel) => void = () => {};
  }
  
  class WebRTCApp {
    private signaling: SignalingChannel;
    private pc: PeerConnection;
  
    constructor(signalingUrl: string, config: PeerConnectionConfig) {
      this.signaling = new SignalingChannel(signalingUrl);
      this.pc = new PeerConnection(config);
  
      this.pc.onicecandidate = (candidate) => {
        this.signaling.send({ type: 'icecandidate', data: candidate });
      };
  
      this.pc.ondatachannel = (channel) => {
        console.log('Data channel created:', channel.label);
      };
  
      this.signaling.onmessage = async (message) => {
        switch (message.type) {
          case 'offer':
            await this.pc.setRemoteDescription(message.data);
            const answer = await this.pc.pc.createAnswer();
            await this.pc.pc.setLocalDescription(answer);
            this.signaling.send({ type: 'answer', data: answer });
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
      const channel = this.pc.createDataChannel('test');
      console.log('Data channel created:', channel.label);
  
      const offer = await this.pc.createOffer();
      await this.pc.pc.setLocalDescription(offer);
  
      this.signaling.send({ type: 'offer', data: offer });
    }
  }
  
  const app = new WebRTCApp('ws://localhost:8080', {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });
  
  app.start();