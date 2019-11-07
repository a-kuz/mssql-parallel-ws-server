import * as iio from 'socket.io'
var s: iio.Server = require('socket.io')
var so: iio.ServerOptions
import {
  Server
} from './Server'
import { Querier } from './queryier';

//const q = new Querier()

let li = s.listen(3002).on('connect', (socket: iio.Socket) => {

  socket.on("message", data => {
    console.log("data: ", data)
    var q = new Querier(data)
    q.setSocket(socket)
    q.execQueries();

  })
  
})

li.on("connection", socket => {
  console.log(socket)
})
li.on("message", data => {
  console.log("li_data: ", data)
})