import { Request, Response } from "express";
import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import { HttpException } from "../../../../exceptions";
import { defaultErrorHandler } from "../../../../utils/ErrorHandler";
import Chat from "..";

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
            const getIdbotChatResponse: v1.GetIdbotChatResponse = {
                status: 0,
                message: "",
                chatOutput: "이디봇 서비스는 현재 점검 중입니다. 불편을 드려 죄송합니다.",
            };
            res.status(200).json(getIdbotChatResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }
}

export default Idbot;
