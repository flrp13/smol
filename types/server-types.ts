import { Server } from "node:http"
import { mimeTypes } from "../src/mimeTypes.ts"
import { IncomingMessage } from "node:http"
import { ServerResponse } from "node:http"

export interface SmolApp {
    routes: {
        get: Record<string, (req: IncomingMessage, res: ServerResponse) => void>,
        post: Record<string, (req: IncomingMessage, res: ServerResponse) => void>,
        delete: Record<string, (req: IncomingMessage, res: ServerResponse) => void>,
    },
    get(path: string, cb: () => void): SmolApp,
    post(path: string, cb: () => void): SmolApp,
    delete(path: string, cb: () => void): SmolApp,
    listen(port: number, cb: () => void): Server
}

export type SupportedExtension = keyof typeof mimeTypes
export type HttpMethod = 'get' | 'post' | 'delete'