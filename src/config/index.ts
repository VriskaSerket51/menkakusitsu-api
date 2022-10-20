import dotenv from "dotenv";

const env = dotenv.config();

if (!env) {
    throw new Error("No env file.");
}

export default {
    port: process.env.PORT!,
    socketPort: process.env.SOCKET_PORT!,
    jwtSecret: process.env.JWT_SECRET!,
    db: {
        host: process.env.DB_HOST!,
        port: parseInt(process.env.DB_PORT!),
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_DATABASE!,
    },
};
