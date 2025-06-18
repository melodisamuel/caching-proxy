#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const server_1 = require("./server");
const cache_1 = require("./cache");
const program = new commander_1.Command();
program
    .option("--port <number>", "Port number")
    .option("--origin <url>", "Origin server URL")
    .option("--clear-cache", "Clear the cache");
program.parse(process.argv);
const options = program.opts();
if (options.clearCache) {
    (0, cache_1.clearCache)();
    console.log('Cache cleared.');
    process.exit(0);
}
if (options.port && options.origin) {
    const port = parseInt(options.port, 10);
    const origin = options.origin;
    (0, server_1.startProxyServer)(port, origin);
}
else {
    console.log('Usage: caching-proxy --port <number> --origin <url>');
}
