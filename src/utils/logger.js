import pino from "pino";
import { mkdirSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config();
const LOG_DIR = join(process.cwd(), "logs");
mkdirSync(LOG_DIR, { recursive: true });

const streams = [];

if (process.env.DEBUG === "true") {
  streams.push({
    stream: pino.destination(join(LOG_DIR, "debug.log")),
    level: "debug",
  });
}

const logger = pino({ level: "debug" }, pino.multistream(streams));

export { logger };
