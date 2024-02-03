import { TokenPayload } from "@common-jshs/menkakusitsu-lib";
import fs from "fs";
import path from "path";
import cryptoJs from "crypto-js";
import jwt from "jsonwebtoken";

import config from "@/config";

export const readFromFileFolder = (fileName: string) => {
  return fs.readFileSync(
    path.join(__dirname, "..", "..", "files", fileName),
    "utf-8"
  );
};

export const checkAuthAsync = async (bearer: string) => {
  return new Promise<boolean>((resolve) => {
    if (!bearer || !bearer.startsWith("Bearer ")) {
      resolve(false);
      return;
    }

    const jwtToken = bearer.split("Bearer ")[1];
    jwt.verify(jwtToken, config.jwtSecret, (error, decoded) => {
      if (error?.message === "jwt expired") {
        resolve(false);
        return;
      } else if (
        !decoded ||
        error?.message === "invalid token" ||
        (decoded as any).type !== "access"
      ) {
        resolve(false);
        return;
      } else if (error) {
        resolve(false);
        return;
      } else {
        resolve(true);
        return;
      }
    });
  });
};

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
