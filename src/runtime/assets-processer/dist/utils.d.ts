import { Request, Response, NextFunction } from 'express';
import { Options as ProxyOptions } from 'http-proxy-middleware';
/**
 * Middleware for printing each response process duration time to log
 * @param req
 * @param res
 * @param next
 */
export declare function createResponseTimestamp(req: Request, res: Response, next: NextFunction): void;
/**
 * This function uses http-proxy-middleware internally.
 *
 * Create and use an HTTP request proxy for specific request path
 * @param proxyPath
 * @param targetUrl
 */
export declare function setupHttpProxy(proxyPath: string, apiUrl: string, opts?: {
    /** Bypass CORS restrict on target server */
    deleteOrigin?: boolean;
    pathRewrite?: ProxyOptions['pathRewrite'];
    onProxyReq?: ProxyOptions['onProxyReq'];
    onProxyRes?: ProxyOptions['onProxyRes'];
    onError?: ProxyOptions['onError'];
    buffer?: ProxyOptions['buffer'];
    selfHandleResponse?: ProxyOptions['selfHandleResponse'];
    proxyTimeout?: ProxyOptions['proxyTimeout'];
}): void;
