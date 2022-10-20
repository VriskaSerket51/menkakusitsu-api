import express from "express";
import cors from "cors";
import helmet from "helmet";
import { defaultRouter } from "./router";
import { createAccessToken, verifyAccessToken } from "./middlewares/jwt";

class App {
    expressApp: express.Application;

    constructor() {
        this.expressApp = express();
        this.initMiddlewares();
        this.initRouters();
        this.initSocket();
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
    }

    initRouters() {
        this.expressApp.use("/", defaultRouter);
    }

    initSocket() {}
}

export default App;
