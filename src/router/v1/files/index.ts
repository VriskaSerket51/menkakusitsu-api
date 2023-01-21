import { Request, Response } from "express";
import { HttpException } from "../../../exceptions";
import V1 from "..";
import { getJwtPayload } from "../../../utils";
import { handleFiles } from "../../../utils/Api";

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
            throw new HttpException(400);
        }
        const data = req.files.data;
        if (!data) {
            throw new HttpException(400);
        }
        const payload = getJwtPayload(req.headers.authorization!);
        const files = Array.isArray(data) ? data : [data];
        res.status(200).json({
            status: 0,
            message: "",
            files: await handleFiles(files, payload.uid),
        });
    }
}

export default Files;
