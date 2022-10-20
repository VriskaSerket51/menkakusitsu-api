import dotenv from "dotenv";
import App from "./app";
import config from "./config";
import { initializeFirebase } from "./firebase";
import { logger } from "./utils/Logger";

dotenv.config();
const port = parseInt(config.port);

initializeFirebase();

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
