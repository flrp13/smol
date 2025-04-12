import './overrides.ts'
import http, { IncomingMessage } from 'node:http'
import path from 'node:path'
import fs from 'node:fs/promises'
import type { ErrorResponse } from '../types/error-types.ts'
import type { SmolApp } from '../types/server-types.ts'
import { ServerResponse } from 'node:http'
import { getContentType, isValidMethod } from './utils.ts'

async function serveStaticFile(pathname: string, res: ServerResponse) {
    try {
        const filePath = pathname.substring(1) // cut leading slash
        const stats = await fs.stat(filePath)

        if (stats.isFile()) {
            const fileHandle = await fs.open(filePath, 'r')
            const readStream = fileHandle.createReadStream()

            readStream.on('error', err => {
                console.log(`Error streaming file: ${err}`)
                res.sendJson(500, errorResponse({ status: 500, message: 'Server error' }))
            })

            readStream.pipe(res)

            return true
        }
    } catch (err) {
        return false
    }
}

export function smol() {
    const app = {} as SmolApp

    app.routes = {
        get: {},
        post: {},
        delete: {},
    }

    app.get = function (path, cb) {
        app.routes.get[path] = cb
        return app
    }

    app.post = function (path, cb) {
        app.routes.post[path] = cb
        return app
    }

    app.delete = function (path, cb) {
        app.routes.delete[path] = cb
        return app
    }

    app.listen = function (port, cb) {
        const server = http.createServer((req, res) => handleRequest(req, res, app))
        server.listen(port, cb)
        return server
    }

    return app

}

async function handleRequest(req: IncomingMessage, res: ServerResponse, app: SmolApp) {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`)
    const pathname = url.pathname
    const method = req.method?.toLowerCase()
    const extension = path.extname(pathname).substring(1) // cut the leading dot
    const mimeType = getContentType(extension)

    if (!mimeType) {
        const message = `Extension .${extension} not found or supported`
        const code = 'RESOURCE_NOT_FOUND'
        res.sendJson(404, errorResponse({ pathname, message, code, method }))
        return
    }

    if (!extension) {
        if (method && isValidMethod(method)) {
            if (!(pathname in app.routes[method])) {
                res.sendJson(404, errorResponse({ pathname, method }))
                return
            }
            if (method == 'post') {
                const body = await bodyParser(req, res, pathname, method)
                if (!body) return
                req.body = body
            }
            app.routes[method][pathname](req, res)
        } else {
            res.sendJson(405, errorResponse({
                status: 405,
                message: 'Method Not Allowed',
                pathname,
                method
            }))
        }
    } else {
        // if it returns false we respond manually
        // otherwise it's enough to just call it
        if (!(await serveStaticFile(pathname, res))) {
            app.routes.get['/not-found'](req, res)
        }
    }
}

function errorResponse(opt: ErrorResponse = {}) {
    return JSON.stringify({
        error: {
            status: opt.status ?? 404,
            message: opt.message ?? 'Resource not found',
            code: opt.code ?? 'RESOURCE_NOT_FOUND',
            ...(opt.pathname ? { pathname: opt.pathname } : {}),
            ...(opt.method ? { method: opt.method } : {})
        }
    })
}

async function bodyParser(req: IncomingMessage, res: ServerResponse, pathname: string, method: string): Promise<JSON | null> {
    const contentType = req.headers['content-type']
    if (!contentType?.startsWith('application/json')) {
        res.sendJson(413, errorResponse({
            status: 413,
            message: 'Content-Type missing or incorrect',
            code: 'CONTENT_TYPE_MISSING_OR_INCORRECT',
            pathname,
            method
        }))
    }
    const chunks = []
    for await (let chunk of req) {
        chunks.push(chunk)
    }
    const buf = Buffer.concat(chunks)
    try {
        const body = JSON.parse(buf.toString())
        return body
    } catch (e) {
        res.sendJson(413, errorResponse({
            status: 413,
            message: 'Invalid JSON',
            code: 'INVALID_JSON',
            pathname,
            method
        }))
    }
    return null
}