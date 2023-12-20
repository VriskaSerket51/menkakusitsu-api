import { Request, Response } from "express";
import { v1 } from "@common-jshs/menkakusitsu-lib";
import Chat from "..";
import fetch from "node-fetch";
import { HttpException } from "common-api-ts";
import { sanitizeRequest } from "../../../../utils/Sanitizer";

class Idbot extends Chat {
    constructor() {
        super();
        this.setPath("/idbot");
        this.models = [
            {
                method: "get",
                path: "/message",
                authType: "access",
                controller: this.onGetMessage,
            },
        ];
    }

    async onGetMessage(req: Request, res: Response) {
        const request: v1.GetIdbotChatRequest = req.query as any;
        if (!sanitizeRequest(request, "GetIdbotChatRequest")) {
            throw new HttpException(400);
        }

        const resp = await fetch(
            `http://127.0.0.1:3001/idbot/message?chatInput=${request.chatInput}`
        );
        const chatOutput = ((await resp.json()) as any).chatOutput;
        const response: v1.GetIdbotChatResponse = {
            status: 0,
            message: "",
            chatOutput: chatOutput,
        };
        res.status(200).json(response);
    }
}

export default Idbot;
