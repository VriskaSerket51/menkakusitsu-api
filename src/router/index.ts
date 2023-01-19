import { Router } from "express";
import { defaultModelMiddleware } from "../middlewares/jwt";
import { readAllFiles } from "../utils";
import { RouterBase } from "./RouterBase";

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
                ...defaultModelMiddleware(model),
                model.controller
            );
        });
        defaultRouter.use(subrouter.path, router);
    });

    return defaultRouter;
};

export const defaultRouter = createDefaultRouter();
