import { Request, Response } from "express";
import { Permission, v1 } from "@common-jshs/menkakusitsu-lib";
import V1 from "..";
import { execute, query } from "common-api-ts";
import { ResponseException, HttpException } from "common-api-ts";
import { createAccessToken, createRefreshoken } from "common-api-ts";
import {
    aes256Decrypt,
    aes256Encrypt,
    getJwtPayload,
    parseBearer,
} from "../../../utils";
import dayjs from "dayjs";
import { Master } from "../../../utils/Constant";

class Auth extends V1 {
    constructor() {
        super();
        this.setPath("/auth");
        this.models = [
            {
                method: "post",
                path: "/account",
                controller: this.onPostRegister,
            },
            {
                method: "delete",
                path: "/account",
                permission: Permission.Dev,
                controller: this.onDeleteSecession,
            },
            {
                method: "post",
                path: "/login",
                controller: this.onPostLogin,
            },
            {
                method: "post",
                path: "/refresh",
                authType: "refresh",
                controller: this.onPostRefresh,
            },
            {
                method: "delete",
                path: "/logout",
                authType: "access",
                controller: this.onDeleteLogout,
            },
            {
                method: "put",
                path: "/reset/password",
                controller: this.onPutForgotPassword,
            },
        ];
    }

    async onPostRegister(req: Request, res: Response) {
        
        const request: v1.PostRegisterRequest = req.body;
        if (
            !request.id ||
            request.sid == undefined ||
            !request.name ||
            !request.email ||
            !request.password
        ) {
            throw new HttpException(400);
        }
        const day = dayjs();
        if (day.month() > 3) {
            throw new ResponseException(-1, "신입생 등록 기간이 아닙니다.");
        }
        const cntQuery = await query(
            "SELECT * FROM (SELECT COUNT(id) as idCnt FROM user WHERE id=?) AS id, (SELECT COUNT(sid) as sidCnt FROM user WHERE sid=?) AS sid, (SELECT COUNT(name) as nameCnt FROM user WHERE name=?) AS name, (SELECT COUNT(email) as emailCnt FROM user WHERE email=?) AS email;",
            [request.id, request.sid, request.name, request.email]
        );
        if (!cntQuery || cntQuery.length == 0) {
            throw new HttpException(500);
        }
        if (cntQuery[0].idCnt > 0) {
            throw new ResponseException(-2, "이미 사용중인 ID입니다.");
        }
        if (cntQuery[0].sidCnt > 0) {
            throw new ResponseException(
                -3,
                "이미 가입된 학번입니다.\n자신이 가입한 적이 없다면 관리자에게 문의하세요\n2023학년도 사이트 관리자: " +
                    Master
            );
        }
        if (cntQuery[0].nameCnt > 0) {
            throw new ResponseException(
                -3,
                "이미 가입된 이름입니다.\n자신이 가입한 적이 없다면 관리자에게 문의하세요\n2023학년도 사이트 관리자: " +
                    Master
            );
        }
    }

    async onDeleteSecession(req: Request, res: Response) {
        const request: v1.DeleteSecessionRequest = req.body;
        if (!request.name) {
            throw new HttpException(400);
        }
        await execute("UPDATE user SET state=2 WHERE name=?", [request.name]);
        const response: v1.DeleteSecessionResponse = {
            status: 0,
            message: "",
        };
        res.status(200).json(response);
    }

