import { Permission } from "@common-jshs/menkakusitsu-lib";
import CommonApi from "@ireves/common-api";
import { Utility } from "@/utils";

export const customRouterMiddleware = (model: CommonApi.ModelBase) => {
  const { permission } = model;
  const middlewares = CommonApi.defaultRouterMiddlewares(model);
  if (permission != undefined) {
    middlewares.push((req, res, next) => {
      const payload = Utility.getJwtPayload(req.headers.authorization!);
      if (!payload.hasPermission(Permission.Teacher)) {
        throw new CommonApi.HttpException(403);
      }
      next();
    });
  }
  return middlewares;
};
