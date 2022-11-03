import winston from "winston";
import winstonDaily from "winston-daily-rotate-file";
import { execute } from "../mysql";

const logDir = "logs";
const { combine, timestamp, printf } = winston.format;

const logFormat = printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
});

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
export const logger = winston.createLogger({
    format: combine(
        timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        logFormat
    ),
    transports: [
        new winstonDaily({
            level: "info",
            datePattern: "YYYY-MM-DD",
            dirname: logDir,
            filename: `%DATE%.log`,
            maxFiles: 30,
            zippedArchive: true,
        }),
        new winstonDaily({
            level: "error",
            datePattern: "YYYY-MM-DD",
            dirname: logDir + "/error",
            filename: `%DATE%.error.log`,
            maxFiles: 30,
            zippedArchive: true,
        }),
    ],
});

export const logToDb = async (
    type: number,
    summary: string,
    content: string
) => {
    const result = await execute(
        "INSERT INTO log(`type`, `summary`, `content`, `createdDate`) VALUE(?, ?, ?, NOW())",
        [type, summary, content]
    );
    if (summary) {
        logger.info(`[${result.insertId}]: ${summary}`);
    }
};

if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple() // `${info.level}: ${info.message} JSON.stringify({ ...rest })`
            ),
        })
    );
}
