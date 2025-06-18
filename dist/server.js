"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startProxyServer = startProxyServer;
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const cache_1 = require("./cache");
const axios_1 = __importDefault(require("axios"));
function convertHeaders(headers) {
    const result = {};
    for (const [key, value] of Object.entries(headers)) {
        if (value !== null && value !== undefined) {
            result[key] = Array.isArray(value) ? value : value.toString();
        }
    }
    return result;
}
function startProxyServer(port, origin) {
    // Validate and normalize origin URL
    let normalizedOrigin = origin;
    // Ensure protocol exists
    if (!normalizedOrigin.startsWith('http')) {
        normalizedOrigin = `https://${normalizedOrigin}`;
    }
    // Remove trailing slash
    normalizedOrigin = normalizedOrigin.replace(/\/$/, '');
    // Verify the origin URL is correct
    console.log(`Configured origin: ${normalizedOrigin}`);
    const server = http_1.default.createServer((req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (!req.url) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'URL is required' }));
        }
        const cacheKey = req.method + ':' + req.url;
        const cachedResponse = (0, cache_1.getFromCache)(cacheKey);
        if (cachedResponse) {
            res.writeHead(200, Object.assign({ 'Content-Type': 'application/json', 'X-Cache': 'HIT' }, convertHeaders(cachedResponse.headers)));
            return res.end(cachedResponse.body);
        }
        try {
            // Construct target URL
            const targetUrl = new URL(req.url, normalizedOrigin).toString();
            console.log(`Proxying to: ${targetUrl}`);
            const response = yield axios_1.default.get(targetUrl, {
                headers: Object.assign(Object.assign({}, req.headers), { host: new URL(normalizedOrigin).hostname, accept: 'application/json', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36' }),
                httpsAgent: new https_1.default.Agent({
                    rejectUnauthorized: false
                }),
                validateStatus: () => true
            });
            console.log(`Response from origin: ${response.status}`);
            const responseData = JSON.stringify(response.data);
            const responseHeaders = convertHeaders(response.headers);
            if (response.status === 200) {
                (0, cache_1.setToCache)(cacheKey, {
                    body: responseData,
                    headers: responseHeaders
                });
            }
            res.writeHead(response.status, Object.assign({ 'Content-Type': 'application/json', 'X-Cache': 'MISS' }, responseHeaders));
            return res.end(responseData);
        }
        catch (error) {
            console.error('Proxy error:', error.message);
            const status = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 500;
            res.writeHead(status, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(Object.assign({ error: 'Proxy error', details: error.message }, (((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) && { originError: error.response.data }))));
        }
    }));
    server.listen(port, () => {
        console.log(`\nProxy server running on http://localhost:${port}`);
        console.log(`Forwarding requests to: ${normalizedOrigin}\n`);
    });
}
