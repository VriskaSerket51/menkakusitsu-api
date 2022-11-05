import { SHA512 } from "crypto-js";
import dotenv from "dotenv";
import App from "./app";
import config from "./config";
import { initializeFirebase } from "./firebase";
import { execute, query } from "./mysql";
import { initializeScheduler } from "./scheduler";
import { logger } from "./utils/Logger";
import { aes256Decrypt, aes256Encrypt } from "./utils/Utility";

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
    /*const e = [
        {
            when: "2022-11-22",
            teacherName: "김석종",
        },
        {
            when: "2022-11-23",
            teacherName: "고경석",
        },
        {
            when: "2022-11-24",
            teacherName: "김민철",
        },
        {
            when: "2022-11-28",
            teacherName: "김명욱",
        },
        {
            when: "2022-11-29",
            teacherName: "김정민",
        },
        {
            when: "2022-11-30",
            teacherName: "김태경",
        },
    ];
    e.forEach(async (e, idx) => {
        const q = await query("SELECT UID as uid FROM user WHERE ID=?", [
            e.teacherName,
        ]);
        await execute(
            "INSERT INTO specialroom_manager(`when`, `teacherUid`) VALUE(?, ?)",
            [e.when, q[0].uid]
        );
    });*/
    /*const q = await query("SELECT * FROM user", []);
    for (const userInfo of q) {
        if (userInfo.email) {
            await execute("UPDATE user SET email=? WHERE UID=?", [
                aes256Decrypt(userInfo.email),
                Number(userInfo.UID),
            ]);
        }
    }*/
    // throw new Error();
}
