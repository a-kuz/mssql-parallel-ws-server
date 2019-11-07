import { readFileSync, appendFileSync } from 'fs';
import { ConnectionPool, IRecordSet, IResult, IRow } from 'mssql'
import { ServerHttp2Stream } from 'http2';
// import { } from 'tslib'


export class Querier {
  constructor(strQ: string) {
    this.resultTable = []
    this.strQ = strQ
  }

  private servers: any[]
  private strQ: string
  private resultTable: any[] = []
  private stream: ServerHttp2Stream
  private socket

  public setHttp2Stream(stream: ServerHttp2Stream) {
    this.stream = stream
  }
  public setSocket(socket) {
    this.socket = socket;
  }
  async executeSQL(connectionString: string, strQ: string | TemplateStringsArray): Promise<IResult<IRow>> {
    // try {
    let pool: ConnectionPool
    let conn: ConnectionPool
    let result: IResult<any>

    const q: TemplateStringsArray = strQ as any
    try {
      pool = await new ConnectionPool(connectionString)
      conn = await pool.connect()
      result = await conn.query(q)
    } catch (e) {
      return e
    }
    return result
  }

  async processing(): Promise<any> {

    // const r = await Promise.all(
    let r = this.servers.map(async (server) => {
      let ob: any
      try {
        const result = await this.executeSQL("mssql://sa:ser09l@" + server.СерверSQL + "/sup_kkm", this.strQ)
        const recordset: IRecordSet<any> | Error = result.recordset
        if (this.resultTable.length === 0) {
          this.resultTable = [recordset]
        }
        if (recordset == undefined) { ob = [{ id:Math.random(),ib: server.Код }] } else {
          ob = recordset.map((el) => {
            el.ib = server.Код
            el.id = Math.random()
            return el
          })
        }
        this.resultTable = this.resultTable.concat([...ob])
      } catch (err) {
        ob = [{ ib: server.СерверSQL, err }]
        this.resultTable = this.resultTable.concat([...ob])
      }
      return ob
    })
    return r
  }


  async execQueries() {
    this.servers = this.servers || JSON.parse(readFileSync('config\/servers.json').toString())
    console.log(this.strQ)
    const f = await this.processing()

    for await (const obj of f) {
      let str = ""
      try {
        if (obj.length) {
          obj.map((el: { [s: string]: unknown; } | ArrayLike<unknown>) => {
            str = str === "" ? "" : '\n'
            if (this.socket) {
              this.socket.send(el)
            }
            for (let v of Object.values(el)) {

              str += '\t' + v
            }
          })
          console.log(str)

        }

      } catch (e) {
        console.log(e)
        console.log(obj)
      }
    }
    let gt = []
    gt.sort((a, b) => { return (a.ib > b.ib ? 1 : 0) })
    console.table(this.resultTable)
    if (this.socket) {
      this.socket.send(JSON.stringify(this.resultTable))

      this.socket.end()

    }
  }
}
