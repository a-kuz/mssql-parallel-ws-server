import { readFileSync } from 'fs';
import { ConnectionPool, IRecordSet, IResult, IRow, ISOLATION_LEVEL } from 'mssql'
import { config, IOptions } from 'mssql'
import ws from 'socket.io';

var connectTimeout: number = 8000
var requestTimeout: number = 900000

export class Querier {
    constructor(strQ: string = "") {
        let serversJSON = readFileSync('config\/servers.json').toString()
        Querier.servers = JSON.parse(serversJSON).sort(() => Math.random() > 0.5 ? 0 : -1)
        this.strQ = strQ
    }
    private doned: number = 0
    private fullDoned: number = 0
    static servers: any[] = JSON.parse(
        readFileSync('config\/servers.json').toString()
    ).sort(() => Math.random() > 0.5 ? 0 : -1)
    private TsqlQuery: string

    public set strQ(v: string) {
        this.TsqlQuery = v;
    }
    public get strQ(): string {
        return this.TsqlQuery;
    }

    private socket: ws.Socket
    public setSocket(socket: ws.Socket) {
        this.socket = socket;
        socket.emit("start", { totalInstances: (Querier.servers.length) })
    }
    async executeSQL(connectionString: config): Promise<IResult<IRow>> {
        // try {
        let pool: ConnectionPool
        let conn: ConnectionPool
        var result: IResult<any>
        const q: TemplateStringsArray = this.strQ as any
        pool = await new ConnectionPool(connectionString)
        conn = await pool.connect()
        result = await conn.query(q)
        await pool.close()
        return result
    }

    async processingCallback(server, i: number) {
        console.log(server)
        //this.doned = this.doned + 1
        let j = 0
        let ob: any
        var result
        var error
        try {
            let o: IOptions = {
                connectTimeout,
                isolationLevel: ISOLATION_LEVEL.READ_UNCOMMITTED,
                appName: 'mass-sql',
                maxRetriesOnTransientErrors: 2,
                requestTimeout,
                trustedConnection: false
            }
            let c: config = {
                database: 'sup_kkm',
                server: server.insance,
                connectionTimeout: connectTimeout,
                user: 'sa',
                password: 'ser09l',
                requestTimeout,
                options: o
            }
            result = (await this.executeSQL(c)).recordset
        }
        catch (error) {

            if (this.socket) {

                this.socket.emit("err",
                    {
                        error, ib: server.code
                    })
            }
            console.groupCollapsed(`err: ${error}`);
            console.log(server.code);
            console.groupEnd();
            ob = [{ ib: server.insance, error }]

            return ob
        } finally {
            const recordset: IRecordSet<any> | Error = result
            // if (this.resultTable.length === 0) {
            //     this.resultTable = [recordset]
            // }
            if (recordset == undefined) { ob = [{ id: -1, ib: server.code }] } else {
                ob = (recordset as IRecordSet<any>).map((el) => {
                    j++
                    el.ib = server.code
                    let ib_host: string = server.host.replace(/ost/, 'serv')
                    el.ib_href = `http://${ib_host}:85/sup_kkm`
                    el.id = ((i * 10000) + j)
                    return el
                })
            }
            // this.resultTable = this.resultTable.concat([...ob])
            return ob
        }
    }
    async processing(): Promise<any> {
        //this.doned = 0
        console.log('processing')
        return Querier.servers.map((e, i) => {
            return this.processingCallback(e, i)

        })
    }
    async execQueries() {

        for await (const obj of (await this.processing())) {

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
                        this.fullDoned++
                        this.socket.emit("progress",
                            {
                                value: (this.fullDoned / Querier.servers.length * 100),
                                bufferValue: (this.doned / Querier.servers.length * 100)
                            })
                        console.log(`${this.fullDoned} / ${Querier.servers.length} (${this.doned})`)

                    }
                }
            } catch (error) {
                console.error(error)
                console.log(obj)
                if (this.socket) {

                    this.socket.emit("err",
                        {
                            error, ib: obj.ib
                        })
                }
            }
        }
        if (this.socket) {
            this.socket.emit('end')
        }
    }
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}