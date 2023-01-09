import { SHA512 } from "crypto-js";
import dotenv from "dotenv";
import App from "./app";
import config from "./config";
import { initializeFirebase } from "./firebase";
import { execute, query } from "./mysql";
import { initializeScheduler } from "./scheduler";
import { logger } from "./utils/Logger";
import { aes256Decrypt, aes256Encrypt } from "./utils";

dotenv.config();
const port = parseInt(config.port);

// testFunction();
initializeFirebase();
initializeScheduler();
runExpressApp();

function runExpressApp() {
    const app = new App();
    app.run(
        port,
        () => {
            logger.info(`Server started with port: ${port}`);
        },
        (error) => {
            logger.error(error);
        }
    );
}

async function testFunction() {
    const e = [
        {
            when: "2022-12-5",
            teacherName: "유지호",
        },
        {
            when: "2022-12-6",
            teacherName: "이경진",
        },
        {
            when: "2022-12-7",
            teacherName: "양은심",
        },
        {
            when: "2022-12-8",
            teacherName: "정재안",
        },
        {
            when: "2022-12-12",
            teacherName: "최정호",
        },
        {
            when: "2022-12-13",
            teacherName: "허만영",
        },
        {
            when: "2022-12-14",
            teacherName: "김민철",
        },
        {
            when: "2022-12-15",
            teacherName: "강지현",
        },
        {
            when: "2022-12-19",
            teacherName: "홍은경",
        },
        {
            when: "2022-12-20",
            teacherName: "진우용",
        },
        {
            when: "2022-12-21",
            teacherName: "현지수",
        },
        {
            when: "2022-12-22",
            teacherName: "이상규",
        },
        {
            when: "2022-12-26",
            teacherName: "고경석",
        },
        {
            when: "2022-12-27",
            teacherName: "고희선",
        },
        {
            when: "2022-12-28",
            teacherName: "김명욱",
        },
        {
            when: "2022-12-29",
            teacherName: "김민철",
        },
    ];
    e.forEach(async (e, idx) => {
        const q = await query("SELECT uid FROM user WHERE id=?", [
            e.teacherName,
        ]);
        await execute(
            "INSERT INTO specialroom_manager(`when`, `teacherUid`) VALUE(?, ?)",
            [e.when, q[0].uid]
        );
    });
    // const q = await query("SELECT * FROM user", []);
    // for (const userInfo of q) {
    //     if (userInfo.email) {
    //         await execute("UPDATE user SET email=? WHERE uid=?", [
    //             aes256Decrypt(userInfo.email),
    //             Number(userInfo.uid),
    //         ]);
    //     }
    // }
    // throw new Error();
}
