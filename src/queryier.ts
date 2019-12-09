import * as util from 'util';
import { readFileSync, appendFileSync } from 'fs';
import { ConnectionPool, IRecordSet, IResult, IRow } from 'mssql'
import { config } from 'mssql'
import * as mssql from 'mssql'
import * as ws from 'socket.io'
import { type } from 'os';

var perf_last: number = Date.now();

export class Querier {
    constructor(strQ: string) {

        let serversJSON = readFileSync('config\/servers.json').toString()

        this.servers = JSON.parse(serversJSON).sort(() => Math.random() > 0.5 ? 0 : -1)
        // this.resultTable = []
        this.strQ = strQ

    }
    private doned: number = 0
    private fullDoned: number = 0
    private servers: any[]
    private TsqlQuery: string
    private td: TextDecoder = new TextDecoder

    public set strQ(v: string) {
        this.TsqlQuery = v;
    }

    public get strQ(): string {
        return this.TsqlQuery;
    }


    // private resultTable: any[] = []
    private socket: ws.Socket

    public setSocket(socket: ws.Socket) {
        this.socket = socket;
        socket.emit("start", { totalInstances: (this.servers.length) })
    }
    async executeSQL(connectionString: config): Promise<IResult<IRow>> {
        // try {
        let pool: ConnectionPool
        let conn: ConnectionPool
        var result: IResult<any>


        const q: TemplateStringsArray = this.strQ as any
        try {
            var conf = {}
            
            pool = new ConnectionPool(connectionString)
            conn = await pool.connect()
            result = await conn.query(q)
            pool.close()
        } catch (e) {
            console.error(e)
            return e
        }
        return result
    }

    async processing(): Promise<any> {
        this.doned = 0
        console.log('processing')
        var j: number

        return this.servers.map(async (server, i: number) => {
            this.doned = this.doned + 1
            j = 0
            let ob: any
            let q = this.strQ
            var result
            try {
                let c: config = {
                    database: 'sup_kkm',
                    server: server.СерверSQL,
                    connectionTimeout: 2000, user: 'sa', password: 'ser09l'
                }
                result = await this.executeSQL(c)
            }
            catch (err) {
                ob = [{ ib: server.СерверSQL, err }]
                // this.resultTable = this.resultTable.concat([...ob])

            } finally {
                const recordset: IRecordSet<any> | Error = result.recordset
                // if (this.resultTable.length === 0) {
                //     this.resultTable = [recordset]
                // }
                if (recordset == undefined) { ob = [{ id: -1, ib: server.Код }] } else {
                    ob = (recordset as IRecordSet<any>).map((el) => {
                        j++
                        el.ib = server.Код
                        el.id = ((i * 10000) + j)
                        return el
                    })
                }
                // this.resultTable = this.resultTable.concat([...ob])

                return ob
            }

        })
    }


    async execQueries() {

        var f: Promise<any>[]

        // try {
        //     f = await 
        // } catch (error) {
        //     console.error('[38;2;255;; ERROR')
        //     console.error(error)
        //     if (this.socket) {
        //         this.socket.error(error)
        //         this.socket.emit('end')
        //     }
        //     return
        // }



        for await (const obj of (await this.processing())) {

            let str = ''
            try {

                if (obj.length) {
                    obj.forEach(element => {
                        Object.keys(element).forEach(key => {
                            if (Buffer.isBuffer(element[key])) {
                                element[key] = buf2hex(element[key]);    
                            }
                        });
                    });
                    if (this.socket) {
                        this.socket.send(obj)
                        console.timeStamp(obj[0].ib)
                        this.fullDoned++
                        // tslint:disable-next-line: max-line-length
                        this.socket.emit("progress", { value: (this.fullDoned / this.servers.length * 100), bufferValue: (this.doned / this.servers.length * 100) })
                        console.log(`${perf_last - Date.now()} ${this.fullDoned} / ${this.servers.length}`)
                        perf_last = Date.now()
                    }
                }

            } catch (e) {
                console.error(e)
                console.log(obj)
            }
        }
      

        if (this.socket) {
            // this.socket.send(JSON.stringify(this.resultTable))
            this.socket.emit('end')
        }
    }
}
function buf2hex(buffer) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
  }