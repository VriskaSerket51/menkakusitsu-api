import { Request, Response } from "express";
import { HttpException } from "../../../exceptions";
import { defaultErrorHandler } from "../../../utils/ErrorHandler";
import { UploadedFile } from "express-fileupload";
import V1 from "..";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import config from "../../../config";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { execute } from "../../../mysql";
import { getJwtPayload } from "../../../utils/Utility";

class Files extends V1 {
    constructor() {
        super();
        this.setPath("/files");
        this.models = [
            {
                method: "post",
                path: "/upload/:postId",
                authType: "access",
                controller: Files.onPostUploadFile,
            },
            {
                method: "post",
                path: "/upload",
                authType: "access",
                controller: Files.onPostUploadFile,
            },
        ];
    }

    static async onPostUploadFile(req: Request, res: Response) {
        try {
            if (!req.files) {
                throw new HttpException(400);
            }
            const postId = req.params.postId;
            const data = req.files.data;
            if (!data) {
                throw new HttpException(400);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            const handleFile = (file: UploadedFile) => {
                const filePath = file.tempFilePath;
                const fileDir = path.dirname(filePath);
                const newFileName = `${uuidv4()}${path.extname(file.name)}`;
                const newPath = path.join(fileDir, newFileName);
                fs.renameSync(filePath, newPath);

                const stats = fs.statSync(newPath);
                const fileSize = stats.size;

                const formData = new FormData();
                formData.append("data", fs.createReadStream(newPath));

                fetch("https://files.이디저디.com/files/upload", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${config.authKey}`,
                    } as any,
                    body: formData as any,
                });

                if (postId) {
                    execute(
                        "INSERT INTO bbs_file(postId, ownerUid, fileName, downloadLink, isImage, createdDate) VALUE(?, ?, ?, ?, NOW())",
                        [
                            Number(postId),
                            Number(payload.uid),
                            file.name,
                            `https://files.이디저디.com/${newFileName}`,
                            file.mimetype.startsWith("image"),
                        ]
                    );
                }
            };
            if (Array.isArray(data)) {
                for (const file of data) {
                    handleFile(file);
                }
            } else {
                handleFile(data);
            }
            res.sendStatus(200);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }
}

export default Files;
