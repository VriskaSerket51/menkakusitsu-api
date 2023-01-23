import { Permission } from "@common-jshs/menkakusitsu-lib";
import { defaultRouterMiddlewares, HttpException, ModelBase } from "common-api-ts";
import { getJwtPayload } from "../utils";

export const customRouterMiddleware = (model: ModelBase) => {
    const { permission } = model;
    const middlewares = defaultRouterMiddlewares(model);
    if (permission != undefined) {
        middlewares.push((req, res, next) => {
            const payload = getJwtPayload(req.headers.authorization!);
            if (!payload.hasPermission(Permission.Teacher)) {
                throw new HttpException(403);
            }
            next();
        });
    }
    return middlewares;
};
