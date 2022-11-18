import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import { defaultRouter } from "./router";
import fileUpload from "express-fileupload";
import path from "path";
import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

class App {
    expressApp: express.Application;
    server: http.Server<
        typeof http.IncomingMessage,
        typeof http.ServerResponse
    >;
    io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

    constructor() {
        this.expressApp = express();
        this.server = http.createServer(this.expressApp);
        this.io = new Server(this.server);
        this.initMiddlewares();
        this.initRouters();
        this.initSocket();
        this.initLateMiddlewares();
    }

    run(
        port: number,
        onSuccessed: () => void,
        onFailed: (...args: any[]) => void
    ) {
        this.server.listen(port, onSuccessed).on("error", onFailed);
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

    initSocket() {
        this.io.use
    }

    initLateMiddlewares() {
        this.expressApp.use((req, res, next) => {
            res.sendStatus(404);
        });
    }
}

export default App;
