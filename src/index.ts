import * as iio from 'socket.io'
var s: iio.Server = require('socket.io')
import { Querier } from './queryier';
import { appendFile, WriteFileOptions, readFile, readFileSync } from 'fs';
import { hostname } from 'os';
const HISTORY_PATH = "sql_history.log";
var PORT = process.env.PORT || 3002
let li = s.listen(PORT)
    .on('connect', (socket: iio.Socket) => {

        socket.on("message", async data => {
            // console.log("data: ", data)        
            appendFile(HISTORY_PATH,
                String.fromCharCode(1) +
                String.fromCharCode(2) +
                Date() +
                String.fromCharCode(10) +
                String.fromCharCode(3) +
                data + String.fromCharCode(10)
                , err => { })
            var q = new Querier(data)
            socket.emit("start", { totalInstances: 252 })
            q.setSocket(socket)
            q.execQueries();


        }).on('history', async data => {
            var history: string[] = []
            var content = (readFileSync('sql_history.log')).toString()
            var sp: string[] = content.split(String.fromCharCode(10) +
                String.fromCharCode(3))

            var t: string
            var sep = String.fromCharCode(1) + String.fromCharCode(2)
            sp = sp.slice(-900)
            for (t of sp) {
                // console.log(t)
                let t2 = t.split(sep)
                history.push(t2[0])
            }
            let h = []
            // tslint:disable-next-line: max-line-length
            history = history.filter((e: string) => (e.length > 20 ? 1 : 0)).map(el => el.trim())
            h = history.filter((el, i) => {
                if (history.lastIndexOf(el) == i) {
                    return 1
                }
            }).map(e => {
                return { text: e, full: false }
            })
            socket.emit('history', h.reverse())
        })

    })



li.on("connection", socket => {
    console.log('connection ', socket.handshake.address)

    socket.emit("serverList", Querier.servers)
})
li.on("message", data => {
    console.log("li_data: ", data)
}).on("serverList", async data => {
    console.log("serverList", Querier.servers)

})
console.log(`WebSockets started on ${hostname()}:${PORT}`)
if (process.argv.includes('stop')) {
    console.log(`args includes ''stop''. Stoping`)
    li.removeAllListeners()
    li.server.close()
    process.exit(0)
}