    async onPostLogin(req: Request, res: Response) {
        const request: v1.PostLoginRequest = req.body;
        if (!request.id || !request.password) {
            throw new HttpException(400);
        }
        const loginQuery = await query(
            "SELECT uid, id, password, email, permission, state FROM user WHERE id=?",
            [/*aes256Encrypt*/ request.id]
        );

        if (!loginQuery || loginQuery.length === 0) {
            throw new ResponseException(-1, "아이디가 존재하지 않습니다.");
        }
        const userInfo = loginQuery[0];
        if (userInfo.password === /*aes256Encrypt*/ request.password) {
            if (userInfo.state == 0) {
                throw new ResponseException(-2, "승인 대기 중인 계정입니다.");
            }
            if (userInfo.state == 2) {
                throw new ResponseException(
                    -3,
                    "졸업, 휴학, 자퇴 등의 이유로 삭제된 계정입니다."
                );
            }
            const refreshToken = createRefreshoken({
                uid: userInfo.uid,
                id: /*aes256Decrypt*/ userInfo.id,
                permission: userInfo.permission,
            });
            await execute(
                "INSERT INTO refresh_token (uid, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE uid=?, token=?;",
                [userInfo.uid, refreshToken, userInfo.uid, refreshToken]
            );
            const callbacks: string[] = [];
            // if (userInfo.needChangePw) {
            //     callbacks.push("needChangePw");
            // }
            // if (!userInfo.email) {
            //     callbacks.push("needChangeEmail");
            // }
            const response: v1.PostLoginResponse = {
                status: 0,
                message: "",
                accessToken: createAccessToken({
                    uid: userInfo.uid,
                    id: /*aes256Decrypt*/ userInfo.id,
                    permission: userInfo.permission,
                }),
                refreshToken: refreshToken,
                callbacks: callbacks,
            };
            res.status(200).json(response);
        } else {
            throw new ResponseException(-2, "비밀번호가 틀렸습니다.");
        }
    }

    async onPostRefresh(req: Request, res: Response) {
        const payload = parseBearer(req.headers.authorization!);
        const request: v1.PostRefreshRequest = req.body;
        const refreshTokenQuery = await query(
            "SELECT token FROM refresh_token WHERE uid=?",
            [payload.uid]
        );

        if (
            !refreshTokenQuery ||
            refreshTokenQuery.length === 0 ||
            !refreshTokenQuery[0].token
        ) {
            throw new ResponseException(-1, "로그아웃 된 계정입니다.");
        }

        const originPayload = getJwtPayload(refreshTokenQuery[0].token);

        if (payload.jti != originPayload.jti) {
            await execute("UPDATE refresh_token SET token=NULL WHERE uid=?", [
                payload.uid,
            ]);

            throw new ResponseException(
                -2,
                "다른 기기에서의 접속이 감지되었습니다."
            );
        }

        const refreshToken = createRefreshoken({
            uid: payload.uid,
            id: payload.id,
            permission: payload.permission,
        });
        await execute(
            "INSERT INTO refresh_token (uid, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE uid=?, token=?;",
            [payload.uid, refreshToken, payload.uid, refreshToken]
        );
        const response: v1.PostRefreshResponse = {
            status: 0,
            message: "",
            accessToken: createAccessToken({
                uid: payload.uid,
                id: payload.id,
                permission: payload.permission,
            }),
            refreshToken: refreshToken,
        };
        res.status(200).json(response);
    }

    async onDeleteLogout(req: Request, res: Response) {
        const request: v1.DeleteLogoutRequest = req.body;
        const payload = parseBearer(req.headers.authorization!);
        await execute("UPDATE refresh_token SET token=NULL WHERE uid=?", [
            payload.uid,
        ]);
        const response: v1.DeleteLogoutResponse = {
            status: 0,
            message: "",
        };
        res.status(200).json(response);
    }

    async onPutForgotPassword(req: Request, res: Response) {
        const request: v1.PutForgotPasswordRequest = req.body;
        if (!request.id || !request.email) {
            throw new HttpException(400);
        }
        request.id = aes256Encrypt(request.id);
        request.email = aes256Encrypt(request.email);

        const userInfoQuery = await query("SELECT * FROM user WHERE id=?", [
            request.id,
        ]);
        if (!userInfoQuery || userInfoQuery.length === 0) {
            throw new ResponseException(-1, "존재하지 않는 사용자입니다.");
        }
        const userInfo = userInfoQuery[0];

        if (!userInfo.email) {
            throw new ResponseException(
                -2,
                "복구 이메일을 등록하시지 않으셔서 비밀번호 초기화가 불가능합니다.\n관리자에게 직접 문의해주십시오."
            );
        }
        if (request.email != userInfo.email) {
            throw new ResponseException(-3, "이메일을 잘못 입력하셨습니다.");
        }

        const response: v1.PutForgotPasswordResponse = {
            status: 0,
            message: "",
        };
        res.status(200).json(response);
    }
}

export default Auth;
