
import { error } from '../../../packages/ui/src/abc/shared';

interface SignalingMessage {
    type: string
    data?: any
}
interface JsonReply {
  id: number
  error?: string
  result?: any
}

class WebRTCApp {
  //socket?: WebSocket;
  pc?: RTCPeerConnection;
  channel?: RTCDataChannel;

  async connect(signalingUrl: string, config: RTCConfiguration, listen: boolean) {
    const socket = new WebSocket(signalingUrl);
    const signal = (message: SignalingMessage) => {
      socket.send(JSON.stringify(message))
    }

    socket.onerror = () => {
      console.log("error")
    }
    socket.onclose = () => {
      console.log("closed")
    }

    socket.onopen = async () => {
      const pc = new RTCPeerConnection(config);
      // must be before offer
      if (!listen) {
        this.channel = pc.createDataChannel('test');
      }

      this.pc = pc
      this.pc.onicecandidateerror = (e) => {
        console.log("ice candidate error", e)
      }

      this.pc.onicecandidate = (candidate) => {
        console.log("ice candidate", candidate)
        socket?.send(JSON.stringify({ type: 'icecandidate', data: candidate }));
      };

      this.pc.ondatachannel = (channel) => {
        console.log("have data channel")
        this.channel = channel.channel;
        this.channel.onmessage = (message) => {
          console.log('Received message:', message.data);
        }
      };

      socket.onmessage = async (m) => {
        console.log('Received message:', m.data);
        const reply = JSON.parse(m.data) as JsonReply;
        const message = m.data as SignalingMessage;

        switch (message.type) {
          case 'offer':
            await pc.setRemoteDescription(message.data);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.send(JSON.stringify({ type: 'answer', data: answer }));
            break;
          case 'answer':
            console.log("got answer", message.data)
            await pc.setRemoteDescription(message.data);
            console.log("creating data channel")
            this.channel!.onerror = (error) => {
              console.log("channel error", error)
            }
            this.channel!.onmessage = (message) => {
              console.log("channel message", message)
            }
            this.channel!.onclose = () => {
              console.log("channel closed")
            }
            this.channel!.onopen = (message) => {
              console.log("channel open")
              for (let i = 0; i < 10; i++) {
                this.channel?.send(`Hello, world! ${i}`);
              }
            }

            break;
          case 'icecandidate':
            await pc.addIceCandidate(message.data);
            break;
        }


      };

      if (!listen) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.send(JSON.stringify({ type: 'offer', data: offer }));
      }
    }

  }

}

const app1 = new WebRTCApp()
app1.connect('ws://localhost:8080/ws?id=1', {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}, true)



const app2 = new WebRTCApp()
app2.connect('ws://localhost:8080/ws?id=2', {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}, false);

