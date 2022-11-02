import dotenv from "dotenv";
import App from "./app";
import config from "./config";
import { initializeFirebase } from "./firebase";
import { execute, query } from "./mysql";
import { initializeScheduler } from "./scheduler";
import { logger } from "./utils/Logger";
import { aes256Encrypt } from "./utils/Utility";

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
    const q = await query("SELECT * FROM user", []);
    for (const userInfo of q) {
        if (userInfo.password) {
            await execute("UPDATE user SET password=? WHERE UID=?", [
                aes256Encrypt(userInfo.password),
                Number(userInfo.UID),
            ]);
        }
    }
    throw new Error();
}
