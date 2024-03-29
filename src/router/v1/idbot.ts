import CommonApi from "@ireves/common-api";
import { v1 } from "@common-jshs/menkakusitsu-lib";
import { Request, Response } from "express";
import fetch from "node-fetch";

import Chat from "@/router/v1/chat";
import { Sanitizer } from "@/utils";

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
    if (!Sanitizer.sanitizeRequest(request, "GetIdbotChatRequest")) {
      throw new CommonApi.HttpException(400);
    }

    let chatOutput: string;
    try {
      const resp = await fetch(
        `http://127.0.0.1:3001/idbot/message?chatInput=${request.chatInput}`
      );
      if (resp.status != 200) {
        throw new CommonApi.ResponseException(
          -1,
          "이디봇에 에러가 발생하였습니다."
        );
      }

      chatOutput = ((await resp.json()) as any).chatOutput;
    } catch (error) {
      CommonApi.logger.error(error);
      throw new CommonApi.ResponseException(
        -2,
        "이디봇이 작동하고 있지 않습니다."
      );
    }

    const response: v1.GetIdbotChatResponse = {
      status: 0,
      message: "",
      chatOutput: chatOutput,
    };
    res.status(200).json(response);
  }
}

export default Idbot;
