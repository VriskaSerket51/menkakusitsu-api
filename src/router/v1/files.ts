import CommonApi from "@ireves/common-api";
import { Request, Response } from "express";

import V1 from ".";
import { Api, Utility } from "../../utils";

class Files extends V1 {
  constructor() {
    super();
    this.setPath("/files");
    this.models = [
      {
        method: "post",
        path: "/upload",
        authType: "access",
        controller: this.onPostUploadFile,
      },
    ];
  }

  async onPostUploadFile(req: Request, res: Response) {
    if (!req.files) {
      throw new CommonApi.HttpException(400);
    }
    const data = req.files.data;
    if (!data) {
      throw new CommonApi.HttpException(400);
    }
    const payload = Utility.getJwtPayload(req.headers.authorization!);
    const files = Array.isArray(data) ? data : [data];
    res.status(200).json({
      status: 0,
      message: "",
      files: await Api.handleFiles(files, payload.uid),
    });
  }
}

export default Files;
