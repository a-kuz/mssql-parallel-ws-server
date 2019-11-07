import { readFileSync } from 'fs';
import * as http2 from 'http2';
import { Querier } from "./queryier";
import { TLSSocket } from 'tls';
import { METHODS } from 'http';
import * as url from 'url';
export class Server {
	constructor() {
		this.init()
	}
	public server: http2.Http2SecureServer;
	q: any

	stream: http2.ServerHttp2Stream
	headers: http2.IncomingHttpHeaders;
	public wwww = function (th) {
		console.log('this:')
		console.log(th)
		console.log(th.stream)
		th.stream.write('<h1>Hello World</h1>');
		th.stream.write('<h2>push </h2>');
		setTimeout(th.wwww, 1000, th);
	}

	public requestHandler(req: http2.Http2ServerRequest, res: http2.Http2ServerResponse) {
		//console.log(req)
		// this.q = req.

		if (req.method == 'GET') {
			res.end(
				readFileSync('src\/query.html')
			)
		} else {
			//console.log(req);
		}
		// this.executeQuery('select 1')
	}
	public unknown = (socket: TLSSocket) => {
		//console.dir(socket)
	}
	public streamHandler = (stream: http2.ServerHttp2Stream, headers: http2.IncomingHttpHeaders) => {
		var rawHeaders = Symbol()
		var request = Symbol()
		http2.Http2ServerRequest[Symbol('request')]
		let rh = stream[request]
		let method = headers[":method"]
		let path = headers[":path"]
		let content_type = headers['content-type']
		decodeURI(path)
		let usp = new url.URLSearchParams(path.replace(/(.*)\?/, ``))
		let query = usp.get('SQL')
		if (query) {
			this.stream = stream
			this.executeQuery(query)
			return
		}
		console.log(`\x1b[7m streamHandler: ${method} ${path}: ${content_type}\x1b[0m`)
		if (content_type != 'application/x-www-form-urlencoded') { return }
		if (method == 'GET' && path == '/') { return }

		this.stream = stream;
		stream.on('data', data => {
			console.log(`	data: ${data}`)
		})
		stream.setTimeout(20000)
		stream.pushAllowed
		headers.b

		this.headers = headers;


		//console.log(this.stream);
		if (/\/query/.test(path)) {
			// this.executeQuery(stream.);
		}
		//console.log(`${method} ${path}`);
		this.stream.respond({
			'content-type': 'text/html',
			':status': 200
		});
		// console.dir(this)
		let f = (_stream: http2.ServerHttp2Stream) => {
			_stream.write('push <= ' + Date.now())
			setTimeout(
				f
				, 1000, _stream);
		}
		setTimeout(() => {
			f
		}, 1000, stream);

	}
	private init() {
		const options: http2.SecureServerOptions = {
			key: readFileSync('keys/localhost-privkey.pem'),
			cert: readFileSync('keys/localhost-cert.pem'),
			allowHTTP1: true,

		};
		this.server = http2.createSecureServer(options);

		this.server.on('request', (req, res) => this.requestHandler(req, res))
		this.server.on('unknownProtocol', (socket) => this.unknown(socket))

		this.server.on('error', (err) => console.error(err));
		var s = this.streamHandler
		var t = this
		this.server.on('stream', (stream, headers, flags) => {
			//console.log(stream)
			s.call(t, stream, headers)
		})
		let port = 8810
		this.server.listen(port);
		// this.server.listen(port, 'ws_it_23.cd.local', 2);
		console.log('\x1b[mStart')
		console.log(`listen ${JSON.stringify(this.server.address())}:${port}.`);
	}
	async executeQuery(q: string) {
		let qe = new Querier(q)
		qe.setHttp2Stream(this.stream)
		qe.execQueries()
	}
}
