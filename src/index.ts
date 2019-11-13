import * as iio from 'socket.io'
var s: iio.Server = require('socket.io')
var so: iio.ServerOptions

import { Querier } from './queryier';
import { appendFile, WriteFileOptions } from 'fs';
const HISTORY_PATH = "sql_history.log";
//const q = new Querier()

let li = s.listen(3002).on('connect', (socket: iio.Socket) => {

  socket.on("message", data => {
    // console.log("data: ", data)
    let writeOpts: WriteFileOptions = {}
    appendFile(HISTORY_PATH,
      data +  String.fromCharCode(10) +
      String.fromCharCode(1) +
      String.fromCharCode(2) +
      String.fromCharCode(3), err => { })
    var q = new Querier(data)
    q.setSocket(socket)
    q.execQueries();


  })
  
})

li.on("connection", socket => {
  //console.log(socket)
})
li.on("message", data => {
  //console.log("li_data: ", data)
})