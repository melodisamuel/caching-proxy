import http from 'http'; 
import { getFromCache, setToCache } from './cache';
import axios, { AxiosHeaderValue } from 'axios';

function convertAxiosHeadersToNode(headers: Record<string, AxiosHeaderValue>): http.OutgoingHttpHeaders {
    const result: http.OutgoingHttpHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
        if (value !== null && value !== undefined) {
            result[key] = value.toString();
        }
    }

    return result;
}

export function startProxyServer(port: number, origin: string) {
    const server = http.createServer(async (req, res) => {
        if (!req.url) return;

        const cacheKey = req.method + ':' + req.url;

        const cachedResponse = getFromCache(cacheKey);
        if(cachedResponse) {
            res.writeHead(200, {
                'content-type': 'application/json',
                'X-Cache': 'HIT', 
                ...cachedResponse.headers, 
            });
            res.end(cachedResponse.body);
            return;
        }

        try {
            const response = await axios.get(`${origin}${req.url}`, {
                headers: req.headers,
            });

            const data = JSON.stringify(response.data); 

            setToCache(cacheKey, {
                body: data,
                headers: response.headers
            });

            res.writeHead(200, {
                'Content-Type': 'application/json',
                'X-Cache': "MISS", 
                ...convertAxiosHeadersToNode(cachedResponse.headers),
            });
            res.end(data);
        } catch (error: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error fetching from origin', details: error.message}))
        }
    });

    server.listen(port, () => {
        console.log(`Caching proxy started at http://localhost:${port} forwarding to ${origin}`); // log server info
        
    })
}