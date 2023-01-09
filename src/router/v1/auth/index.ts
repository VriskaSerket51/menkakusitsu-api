import { Request, Response } from "express";
import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import V1 from "..";
import { execute, query } from "../../../mysql";
import { ResponseException, HttpException } from "../../../exceptions";
import { createAccessToken, createRefreshoken } from "../../../middlewares/jwt";
import {
    aes256Decrypt,
    aes256Encrypt,
    getJwtPayload,
    parseBearer,
} from "../../../utils";

class Auth extends V1 {
    constructor() {
        super();
        this.setPath("/auth");
        this.models = [
            {
                method: "post",
                path: "/register",
                controller: this.onPostRegister,
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
            !request.name ||
            !request.email ||
            !request.password
        ) {
            throw new HttpException(400);
        }
        throw new HttpException(403);
    }

    async onPostLogin(req: Request, res: Response) {
        const request: v1.PostLoginRequest = req.body;
        if (!request.id || !request.password) {
            throw new HttpException(400);
        }
        const loginQuery = await query(
            "SELECT uid, id, password, email, needChangePw, isTeacher , isDev FROM user WHERE id=?",
            [/*aes256Encrypt*/ request.id]
        );

        if (!loginQuery || loginQuery.length === 0) {
            throw new ResponseException(-1, "아이디가 존재하지 않습니다.");
        }
        const userInfo = loginQuery[0];
        if (userInfo.password === /*aes256Encrypt*/ request.password) {
            const refreshToken = createRefreshoken({
                uid: userInfo.uid,
                id: /*aes256Decrypt*/ userInfo.id,
                isTeacher: userInfo.isTeacher == 1,
                isDev: userInfo.isDev == 1,
            });
            await execute("UPDATE refresh_token SET token=? WHERE uid=?", [
                refreshToken,
                userInfo.uid,
            ]);
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
                    isTeacher: userInfo.isTeacher == 1,
                    isDev: userInfo.isDev == 1,
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
            isTeacher: payload.isTeacher,
            isDev: payload.isDev,
        });
        await execute("UPDATE refresh_token SET token=? WHERE uid=?", [
            refreshToken,
            payload.uid,
        ]);
        const response: v1.PostRefreshResponse = {
            status: 0,
            message: "",
            accessToken: createAccessToken({
                uid: payload.uid,
                id: payload.id,
                isTeacher: payload.isTeacher,
                isDev: payload.isDev,
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
