import { Request, Response } from "express";
import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import { HttpException } from "../../../../exceptions";
import { defaultErrorHandler } from "../../../../utils/ErrorHandler";
import Chat from "..";
import path from "path";
import { spawn } from "child_process";

class Idbot extends Chat {
    constructor() {
        super();
        this.setPath("/idbot");
        this.models = [
            {
                method: "get",
                path: "/message",
                // authType: "access",
                controller: Idbot.onGetMessage,
            },
        ];
    }

    static async onGetMessage(req: Request, res: Response) {
        try {
            const getIdbotChatRequest: v1.GetIdbotChatRequest =
                req.query as any;
            if (!getIdbotChatRequest.chatInput) {
                throw new HttpException(400);
            }
            const idbotPath = path.join(
                __dirname,
                "..",
                "..",
                "..",
                "..",
                "idbot",
                "idbot.py"
            );
            const process = spawn("python", [
                idbotPath,
                getIdbotChatRequest.chatInput,
            ]);
            process.stdout.on("data", (chunk: any, error: any) => {
                if (error) {
                    throw new HttpException(500);
                }
                const chatOutput = chunk.toString("utf8");
                const getIdbotChatResponse: v1.GetIdbotChatResponse = {
                    status: 0,
                    message: "",
                    chatOutput: chatOutput,
                };
                res.status(200).json(getIdbotChatResponse);
            });
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }
}

export default Idbot;
