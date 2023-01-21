import dotenv from "dotenv";
import path from "path";

if (process.env.NODE_ENV === "production") {
    dotenv.config({
        path: path.join(__dirname, "..", "..", ".env.production"),
    });
} else if (process.env.NODE_ENV === "development") {
    dotenv.config({
        path: path.join(__dirname, "..", "..", ".env.development"),
    });
} else {
    throw new Error("no process.env.NODE_ENV");
}

export default {
    port: process.env.PORT!,
    socketPort: process.env.SOCKET_PORT!,
    jwtSecret: process.env.JWT_SECRET!,
    fileServerUri: process.env.FILE_SERVER_URI!,
    fileServerUriInner: process.env.FILE_SERVER_URI_INNER!,
    fileServerAuthKey: process.env.FILE_SERVER_AUTH_KEY!,
    aesKey: process.env.AES_KEY!,
    aesIv: process.env.AES_IV!,
    db: {
        host: process.env.DB_HOST!,
        port: parseInt(process.env.DB_PORT!),
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_DATABASE!,
    },
    webPrefix: process.env.WEB_PREFIX!,
};
