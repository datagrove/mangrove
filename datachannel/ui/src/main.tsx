
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
    //const ws = new WebSocket("ws://localhost:8080")
    
    const connect = ()=> {
        const peerConnection = new RTCPeerConnection() // eslint-disable-line
        const ch = peerConnection.createDataChannel('dataChannel')
        ch.onopen = () => {
            console.log('data channel open')
        }
        ch.onclose = () => {
            console.log('data channel closed')
        }
        ch.onmessage = (e: MessageEvent) => {
            console.log('data channel message', e.data)
        }
        ch.onerror = (e: any) => {
            console.log('data channel error', e)
        }
    
        peerConnection.createOffer().then(offer => {
          peerConnection.setLocalDescription(offer)
    
          fetch('http:/localhost:8080/api/whap', {
            method: 'POST',
            body: offer.sdp,
            headers: {
              Authorization: `Bearer ${location.pathname.substring(1)}`,
              'Content-Type': 'application/sdp'
            }
          }).then(r => {
            // const parsedLinkHeader = parseLinkHeader(r.headers.get('Link'))
            // setLayerEndpoint(`${window.location.protocol}//${parsedLinkHeader['urn:ietf:params:whep:ext:core:layer'].url}`)
    
            // const evtSource = new EventSource(`${window.location.protocol}//${parsedLinkHeader['urn:ietf:params:whep:ext:core:server-sent-events'].url}`)
            // evtSource.onerror = err => evtSource.close();
    
            // evtSource.addEventListener("layers", event => {
            //   const parsed = JSON.parse(event.data)
            //   setVideoLayers(parsed['1']['layers'].map(l => l.encodingId))
            // })
            return r.text()
          }).then(answer => {
            peerConnection.setRemoteDescription({
              sdp: answer,
              type: 'answer'
            })
          })
        })
    

    
    }
    return <>
        <button onClick={connect}>connect</button>
    </>
}
render(() => (<App />), document.getElementById("app")!)