require("express-async-errors");
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { defaultRouter } from "./router";
import fileUpload from "express-fileupload";
import path from "path";
import { errorHandler } from "./middlewares";

class App {
    expressApp: express.Application;

    constructor() {
        this.expressApp = express();
        this.initMiddlewares();
        this.initRouters();
        this.initErrorHandlers();
    }

    run(
        port: number,
        onSuccessed: () => void,
        onFailed: (...args: any[]) => void
    ) {
        this.expressApp.listen(port, onSuccessed).on("error", onFailed);
    }

    initMiddlewares() {
        this.expressApp.use(helmet());
        this.expressApp.use(cors());
        this.expressApp.use(express.json());
        this.expressApp.use(
            fileUpload({
                limits: { fileSize: 50 * 1024 * 1024 },
                useTempFiles: true,
                tempFileDir: path.join(__dirname, "..", "tmp"),
            })
        );
    }

    initRouters() {
        this.expressApp.use("/", defaultRouter);
    }

    initErrorHandlers() {
        this.expressApp.use(errorHandler);
    }
}

export default App;
