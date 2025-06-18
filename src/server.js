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
const http_1 = __importDefault(require("http"));
const cache_1 = require("./cache");
const axios_1 = __importDefault(require("axios"));
function convertAxiosHeadersToNode(headers) {
    const result = {};
    for (const [key, value] of Object.entries(headers)) {
        if (value !== null && value !== undefined) {
            result[key] = value.toString();
        }
    }
    return result;
}
function startProxyServer(port, origin) {
    const server = http_1.default.createServer((req, res) => __awaiter(this, void 0, void 0, function* () {
        if (!req.url)
            return;
        const cacheKey = req.method + ':' + req.url;
        const cachedResponse = (0, cache_1.getFromCache)(cacheKey);
        if (cachedResponse) {
            res.writeHead(200, Object.assign({ 'content-type': 'application/json', 'X-Cache': 'HIT' }, cachedResponse.headers));
            res.end(cachedResponse.body);
            return;
        }
        try {
            const response = yield axios_1.default.get(`${origin}${req.url}`, {
                headers: req.headers,
            });
            const data = JSON.stringify(response.data);
            (0, cache_1.setToCache)(cacheKey, {
                body: data,
                headers: response.headers
            });
            res.writeHead(200, Object.assign({ 'Content-Type': 'application/json', 'X-Cache': "MISS" }, convertAxiosHeadersToNode(cachedResponse.headers)));
            res.end(data);
        }
        catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error fetching from origin', details: error.message }));
        }
    }));
    server.listen(port, () => {
        console.log(`Caching proxy started at http://localhost:${port} forwarding to ${origin}`); // log server info
    });
}
