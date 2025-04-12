import { ServerResponse } from "node:http"

ServerResponse.prototype.sendJson = function (statusCode: number, data: string) {
    this.writeHead(statusCode, {
        'Content-Length': Buffer.byteLength(data),
        'Content-Type': 'application/json'
    })
    this.end(data)
}