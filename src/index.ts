import dotenv from "dotenv";
import {
    App,
    initializeConfig,
    initializeScheduler,
    logger,
} from "common-api-ts";
import config from "./config";
import { initializeFirebase } from "./firebase";
import fileUpload from "express-fileupload";
import path from "path";
import { schedules } from "./scheduler";
import { customRouterMiddleware } from "./middlewares";

dotenv.config();

initializeConfig(config);
initializeFirebase();
initializeScheduler(schedules);
runExpressApp();

function runExpressApp() {
    const app = new App(
        path.join(__dirname, "router"),
        [
            fileUpload({
                defCharset: "utf8",
                defParamCharset: "utf8",
                limits: { fileSize: 50 * 1024 * 1024 },
                useTempFiles: true,
                tempFileDir: path.join(__dirname, "..", "tmp"),
            }),
        ],
        customRouterMiddleware,
        []
    );
    app.run(
        config.port,
        () => {
            console.info(`Server started with port: ${config.port}`);
        },
        (error) => {
            logger.error(error);
        }
    );
}
