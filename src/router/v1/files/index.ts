import { Request, Response } from "express";
import { HttpException } from "../../../exceptions";
import { UploadedFile } from "express-fileupload";
import V1 from "..";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import config from "../../../config";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { execute } from "../../../mysql";
import { getJwtPayload } from "../../../utils";
import { logger } from "../../../utils/Logger";

class Files extends V1 {
    constructor() {
        super();
        this.setPath("/files");
        this.models = [
            {
                method: "post",
                path: "/upload/:postId",
                authType: "access",
                controller: this.onPostUploadFile,
            },
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
        const postId = req.params.postId;
        const data = req.files.data;
        if (!data) {
            throw new HttpException(400);
        }
        const payload = getJwtPayload(req.headers.authorization!);
        const handleFile = async (file: UploadedFile) => {
            const filePath = file.tempFilePath;
            const fileDir = path.dirname(filePath);
            const newFileName = `${uuidv4()}${path.extname(file.name)}`;
            const newPath = path.join(fileDir, newFileName);
            fs.renameSync(filePath, newPath);

            const formData = new FormData();
            formData.append("data", fs.createReadStream(newPath));

            const response = await fetch(config.fileServerUri, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${config.fileServerAuthKey}`,
                },
                body: formData as any,
            });
            if (!response.ok) {
                throw new HttpException(500);
            }
            if (postId) {
                await execute(
                    "INSERT INTO bbs_file(postId, ownerUid, fileName, downloadLink, mimeType, createdDate) VALUE(?, ?, ?, ?, NOW())",
                    [
                        Number(postId),
                        Number(payload.uid),
                        file.name,
                        `https://files.이디저디.com/${newFileName}`,
                        file.mimetype,
                    ]
                );
            }
        };
        if (Array.isArray(data)) {
            for (const file of data) {
                await handleFile(file);
            }
        } else {
            await handleFile(data);
        }
        res.sendStatus(200);
    }
}

export default Files;
