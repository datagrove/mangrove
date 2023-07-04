
import { Peer, TransferableResult, WorkerChannel, apiListen } from '../../abc/src'
import { Db, ScanApi, ScanQuery, ScanWatcherApi, TabStateApi, scanApi } from './mvr_shared'

// @ts-ignore
import LocalState from './mvr_worker?sharedworker'
// @ts-ignore
import DbWorker from './sqlite_worker?worker'
// @ts-ignore
import LogWorker from './opfs_worker?worker'

import { MvrServer } from './mvr_worker'

export class TabStateBase extends Db {
    api!: Peer
    ps?: MvrServer
  
    defaultSite() : string {
      return "" // TODO
    }
  
    async createDb() {
      const lw = new LogWorker()
      const lwp = new MessageChannel()
      const dc = new MessageChannel()
  
      // no api with the webrtc, just funnel to the worker
      let r = new RTCDataChannel()
      r.onmessage = function (e) {
        dc.port1.postMessage(e.data)
      }
      dc.port1.onmessage = function (e) {
        r.send(e.data)
      }
  
      // send one port to the worker, and one to the shared worker
      console.log("%c sending port to worker", "color:blue")
      lw.postMessage(lwp.port1, [lwp.port1])
  
      const dbc = new MessageChannel()
      const db = new DbWorker()
      console.log("%c sending port to db", "color:blue")
      db.postMessage([dbc.port1], [dbc.port1])
  
      // send the api (transfer the port) to the server
      return new TransferableResult([dbc.port2, lwp.port2, dc.port2], [dbc.port2, lwp.port2, dc.port2])
    }
  
    makeWorker() {
      const sw = new LocalState()
      sw.port.start()
      this.api = new Peer(new WorkerChannel(sw.port))
      apiListen<TabStateApi>(this.api, {
        createDb: this.createDb.bind(this),
      })
    }
    makeLocal() {
        const mc = new MessageChannel()
        this.api = new Peer(new WorkerChannel(mc.port1))
        apiListen<TabStateApi>(this.api, {
          createDb: this.createDb.bind(this),
        })
        this.ps = new MvrServer({ origin: "ws://localhost:8080/" })
        this.ps.connect(new WorkerChannel(mc.port2))
      }
    
      constructor(public loc: any) {
        super()
        this.makeLocal()
      }
    
}

export class RangeSource<Key, Tuple> {
    api: ScanApi
    constructor(public mp: MessagePort, public q: ScanQuery<Key, Tuple>) {
      // we have to send db thread a query
      let peer = new Peer(new WorkerChannel(mp))
      this.api = scanApi(peer)
      apiListen<ScanWatcherApi>(peer, {
        update: function (q: any[]): Promise<void> {
          throw new Error("Function not implemented.")
        }
      })
    }
  }
  