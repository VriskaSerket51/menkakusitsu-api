import { Router, Request, Response, NextFunction } from "express";
import {
    verifyAccessTokenMiddleware,
    verifyRefreshTokenMiddleware,
} from "../middlewares/jwt";
import { readAllFiles } from "../utils/Utility";
import { RouterBase } from "./RouterBase";

const authMiddleware = (authType?: "access" | "refresh" | "optional") => {
    const middleware: ((
        req: Request,
        res: Response,
        next: NextFunction
    ) => any)[] = [];
    switch (authType) {
        case "access":
            middleware.push(verifyAccessTokenMiddleware);
            break;
        case "refresh":
            middleware.push(verifyRefreshTokenMiddleware);
            break;
        case "optional":
            middleware.push((req, res, next) => {
                verifyAccessTokenMiddleware(req, res, next, false);
            });
            break;
        default:
            break;
    }
    return middleware;
};

const createDefaultRouter = (): Router => {
    const defaultRouter = Router();

    const fileNames: string[] = [];
    readAllFiles(__dirname, fileNames, (fileName) =>
        fileName.startsWith("index")
    );

    fileNames.forEach((fileName) => {
        const module = require(fileName).default;
        if (!module || !(module.prototype instanceof RouterBase)) {
            return;
        }
        const subrouter: RouterBase = new module();

        const router = Router();
        subrouter.models.forEach((model) => {
            router[model.method](
                model.path,
                ...authMiddleware(model.authType),
                model.controller
            );
        });
        defaultRouter.use(subrouter.path, router);
    });

    return defaultRouter;
};

export const defaultRouter = createDefaultRouter();
