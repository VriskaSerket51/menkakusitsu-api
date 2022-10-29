import { Request, Response } from "express";
import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import V1 from "..";
import { defaultErrorHandler } from "../../../utils/ErrorHandler";
import { HttpException } from "../../../exceptions";
import { execute, query } from "../../../mysql";
import { sendPush } from "../../../firebase";
import { getJwtPayload, sendPushToUser } from "../../../utils/Utility";

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
}

export default User;
