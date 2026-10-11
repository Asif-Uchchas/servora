export class RequestError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
    }
}

/** fetch() wrapper for our JSON API: throws a RequestError carrying the server's message. */
export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
    const { json, ...rest } = init ?? {};
    const res = await fetch(url, {
        ...rest,
        headers: { ...(json !== undefined && { "Content-Type": "application/json" }), ...rest.headers },
        body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new RequestError(res.status, (data && typeof data.error === "string" && data.error) || `Request failed (${res.status})`);
    }
    return data as T;
}

export const getJson = <T,>(url: string) => () => api<T>(url);
