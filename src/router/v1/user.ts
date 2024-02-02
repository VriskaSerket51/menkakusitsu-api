import CommonApi from "@ireves/common-api";
import { v1 } from "@common-jshs/menkakusitsu-lib";
import { Request, Response } from "express";

import V1 from ".";
import { Api, Utility, Sanitizer } from "../../utils";

class User extends V1 {
  constructor() {
    super();
    this.setPath("/user");
    this.models = [
      {
        method: "post",
        path: "/push",
        authType: "access",
        controller: this.onPostPush,
      },
      {
        method: "put",
        path: "/push",
        authType: "access",
        controller: this.onPutPush,
      },
      {
        method: "delete",
        path: "/push",
        authType: "access",
        controller: this.onDeletePush,
      },
      {
        method: "get",
        path: "/me",
        authType: "access",
        controller: this.onGetMyPrivateInfo,
      },
      {
        method: "put",
        path: "/me/email",
        authType: "access",
        controller: this.onPutEmail,
      },
      {
        method: "put",
        path: "/me/password",
        authType: "access",
        controller: this.onPutPassword,
      },
    ];
  }

  async onPostPush(req: Request, res: Response) {
    const request: v1.PostPushRequest = req.body;
    if (!Sanitizer.sanitizeRequest(request, "PostPushRequest")) {
      throw new CommonApi.HttpException(400);
    }

    Api.sendPushToUser(
      request.targetUid,
      request.notification.title,
      request.notification.body,
      request.notification.link
    );
    const postPushResponse: v1.PostPushResponse = {
      status: 0,
      message: "",
    };
    res.status(200).json(postPushResponse);
  }

  async onPutPush(req: Request, res: Response) {
    const request: v1.PutPushRequest = req.body;
    if (!Sanitizer.sanitizeRequest(request, "PutPushRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const payload = Utility.getJwtPayload(req.headers.authorization!);
    const push_token_count = await CommonApi.getFirstAsync(
      "SELECT COUNT(*) AS cnt FROM push_token WHERE uid=? AND deviceId=?",
      [payload.uid, request.deviceId]
    );

    if (!push_token_count) {
      throw new CommonApi.HttpException(500);
    }
    const cnt = push_token_count.cnt;
    if (cnt === 0) {
      await CommonApi.runAsync(
        "INSERT INTO push_token(uid, token, deviceId, createdDate) VALUE(?, ?, ?, NOW())",
        [payload.uid, request.pushToken, request.deviceId]
      );
    } else {
      await CommonApi.runAsync(
        "UPDATE push_token SET token=? WHERE uid=? AND deviceId=?",
        [payload.uid, request.deviceId]
      );
    }
    const putPushResponse: v1.PutPushResponse = {
      status: 0,
      message: "",
    };
    res.status(200).json(putPushResponse);
  }

  async onDeletePush(req: Request, res: Response) {
    const request: v1.DeletePushRequest = req.body;
    if (!Sanitizer.sanitizeRequest(request, "DeletePushRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const payload = Utility.getJwtPayload(req.headers.authorization!);
    CommonApi.runAsync("DELETE FROM push_token WHERE uid=? AND deviceId=?", [
      payload.uid,
      request.devcieId,
    ]);
    const deletePushResponse: v1.DeletePushResponse = {
      status: 0,
      message: "",
    };
    res.status(200).json(deletePushResponse);
  }

  async onGetMyPrivateInfo(req: Request, res: Response) {
    const request: v1.GetMyPrivateInfoRequest = req.query as any;
    if (!Sanitizer.sanitizeRequest(request, "GetMyPrivateInfoRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const payload = Utility.getJwtPayload(req.headers.authorization!);
    const user = await CommonApi.getFirstAsync(
      "SELECT * FROM user WHERE uid=?",
      [payload.uid]
    );
    if (!user) {
      throw new CommonApi.HttpException(500);
    }

    const response: v1.GetMyPrivateInfoResponse = {
      status: 0,
      message: "",
      private: {
        email: /*aes256Decrypt*/ user.email,
      },
    };
    res.status(200).json(response);
  }

  async onPutEmail(req: Request, res: Response) {
    const request: v1.PutEmailRequest = req.body;
    if (!Sanitizer.sanitizeRequest(request, "PutEmailRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const payload = Utility.getJwtPayload(req.headers.authorization!);
    const user = await CommonApi.getFirstAsync(
      "SELECT * FROM user WHERE uid=?",
      [payload.uid]
    );
    if (!user) {
      throw new CommonApi.HttpException(500);
    }

    // request.oldEmail = aes256Encrypt(request.oldEmail);
    // request.newEmail = aes256Encrypt(request.newEmail);

    if (request.oldEmail != user.email) {
      throw new CommonApi.ResponseException(
        -1,
        "이전 이메일을 알맞게 입력하지 않았습니다."
      );
    }
    const email_cnt = await CommonApi.getFirstAsync(
      "SELECT COUNT(*) as cnt FROM user WHERE email=?",
      [request.newEmail]
    );
    if (!email_cnt) {
      throw new CommonApi.HttpException(500);
    }

    if (Number(email_cnt.cnt) > 0) {
      throw new CommonApi.ResponseException(
        -2,
        "다른 사람이 사용 중인 이메일입니다."
      );
    }
    await CommonApi.runAsync("UPDATE user SET email=? WHERE uid=?", [
      request.newEmail,
      payload.uid,
    ]);
    const response: v1.PutEmailResponse = {
      status: 0,
      message: "",
      newEmail: request.newEmail,
    };
    res.status(200).json(response);
  }

  async onPutPassword(req: Request, res: Response) {
    const request: v1.PutPasswordRequest = req.body;
    if (!Sanitizer.sanitizeRequest(request, "PutPasswordRequest")) {
      throw new CommonApi.HttpException(400);
    }

    const payload = Utility.getJwtPayload(req.headers.authorization!);
    const user = await CommonApi.getFirstAsync(
      "SELECT * FROM user WHERE uid=?",
      [payload.uid]
    );
    if (!user) {
      throw new CommonApi.HttpException(500);
    }

    // request.oldPassword = aes256Encrypt(request.oldPassword);
    // request.newPassword = aes256Encrypt(request.newPassword);

    if (request.oldPassword != user.password) {
      throw new CommonApi.ResponseException(
        -1,
        "이전 비밀번호를 알맞게 입력하지 않았습니다."
      );
    }
    await CommonApi.runAsync("UPDATE user SET password=? WHERE uid=?", [
      request.newPassword,
      payload.uid,
    ]);
    const response: v1.PutEmailResponse = {
      status: 0,
      message: "",
      newEmail: request.newPassword,
    };
    res.status(200).json(response);
  }
}

export default User;
