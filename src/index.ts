import * as iio from 'socket.io'
var s: iio.Server = require('socket.io')
var so: iio.ServerOptions

import { Querier } from './queryier';
import { appendFile, WriteFileOptions } from 'fs';
import { hostname } from 'os';
const HISTORY_PATH = "sql_history.log";
//const q = new Querier()
var PORT = process.env.PORT || 3002
let li = s.listen(PORT).on('connect', (socket: iio.Socket) => {

  socket.on("message", async data => {
    // console.log("data: ", data)
    let writeOpts: WriteFileOptions = {}
    appendFile(HISTORY_PATH,
      data + String.fromCharCode(10) +
      String.fromCharCode(1) +
      String.fromCharCode(2) +
      String.fromCharCode(3), err => { })
    var q = new Querier(data)
    socket.emit("start", {totalInstances:233})
    q.setSocket(socket)
    q.execQueries();


  })
  
})

li.on("connection", socket => {
  console.log('connection')
})
li.on("message", data => {
  console.log("li_data: ", data)
})
console.log(`WebSockets started on ${hostname()}:${PORT}`)
if (process.argv.includes('stop')) {
  console.log(`args includes ''stop''. Stoping`)
  li.removeAllListeners()
  li.server.close()
  process.exit(0)
}