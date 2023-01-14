import fs from "fs";
import path from "path";
import cryptoJs from "crypto-js";
import config from "../config";
import { TokenPayload } from "@common-jshs/menkakusitsu-lib";

export const aes256Encrypt = (
    data: string,
    key: string = config.aesKey,
    iv: string = config.aesIv
) => {
    return cryptoJs.AES.encrypt(data, cryptoJs.enc.Utf8.parse(key), {
        iv: cryptoJs.enc.Utf8.parse(iv),
        padding: cryptoJs.pad.Pkcs7,
        mode: cryptoJs.mode.CBC,
    }).toString();
};

export const aes256Decrypt = (
    data: string,
    key: string = config.aesKey,
    iv: string = config.aesIv
) => {
    return cryptoJs.AES.decrypt(data, cryptoJs.enc.Utf8.parse(key), {
        iv: cryptoJs.enc.Utf8.parse(iv),
        padding: cryptoJs.pad.Pkcs7,
        mode: cryptoJs.mode.CBC,
    }).toString(cryptoJs.enc.Utf8);
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

export const getJwtPayload = (jwt: string): TokenPayload => {
    return Object.assign(
        new TokenPayload(),
        JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString())
    );
};

export const escapeUserName = (name: string): string => {
    const splited = name.split("");
    splited[1] = "*";
    return splited.join("");
};
