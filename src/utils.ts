import type { HttpMethod, SupportedExtension } from "../types/server-types.ts";
import { mimeTypes } from "./mimeTypes.ts";

export function getContentType(extension: string | undefined): string | null {
    if (!extension) return mimeTypes.json
    if (!(extension in mimeTypes)) return null
    return mimeTypes[extension as SupportedExtension]
}

export function isValidMethod(method: string | undefined): method is HttpMethod {
    return method == 'get' || method == 'post' || method == 'delete'
}