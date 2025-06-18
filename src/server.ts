import https from 'https';
import http from 'http';
import { getFromCache, setToCache } from './cache';
import axios from 'axios';

function convertHeaders(headers: any): http.OutgoingHttpHeaders {
    const result: http.OutgoingHttpHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
        if (value !== null && value !== undefined) {
            result[key] = Array.isArray(value) ? value : value.toString();
        }
    }
    return result;
}

export function startProxyServer(port: number, origin: string) {
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

    const server = http.createServer(async (req, res) => {
        if (!req.url) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'URL is required' }));
        }

        const cacheKey = req.method + ':' + req.url;
        const cachedResponse = getFromCache(cacheKey);

        if (cachedResponse) {
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'X-Cache': 'HIT',
                ...convertHeaders(cachedResponse.headers),
            });
            return res.end(cachedResponse.body);
        }

        try {
            // Construct target URL
            const targetUrl = new URL(req.url, normalizedOrigin).toString();
            console.log(`Proxying to: ${targetUrl}`);

            const response = await axios.get(targetUrl, {
                headers: {
                    ...req.headers,
                    host: new URL(normalizedOrigin).hostname,
                    accept: 'application/json',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36'
                },
                
                httpsAgent: new https.Agent({ 
                    rejectUnauthorized: false 
                }),
                validateStatus: () => true
            });

            console.log(`Response from origin: ${response.status}`);

            const responseData = JSON.stringify(response.data);
            const responseHeaders = convertHeaders(response.headers);

            if (response.status === 200) {
                setToCache(cacheKey, {
                    body: responseData,
                    headers: responseHeaders
                });
            }

            res.writeHead(response.status, {
                'Content-Type': 'application/json',
                'X-Cache': 'MISS',
                ...responseHeaders
            });
            return res.end(responseData);

        } catch (error: any) {
            console.error('Proxy error:', error.message);
            const status = error.response?.status || 500;
            res.writeHead(status, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                error: 'Proxy error',
                details: error.message,
                ...(error.response?.data && { originError: error.response.data })
            }));
        }
    });

    server.listen(port, () => {
        console.log(`\nProxy server running on http://localhost:${port}`);
        console.log(`Forwarding requests to: ${normalizedOrigin}\n`);
    });
}