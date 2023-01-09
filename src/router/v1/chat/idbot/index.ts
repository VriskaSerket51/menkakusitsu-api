import { Request, Response } from "express";
import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import { HttpException } from "../../../../exceptions";
import Chat from "..";
import fetch from "node-fetch";

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
        if (!request.chatInput) {
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
