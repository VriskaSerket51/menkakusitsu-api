import { Request, Response, Router } from "express";
import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import V1 from "..";
import { execute, query } from "../../../mysql";
import { ResponseException, HttpException } from "../../../exceptions";
import { defaultErrorHandler } from "../../../utils/ErrorHandler";
import { createAccessToken, createRefreshoken } from "../../../middlewares/jwt";
import {
    aes256Decrypt,
    aes256Encrypt,
    getJwtPayload,
    parseBearer,
} from "../../../utils/Utility";

class Auth extends V1 {
    constructor() {
        super();
        this.setPath("/auth");
        this.models = [
            {
                method: "post",
                path: "/register",
                controller: Auth.onPostRegister,
            },
            {
                method: "post",
                path: "/login",
                controller: Auth.onPostLogin,
            },
            {
                method: "post",
                path: "/refresh",
                authType: "refresh",
                controller: Auth.onPostRefresh,
            },
            {
                method: "delete",
                path: "/logout",
                authType: "access",
                controller: Auth.onDeleteLogout,
            },
            {
                method: "put",
                path: "/reset/password",
                controller: Auth.onPutForgotPassword,
            },
        ];
    }

    static async onPostRegister(req: Request, res: Response) {
        try {
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
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPostLogin(req: Request, res: Response) {
        try {
            const postLoginRequest: v1.PostLoginRequest = req.body;
            if (!postLoginRequest.id || !postLoginRequest.password) {
                throw new HttpException(400);
            }
            const loginQuery = await query(
                "SELECT UID as uid, ID as id, password, email, needChangePw, teacher_flag as isTeacher, isDev FROM user WHERE ID=?",
                [aes256Encrypt(postLoginRequest.id)]
            );

            if (!loginQuery || loginQuery.length === 0) {
                throw new ResponseException(-1, "아이디가 존재하지 않습니다.");
            }
            const userInfo = loginQuery[0];
            if (
                userInfo.password === aes256Encrypt(postLoginRequest.password)
            ) {
                const refreshToken = createRefreshoken({
                    uid: userInfo.uid,
                    id: aes256Decrypt(userInfo.id),
                    isTeacher: userInfo.isTeacher === 1,
                    isDev: userInfo.isDev === 1,
                });
                await execute("UPDATE refresh_token SET token=? WHERE UID=?", [
                    refreshToken,
                    userInfo.uid,
                ]);
                const callbacks: string[] = [];
                if (userInfo.needChangePw) {
                    callbacks.push("needChangePw");
                }
                if (!userInfo.email) {
                    callbacks.push("needChangeEmail");
                }
                const postLoginResponse: v1.PostLoginResponse = {
                    status: 0,
                    message: "",
                    accessToken: createAccessToken({
                        uid: userInfo.uid,
                        id: aes256Decrypt(userInfo.id),
                        isTeacher: userInfo.teacher_flag === 1,
                        isDev: userInfo.isDev === 1,
                    }),
                    refreshToken: refreshToken,
                    callbacks: callbacks,
                };
                res.status(200).json(postLoginResponse);
            } else {
                throw new ResponseException(-2, "비밀번호가 틀렸습니다.");
            }
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPostRefresh(req: Request, res: Response) {
        try {
            const payload = parseBearer(req.headers.authorization!);
            const postRefreshRequest: v1.PostRefreshRequest = req.body;
            const refreshTokenQuery = await query(
                "SELECT token FROM refresh_token WHERE UID=?",
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

            if (payload.jti !== originPayload.jti) {
                await execute(
                    "UPDATE refresh_token SET token=NULL WHERE UID=?",
                    [payload.uid]
                );

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
            await execute("UPDATE refresh_token SET token=? WHERE UID=?", [
                refreshToken,
                payload.uid,
            ]);
            const postRefreshResponse: v1.PostRefreshResponse = {
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
            res.status(200).json(postRefreshResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onDeleteLogout(req: Request, res: Response) {
        try {
            const deleteLogoutRequest: v1.DeleteLogoutRequest = req.body;
            const payload = parseBearer(req.headers.authorization!);
            await execute("UPDATE refresh_token SET token=NULL WHERE UID=?", [
                payload.uid,
            ]);
            const deleteLogoutResponse: v1.DeleteLogoutResponse = {
                status: 0,
                message: "",
            };
            res.status(200).json(deleteLogoutResponse);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }

    static async onPutForgotPassword(req: Request, res: Response) {
        try {
            const request: v1.PutForgotPasswordRequest = req.body;
            if (!request.id || !request.email) {
                throw new HttpException(400);
            }
            const userInfoQuery = await query("SELECT * FROM user WHERE ID=?", [
                aes256Encrypt(request.id),
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
            if (!aes256Encrypt(request.email) != userInfo.email) {
                throw new ResponseException(
                    -3,
                    "이메일을 잘못 입력하셨습니다."
                );
            }

            const response: v1.PutForgotPasswordResponse = {
                status: 0,
                message: "",
            };
            res.status(200).json(response);
        } catch (error) {
            defaultErrorHandler(res, error);
        }
    }
}

export default Auth;
