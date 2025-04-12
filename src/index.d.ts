declare module 'node:http' {
    interface ServerResponse {
        sendJson(statusCode: number, data: string): void
    }
    interface IncomingMessage {
        body: JSON
    }
}

export { }