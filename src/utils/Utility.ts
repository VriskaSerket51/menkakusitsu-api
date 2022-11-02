import * as v1 from "@common-jshs/menkakusitsu-lib/v1";
import fs from "fs";
import path from "path";
import { sendPush } from "../firebase";
import { query } from "../mysql";
import cryptoJs from "crypto-js";
import config from "../config";

export const aes256Encrypt = (data: string, key: string = config.aesKey) => {
    return cryptoJs.AES.encrypt(data, key).toString();
};

export const aes256Decrypt = (data: string, key: string = config.aesKey) => {
    return cryptoJs.AES.decrypt(data, key).toString(cryptoJs.enc.Utf8);
};

export const readAllFiles = (
    dirName: string,
    fileNames: string[],
    filter?: (fileName: string) => boolean
) => {
    fs.readdirSync(dirName, { withFileTypes: true }).forEach((dir) => {
        if (dir.isDirectory()) {
            readAllFiles(path.join(dirName, dir.name), fileNames, filter);
        } else if (!filter || filter(dir.name)) {
            fileNames.push(path.join(dirName, dir.name));
        }
    });
};

export const parseBearer = (bearer: string) => {
    return getJwtPayload(bearer.split("Bearer ")[1]);
};

export const getJwtPayload = (jwt: string) => {
    return JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString());
};

export const getUserInfo = async () => {
    const userInfo: v1.UserInfo[] = (await query(
        "SELECT UID as uid, name FROM user",
        []
    )) as any;
    return userInfo;
};

export const getStudentInfo = async (
    uid: number
): Promise<v1.UserInfo | null> => {
    const getStudentInfoQuery = await query(
        "SELECT student_ID, name FROM user WHERE UID=?",
        [uid]
    );
    if (!getStudentInfoQuery || getStudentInfoQuery.length === 0) {
        return null;
    }
    return {
        uid: uid,
        name: getStudentInfoQuery[0].name,
        value: `${getStudentInfoQuery[0].student_ID} ${getStudentInfoQuery[0].name}`,
    };
};

export const getTeacherInfo = async (
    uid: number
): Promise<v1.UserInfo | null> => {
    const getTeacherInfoQuery = await query(
        "SELECT student_ID, name FROM user WHERE UID=? AND teacher_flag=1",
        [uid]
    );
    if (!getTeacherInfoQuery || getTeacherInfoQuery.length === 0) {
        return null;
    }
    return {
        uid: uid,
        name: getTeacherInfoQuery[0].name,
        value: `${getTeacherInfoQuery[0].name} 선생님`,
    };
};

export const escapeUserName = (name: string): string => {
    const splited = name.split("");
    splited[1] = "*";
    return splited.join("");
};

export const sendPushToUser = async (
    targetUid: number,
    title: string,
    body: string,
    link?: string
) => {
    const selectTokenQuery = await query(
        "SELECT token FROM push_token WHERE UID=?",
        [targetUid]
    );
    for (const pushToken of selectTokenQuery) {
        if (pushToken.token) {
            sendPush(pushToken.token, title, body, link);
        }
    }
};
