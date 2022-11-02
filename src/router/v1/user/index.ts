import { Request, Response } from "express";
import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import V1 from "..";
import { defaultErrorHandler } from "../../../utils/ErrorHandler";
import { HttpException, ResponseException } from "../../../exceptions";
import { execute, query } from "../../../mysql";
import { sendPush } from "../../../firebase";
import {
    aes256Decrypt,
    aes256Encrypt,
    getJwtPayload,
    sendPushToUser,
} from "../../../utils/Utility";

class User extends V1 {
    constructor() {
        super();
        this.setPath("/user");
        this.models = [
            {
                method: "post",
                path: "/push",
                authType: "access",
                controller: User.onPostPush,
            },
            {
                method: "put",
                path: "/push",
                authType: "access",
                controller: User.onPutPush,
            },
            {
                method: "delete",
                path: "/push",
                authType: "access",
                controller: User.onDeletePush,
            },
            {
                method: "get",
                path: "/me",
                authType: "access",
                controller: User.onGetMyPrivateInfo,
            },
            {
                method: "put",
                path: "/me/email",
                authType: "access",
                controller: User.onPutEmail,
            },
            {
                method: "put",
                path: "/me/password",
                authType: "access",
                controller: User.onPutPassword,
            },
        ];
    }

    static async onPostPush(req: Request, res: Response) {
        try {
            const postPushRequest: v1.PostPushRequest = req.body;
            if (
                !postPushRequest.notification ||
                postPushRequest.targetUid === undefined
            ) {
                throw new HttpException(400);
            }
            sendPushToUser(
                postPushRequest.targetUid,
                postPushRequest.notification.title,
                postPushRequest.notification.body,
                postPushRequest.notification.link
            );
            const postPushResponse: v1.PostPushResponse = {
                status: 0,
                message: "",
            };
            res.status(200).json(postPushResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPutPush(req: Request, res: Response) {
        try {
            const putPushRequest: v1.PutPushRequest = req.body;
            if (!putPushRequest.pushToken || !putPushRequest.deviceId) {
                throw new HttpException(400);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            const cnt = (
                await query(
                    "SELECT COUNT(*) AS cnt FROM push_token WHERE UID=? AND device_ID=?",
                    [payload.uid, putPushRequest.deviceId]
                )
            )[0].cnt;
            if (cnt === 0) {
                await execute(
                    "INSERT INTO push_token(UID, token, device_ID, created_date) VALUE(?, ?, ?, NOW())",
                    [
                        payload.uid,
                        putPushRequest.pushToken,
                        putPushRequest.deviceId,
                    ]
                );
            } else {
                await execute(
                    "UPDATE push_token SET token=? WHERE UID=? AND device_ID=?",
                    [payload.uid, putPushRequest.deviceId]
                );
            }
            const putPushResponse: v1.PutPushResponse = {
                status: 0,
                message: "",
            };
            res.status(200).json(putPushResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onDeletePush(req: Request, res: Response) {
        try {
            const deletePushRequest: v1.DeletePushRequest = req.body;
            if (!deletePushRequest.devcieId) {
                throw new HttpException(400);
            }
            const payload = getJwtPayload(req.headers.authorization!);
            execute("DELETE FROM push_token WHERE UID=? AND device_ID=?", [
                payload.uid,
                deletePushRequest.devcieId,
            ]);
            const deletePushResponse: v1.DeletePushResponse = {
                status: 0,
                message: "",
            };
            res.status(200).json(deletePushResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onGetMyPrivateInfo(req: Request, res: Response) {
        try {
            const request: v1.GetMyPrivateInfoRequest = req.query as any;
            const payload = getJwtPayload(req.headers.authorization!);
            const getUserInfoQuery = await query(
                "SELECT * FROM user WHERE UID=?",
                [payload.uid]
            );
            if (!getUserInfoQuery || getUserInfoQuery.length === 0) {
                throw new HttpException(500);
            }
            const userInfo = getUserInfoQuery[0];
            const response: v1.GetMyPrivateInfoResponse = {
                status: 0,
                message: "",
                private: {
                    email: aes256Decrypt(userInfo.email),
                },
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPutEmail(req: Request, res: Response) {
        try {
            const request: v1.PutEmailRequest = req.body;
            const payload = getJwtPayload(req.headers.authorization!);
            const getUserInfoQuery = await query(
                "SELECT * FROM user WHERE UID=?",
                [payload.uid]
            );
            if (!getUserInfoQuery || getUserInfoQuery.length === 0) {
                throw new HttpException(500);
            }

            request.oldEmail = aes256Encrypt(request.oldEmail);
            request.newEmail = aes256Encrypt(request.newEmail);

            const userInfo = getUserInfoQuery[0];
            if (request.oldEmail != userInfo.email) {
                throw new ResponseException(
                    -1,
                    "이전 이메일을 알맞게 입력하지 않았습니다."
                );
            }
            const getEmailCntQuery = await query(
                "SELECT COUNT(*) as cnt FROM user WHERE email=?",
                [request.newEmail]
            );
            if (Number(getEmailCntQuery[0].cnt!) > 0) {
                throw new ResponseException(
                    -2,
                    "다른 사람이 사용 중인 이메일입니다."
                );
            }
            await execute("UPDATE user SET email=? WHERE UID=?", [
                request.newEmail,
                payload.uid,
            ]);
            const response: v1.PutEmailResponse = {
                status: 0,
                message: "",
                newEmail: request.newEmail,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPutPassword(req: Request, res: Response) {
        try {
            const request: v1.PutPasswordRequest = req.body;
            const payload = getJwtPayload(req.headers.authorization!);
            const getUserInfoQuery = await query(
                "SELECT * FROM user WHERE UID=?",
                [payload.uid]
            );
            if (!getUserInfoQuery || getUserInfoQuery.length === 0) {
                throw new HttpException(500);
            }

            request.oldPassword = aes256Encrypt(request.oldPassword);
            request.newPassword = aes256Encrypt(request.newPassword);

            const userInfo = getUserInfoQuery[0];
            if (request.oldPassword != userInfo.password) {
                throw new ResponseException(
                    -1,
                    "이전 비밀번호를 알맞게 입력하지 않았습니다."
                );
            }
            await execute(
                "UPDATE user SET password=?, needChangePw=0 WHERE UID=?",
                [request.newPassword, payload.uid]
            );
            const response: v1.PutEmailResponse = {
                status: 0,
                message: "",
                newEmail: request.newPassword,
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }
}

export default User;
