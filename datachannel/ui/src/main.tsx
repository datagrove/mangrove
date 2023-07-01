
import "./index.css"
import { render } from "solid-js/web"


export class RtcPeer {
    localConnection?: RTCPeerConnection;
    channel? : RTCDataChannel;
    constructor() {

    }

    handleSendChannelStatusChange() {
        console.log(`Send channel state is ${this.channel?.readyState}`);
    }
    
    async  createOffer() {
        const lc = new RTCPeerConnection();
        // default is reliable and and ordered
        const ch = lc.createDataChannel('label');
        ch.onopen =  ()=>{}
        ch.onclose = ()=>{}
        ch.onmessage = (e: MessageEvent)=>{}
        ch.onerror = (e: any)=>{}

        lc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
            if (e.candidate) {
                // send the candidate to the remote peer
            } else {
                // All ICE candidates have been sent
            }
        }  

        const offer = await lc.createOffer()
        await lc.setLocalDescription(offer)
    }

    async finishOffer(offer: RTCSessionDescriptionInit) {
        this.localConnection!.setRemoteDescription(offer)
    }

    async createAnswer(offer: RTCSessionDescriptionInit) {
        const rc = new RTCPeerConnection();
        rc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
            if (e.candidate) {
                // send the candidate to the remote peer
            } else {
                // All ICE candidates have been sent
            }
        }

        rc.onicecandidate = e => !e.candidate || this.localConnection!.addIceCandidate(e.candidate)

        rc.ondatachannel = (event: RTCDataChannelEvent)=> {
            const receiveChannel = event.channel;
            receiveChannel.onmessage = (event: MessageEvent) => {
                console.log(`Received message: ${event.data}`);
            };
          };

        await rc.setRemoteDescription(offer)
        const answer = await rc.createAnswer()

        await rc.setLocalDescription(answer)
        return rc.localDescription   
    }

    
}

// Define "global" variables





export function App() {
    const ws = new WebSocket("ws://localhost:8080")
    
    return <>
        <button onClick={() => { }}>connect</button>
        <input type="text" />
        <button >send</button>
    </>
}
render(() => (<App />), document.getElementById("app")!)