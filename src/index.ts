import { Command } from "commander";
import { startProxyServer } from "./server";
import { clearCache } from "./cache";

const program = new Command();

program
  .option("--port <number>", "Port number")
  .option("--origin <url>", "Origin server URL")
  .option("--clear-cache", "Clear the cache");

  program.parse(process.argv);
  const options = program.opts();

  if (options.clearCache) {
    clearCache();
    console.log('Cache cleared.');
    process.exit(0);
  }

  if (options.port && options.origin) {
    const port = parseInt(options.port, 10);
    const origin = options.origin;
    startProxyServer(port, origin);
  } else {
    console.log('Usage: caching-proxy --port <number> --origin <url>');
  }